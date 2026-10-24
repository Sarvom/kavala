"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { cellToLatLng, getResolution } from "h3-js";
import {
  bearingDegrees,
  compassWord,
  guessDistance,
  MAX_TRIES,
  SOLVE_RADIUS_M,
  spotPoints,
  spotSquare,
  verifyCheckin,
  warmth,
} from "@/lib/daily/score";
import { pickDailyPlace, searchRadiusFor, type SpotPlace } from "@/lib/daily/spotPlace";
import { fetchPlaces } from "@/lib/daily/fetchPlaces";
import { haversineMetres } from "@/lib/geo/filter";
import { useLocation } from "@/lib/geo/useLocation";
import { completeDaily, type AppState, type SpotGuess, type SpotResult } from "@/lib/app/state";
import { goodTurnFor, questFor } from "@/lib/app/dailyContent";
import type { MapGuess } from "./SpotMap";
import { Burst, GameFrame, buzz, formatTime, useElapsed } from "./GameKit";
import { NeighbourMask } from "./Mask";

const SpotMap = dynamic(() => import("./SpotMap"), { ssr: false });

type Update = (fn: (s: AppState) => AppState) => void;
type Notify = (message: string) => void;

export const SQUARE_EMOJI = { green: "🟩", yellow: "🟨", orange: "🟧", grey: "⬜" } as const;

const WARMTH_CLASS: Record<string, string> = {
  "Found it": "guess-found",
  Hot: "guess-hot",
  Warm: "guess-warm",
  Cold: "guess-cold",
  Freezing: "guess-cold",
};

export type PlaceLoad =
  | { status: "waiting" }
  | { status: "loading" }
  | { status: "ready"; place: SpotPlace }
  | { status: "error"; message: string; details: string[] };

/** How long a neighbourhood's place list is reused when OpenStreetMap can't be reached. */
const PLACE_LIST_MAX_AGE_MS = 7 * 86_400_000;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Caching is optional.
  }
}

/** Asks our server, then OpenStreetMap directly, for named places around a neighbourhood cell. */
async function loadPlaceList(cell: string): Promise<{ places: SpotPlace[] | null; details: string[] }> {
  const details: string[] = [];
  try {
    const res = await fetch(`/api/places?cell=${encodeURIComponent(cell)}`);
    const data = (await res.json()) as { ok: boolean; places?: SpotPlace[]; error?: string; details?: string[] };
    if (res.ok && data.ok) return { places: data.places ?? [], details };
    details.push(`Kavala server: ${data.error ?? res.status}`, ...(data.details ?? []));
  } catch {
    details.push("Kavala server could not be reached");
  }
  // Fall back to asking OpenStreetMap from this browser. It sends the
  // neighbourhood's centre, never the person's own location.
  const [lat, lng] = cellToLatLng(cell);
  const direct = await fetchPlaces(lat, lng, searchRadiusFor(getResolution(cell)), fetch, 12_000, true);
  if (direct.endpoint) return { places: direct.places, details };
  details.push(...direct.errors.map((e) => `from this browser: ${e}`));
  return { places: null, details };
}

/**
 * Loads today's Spot place for the neighbourhood. Today's pick is cached for
 * the day, and the neighbourhood's place list for a week, so Spot still works
 * on days the public OpenStreetMap servers are busy.
 */
export function useDailyPlace(state: AppState): [PlaceLoad, () => void] {
  const [load, setLoad] = useState<PlaceLoad>({ status: "waiting" });
  const [attempt, setAttempt] = useState(0);
  const hood = state.hood;
  const key = state.daily.key;

  useEffect(() => {
    if (!hood) return;
    const pickKey = `kavala-spot-v2-${key}-${hood.id}`;
    const listKey = `kavala-places-v1-${hood.id}`;
    const cachedPick = readJson<SpotPlace>(pickKey);
    if (cachedPick) {
      setLoad({ status: "ready", place: cachedPick });
      return;
    }
    let cancelled = false;
    setLoad({ status: "loading" });
    (async () => {
      const fresh = await loadPlaceList(hood.cells[0]);
      if (cancelled) return;
      let places = fresh.places;
      if (places !== null) {
        writeJson(listKey, { at: Date.now(), places });
      } else {
        const stored = readJson<{ at: number; places: SpotPlace[] }>(listKey);
        if (stored && Date.now() - stored.at < PLACE_LIST_MAX_AGE_MS) places = stored.places;
      }
      if (places === null) {
        setLoad({ status: "error", message: "OpenStreetMap place search is busy right now.", details: fresh.details });
        return;
      }
      const place = pickDailyPlace(places, key, hood.id);
      if (!place) {
        setLoad({ status: "error", message: "OpenStreetMap has no named public places around this neighbourhood yet.", details: [] });
        return;
      }
      writeJson(pickKey, place);
      setLoad({ status: "ready", place });
    })();
    return () => {
      cancelled = true;
    };
  }, [hood, key, attempt]);

  return [load, useCallback(() => setAttempt((a) => a + 1), [])];
}

/** Scrolls an element into view once `when` turns true, so results never hide below the fold. */
function useRevealOn(when: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (when) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [when]);
  return ref;
}

interface SpotProps {
  state: AppState;
  update: Update;
  onClose: () => void;
  load: PlaceLoad;
  retry: () => void;
}

export function SpotGame({ state, update, onClose, load, retry }: SpotProps) {
  const existing = state.daily.spot && state.daily.spot !== "skipped" ? state.daily.spot : null;
  const guesses: SpotGuess[] = state.daily.spotGuesses ?? [];
  const [pending, setPending] = useState<[number, number] | null>(null);
  const finished = !!existing;
  const place = load.status === "ready" ? load.place : null;
  const startedAt = state.daily.spotStartedAt;
  const elapsed = useElapsed(!finished && !!startedAt, startedAt);
  const resultRef = useRevealOn(finished);
  const center = state.hood ? (cellToLatLng(state.hood.cells[0]) as [number, number]) : ([9.9816, 76.2999] as [number, number]);

  // The clock starts once the place is on screen, not while it loads.
  useEffect(() => {
    if (place && !finished && !startedAt) update((s) => (s.daily.spotStartedAt ? s : { ...s, daily: { ...s.daily, spotStartedAt: Date.now() } }));
  }, [place, finished, startedAt, update]);

  function lockIn(target: SpotPlace) {
    if (!pending || finished) return;
    const distance = guessDistance({ lat: pending[0], lng: pending[1] }, target);
    const next = [...guesses, { lat: pending[0], lng: pending[1], distance }];
    setPending(null);
    const solved = distance <= SOLVE_RADIUS_M;
    const over = solved || next.length >= MAX_TRIES;
    buzz(solved ? [30, 40, 60] : 15);
    update((s) => {
      if (!over) return { ...s, daily: { ...s.daily, spotGuesses: next } };
      const best = Math.min(...next.map((g) => g.distance));
      const result: SpotResult = {
        place: target,
        distance: best,
        points: spotPoints(best),
        square: spotSquare(best),
        tries: next.map((g) => g.distance),
        guesses: next.map(({ lat, lng }) => ({ lat, lng })),
        solved,
        timeMs: elapsed,
      };
      return completeDaily({ ...s, daily: { ...s.daily, spotGuesses: next, spot: result } });
    });
  }

  const last = guesses[guesses.length - 1];
  const shown = finished ? (existing.guesses ?? []).map((g, i) => ({ ...g, distance: existing.tries?.[i] ?? existing.distance })) : guesses;
  const mapGuesses: MapGuess[] = shown.map((g) => ({ lat: g.lat, lng: g.lng, className: WARMTH_CLASS[warmth(g.distance)] }));
  const tries = finished ? existing.tries ?? [existing.distance] : guesses.map((g) => g.distance);

  return (
    <GameFrame title="Spot" accent="#3ddc97" elapsed={existing?.timeMs ?? elapsed} onClose={onClose}>
      {(load.status === "loading" || load.status === "waiting") && (
        <div className="game-card loading-card">
          <span className="spinner" aria-hidden="true" />
          <p>Picking today&apos;s place from OpenStreetMap…</p>
        </div>
      )}
      {load.status === "error" && (
        <div className="game-card">
          <p><strong>{load.message}</strong></p>
          <p className="muted">The public map servers are shared by everyone and sometimes get busy. Try again in a moment, or skip Spot today.</p>
          {load.details.length > 0 && (
            <details className="muted">
              <summary>What went wrong</summary>
              {load.details.join(" · ")}
            </details>
          )}
          <div className="row">
            <button className="btn" onClick={retry}>Try again</button>
            <button className="btn ghost" onClick={() => update((s) => completeDaily({ ...s, daily: { ...s.daily, spot: "skipped" } }))}>
              Skip today
            </button>
          </div>
        </div>
      )}
      {place && (
        <>
          <div className="clue-card">
            <span className="clue-label">Find</span>
            <span className="clue-name">{place.name}</span>
            <span className="clue-kind">{place.kind} · in your neighbourhood</span>
          </div>
          <div className="tries" aria-label={`${MAX_TRIES - tries.length} guesses left`}>
            {Array.from({ length: MAX_TRIES }, (_, i) => {
              const g = tries[i];
              return <span key={i} className={`try ${g === undefined ? "" : `sq-${spotSquare(g)}`}`}>{g === undefined ? i + 1 : SQUARE_EMOJI[spotSquare(g)]}</span>;
            })}
          </div>
          <SpotMap
            center={center}
            guesses={mapGuesses}
            pending={finished ? null : pending}
            target={finished ? { lat: place.lat, lng: place.lng, name: place.name } : null}
            onPick={finished ? undefined : (lat, lng) => setPending([lat, lng])}
          />
          {finished ? (
            <div className="result" ref={resultRef}>
              <Burst word={existing.solved ? "SPOTTED!" : "SO CLOSE!"} color={existing.solved ? "#3ddc97" : "#ffb833"} />
              <div className="result-stats">
                <div><b>{formatTime(existing.timeMs ?? 0)}</b><span>time</span></div>
                <div><b>{existing.distance.toLocaleString("en-IN")} m</b><span>closest</span></div>
                <div><b>{existing.points}</b><span>points</span></div>
              </div>
              <button className="btn-hero" onClick={onClose}>Back to games</button>
            </div>
          ) : (
            <>
              {last ? (
                <p className={`hint ${WARMTH_CLASS[warmth(last.distance)]}`}>
                  <strong>{warmth(last.distance)}</strong> · {last.distance.toLocaleString("en-IN")} m · head {compassWord(bearingDegrees(last, place))}
                </p>
              ) : (
                <p className="game-note">Tap the map where you think it is. Three guesses.</p>
              )}
              <button className="btn-hero" onClick={() => lockIn(place)} disabled={!pending}>
                {pending ? "Lock in guess" : "Tap the map to guess"}
              </button>
            </>
          )}
          <p className="fine">Place data © OpenStreetMap contributors</p>
        </>
      )}
    </GameFrame>
  );
}

export function GoodTurnGame({ state, update, onClose }: { state: AppState; update: Update; onClose: () => void }) {
  const turn = goodTurnFor(state.daily.key);
  const done = state.daily.help;
  const elapsed = useElapsed(!done);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const resultRef = useRevealOn(!!done);
  const top = turn.tips.reduce((a, b) => (b.picked > a.picked ? b : a));
  const pick = state.daily.helpPick;

  function finish(kind: "marked" | "answered", tipId: string, tipText?: string) {
    buzz(kind === "marked" && tipId === top.id ? [30, 40, 60] : 20);
    update((s) =>
      completeDaily({
        ...s,
        daily: {
          ...s.daily,
          help: kind,
          helpPick: tipId,
          helpText: tipText,
          helpAnsweredAt: kind === "answered" ? Date.now() : undefined,
          times: { ...s.daily.times, help: elapsed },
        },
      }),
    );
  }

  const word = pick === "mine" ? "GOOD TURN!" : pick === top.id ? "GREAT CALL!" : "GOOD TURN!";
  const firstName = (name: string) => name.split(" ")[0];

  return (
    <GameFrame title="Good Turn" accent="#ffb833" elapsed={state.daily.times?.help ?? elapsed} onClose={onClose}>
      <div className="speech">
        <NeighbourMask name={turn.asker} me={state} size={52} />
        <div className="bubble">
          <span className="bubble-name">{turn.asker} <span className="tag">sample</span></span>
          <p>{turn.question}</p>
        </div>
      </div>
      {done ? (
        <div className="result" ref={resultRef}>
          <Burst word={word} />
          {pick === "mine" ? (
            <>
              <div className="answer-card mine">
                <span className="answer-by">Your tip</span>
                <span>{state.daily.helpText}</span>
              </div>
              <p className="game-note">
                {state.daily.helpThanked
                  ? `${firstName(turn.asker)} found your tip useful. +1 Thanks`
                  : `Sent to ${firstName(turn.asker)}. You get a Thanks if it helps.`}
              </p>
            </>
          ) : (
            <>
              <p className="game-note">
                {pick === top.id
                  ? "Most neighbours trusted the same tip."
                  : `Most neighbours trusted ${firstName(top.by)}'s tip. Both can help.`}
              </p>
              <div className="poll" aria-label="What neighbours picked (sample)">
                {turn.tips.map((t) => (
                  <div key={t.id} className={`poll-row ${t.id === pick ? "mine" : ""}`} style={{ "--pct": `${t.picked}%` } as React.CSSProperties}>
                    <span className="poll-name">{t.id === pick ? `${firstName(t.by)} (your pick)` : firstName(t.by)}</span>
                    <span className="poll-pct">{t.picked}%</span>
                  </div>
                ))}
                <span className="muted">What neighbours picked <span className="tag">sample</span></span>
              </div>
            </>
          )}
          <div className="result-stats">
            <div><b>{formatTime(state.daily.times?.help ?? 0)}</b><span>time</span></div>
            <div><b>{firstName(turn.asker)}</b><span>helped</span></div>
          </div>
          <button className="btn-hero" onClick={onClose}>Back to games</button>
        </div>
      ) : (
        <>
          <p className="game-note">Which tip would you trust? Tap it, or add your own.</p>
          <div className="answer-cards">
            {turn.tips.map((t) => (
              <button key={t.id} className="answer-card" onClick={() => finish("marked", t.id)}>
                <span className="answer-by">
                  <NeighbourMask name={t.by} me={state} size={24} /> {t.by} <span className="tag">sample</span>
                </span>
                <span>{t.text}</span>
              </button>
            ))}
            {writing ? (
              <div className="answer-card writing">
                <label className="field" htmlFor="good-turn-text">
                  Your tip
                  <textarea id="good-turn-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="A name, a place, a time or a price" maxLength={280} autoFocus />
                </label>
                <button className="btn" disabled={!text.trim()} onClick={() => finish("answered", "mine", text.trim())}>Send tip</button>
              </div>
            ) : (
              <button className="answer-card add" onClick={() => setWriting(true)}>＋ I know a better one</button>
            )}
          </div>
        </>
      )}
    </GameFrame>
  );
}

export function QuestGame({ state, update, notify, onClose }: { state: AppState; update: Update; notify: Notify; onClose: () => void }) {
  const done = state.daily.step;
  const elapsed = useElapsed(!done);
  const loc = useLocation();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const resultRef = useRevealOn(!!done);
  const quest = questFor(state.daily.key);
  const place = state.daily.spot && state.daily.spot !== "skipped" ? state.daily.spot.place : null;

  const finish = useCallback(
    (step: "done" | "checked-in" | "later") => {
      if (step !== "later") buzz([30, 40, 60]);
      update((s) => completeDaily({ ...s, daily: { ...s.daily, step, times: { ...s.daily.times, step: elapsed } } }));
    },
    [update, elapsed],
  );

  useEffect(() => {
    if (!checking || !place) return;
    if (loc.cells && loc.position) {
      const ok = verifyCheckin(loc.cells.cellFine, place);
      const metres = Math.round(haversineMetres(loc.position.lat, loc.position.lng, place.lat, place.lng));
      loc.stop();
      setChecking(false);
      if (ok) {
        notify(`Checked in at ${place.name}.`);
        finish("checked-in");
      } else {
        setMessage(`You're about ${metres.toLocaleString("en-IN")} m away. Check in when you get there.`);
      }
    } else if (loc.status === "denied" || loc.status === "error" || loc.status === "unsupported") {
      setChecking(false);
      setMessage(loc.message);
    }
  }, [checking, loc, place, notify, finish]);

  return (
    <GameFrame title="Quest" accent="#b28cff" elapsed={state.daily.times?.step ?? elapsed} onClose={onClose}>
      {done ? (
        <div className="result" ref={resultRef}>
          <Burst word={done === "later" ? "TOMORROW!" : "QUEST DONE!"} color={done === "later" ? "#9fb0d8" : "#b28cff"} />
          <p className="game-note">
            {done === "checked-in"
              ? "Verified by your phone's location. Your position never left your phone."
              : done === "done"
                ? "Small steps make a neighbourhood."
                : "No problem. A new step comes tomorrow."}
          </p>
          <button className="btn-hero" onClick={onClose}>Back to games</button>
        </div>
      ) : (
        <>
          <p className="game-note">Pick one small step in the real world.</p>
          <div className="quest-card">
            {quest.neighbour ? (
              <NeighbourMask name={quest.neighbour} me={state} size={48} />
            ) : (
              <span className="quest-pin" aria-hidden="true">🌱</span>
            )}
            <div>
              <span className="quest-title">{quest.title}</span>
              <span className="muted">{quest.detail}</span>
            </div>
            <button className="btn" onClick={() => finish("done")}>Done</button>
          </div>
          {place && (
            <div className="quest-card">
              <span className="quest-pin" aria-hidden="true">📍</span>
              <div>
                <span className="quest-title">Visit {place.name}</span>
                <span className="muted">Today&apos;s Spot place. Your phone checks you&apos;re really there.</span>
              </div>
              <button
                className="btn"
                disabled={checking}
                onClick={() => {
                  setMessage(null);
                  setChecking(true);
                  loc.start();
                }}
              >
                {checking ? "Checking…" : "Check in"}
              </button>
            </div>
          )}
          {!place && <p className="muted center">Play Spot first to unlock a check-in at today&apos;s place.</p>}
          {message && <p className="hint guess-warm">{message}</p>}
          <button className="linkish center" onClick={() => finish("later")}>Skip today</button>
        </>
      )}
    </GameFrame>
  );
}
