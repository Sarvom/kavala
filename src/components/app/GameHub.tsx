"use client";

import { useEffect, useState } from "react";
import { dailyNumber, type AppState } from "@/lib/app/state";
import { boardFor, countsFor, type LiveHood } from "@/lib/app/live";
import { spotSquare } from "@/lib/daily/score";
import { GameIcon, formatTime } from "./GameKit";
import { GoodTurnGame, QuestGame, SpotGame, SQUARE_EMOJI, useDailyPlace } from "./Games";
import { Mask, NeighbourMask } from "./Mask";

export type Game = "spot" | "help" | "quest";

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  notify: (message: string) => void;
  /** The open game, kept by the app so it can hide the header and tabs while playing. */
  game: Game | null;
  setGame: (game: Game | null) => void;
  /** Real neighbourhood counts and board, or null while there is none yet. */
  live: LiveHood | null;
}

/** Milliseconds until the next daily, which starts at 6:00 AM India time (00:30 UTC). */
function msUntilNextDaily(dailyKey: string, now: number): number {
  const next = Date.parse(`${dailyKey}T00:30:00Z`) + 86_400_000;
  return Math.max(0, next - now);
}

function countdown(ms: number): string {
  const m = Math.floor(ms / 60_000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

function spotSquares(state: AppState): string {
  const spot = state.daily.spot && state.daily.spot !== "skipped" ? state.daily.spot : null;
  if (!spot) return "–";
  return (spot.tries ?? [spot.distance]).map((t) => SQUARE_EMOJI[spotSquare(t)]).join("");
}

export function shareText(state: AppState): string {
  const d = state.daily;
  const spot = d.spot && d.spot !== "skipped" ? d.spot : null;
  return [
    `Kavala #${dailyNumber(d.key)}`,
    `📍 Spot ${spotSquares(state)}${spot?.timeMs ? ` ${formatTime(spot.timeMs)}` : ""}`,
    `🤝 Good Turn ${d.help && d.help !== "skipped" ? "✓" : "–"}`,
    `🌱 Quest ${d.step === "done" || d.step === "checked-in" ? "✓" : "–"}`,
    state.streak > 1 ? `🔥 ${state.streak} day streak` : "",
    "Your friendly neighbourhood",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function GameHub({ state, update, notify, game, setGame, live }: Props) {
  const [now, setNow] = useState(Date.now());
  const [canShare, setCanShare] = useState(false);
  // Start loading today's Spot place as soon as the hub opens, so Spot opens instantly.
  const [placeLoad, retryPlace] = useDailyPlace(state);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => clearInterval(t);
  }, []);

  const close = () => {
    setGame(null);
    window.scrollTo(0, 0);
  };
  if (game === "spot") return <SpotGame state={state} update={update} onClose={close} load={placeLoad} retry={retryPlace} />;
  if (game === "help") return <GoodTurnGame state={state} update={update} onClose={close} />;
  if (game === "quest") return <QuestGame state={state} update={update} notify={notify} onClose={close} />;

  const d = state.daily;
  const spot = d.spot && d.spot !== "skipped" ? d.spot : null;
  const counts = countsFor(state, live);
  const inProgress = !spot && d.spot !== "skipped" && (d.spotGuesses?.length ?? 0) > 0;

  const tiles: { id: Game; name: string; tagline: string; color: string; status: string | null }[] = [
    {
      id: "spot",
      name: "Spot",
      tagline: inProgress ? `${3 - (d.spotGuesses?.length ?? 0)} guesses left` : "Find the place on the map",
      color: "#3ddc97",
      status: d.spot === "skipped" ? "Skipped" : spot ? `${spotSquares(state)}  ${formatTime(spot.timeMs ?? 0)}` : null,
    },
    {
      id: "help",
      name: "Good Turn",
      tagline: "Help a neighbour out",
      color: "#ffb833",
      status: d.help ? `✓ ${formatTime(d.times?.help ?? 0)}` : null,
    },
    {
      id: "quest",
      name: "Quest",
      tagline: "One small step outside",
      color: "#b28cff",
      status: d.step ? (d.step === "later" ? "Skipped today" : `✓ ${d.step === "checked-in" ? "Checked in" : "Done"}`) : null,
    },
  ];

  const left = tiles.filter((t) => !t.status).length;
  const board = boardFor(state, live);

  async function share() {
    const text = shareText(state);
    if (canShare) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      notify("Result copied");
    } catch {
      notify("Couldn't copy automatically.");
    }
  }

  return (
    <div className="hub">
      <header className="hub-head">
        <div>
          <span className="hub-kicker">Kavala Daily</span>
          <span className="hub-number">#{dailyNumber(d.key)}</span>
        </div>
        <div className="streak" aria-label={`${state.streak} day streak`}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="#ffb833" />
          </svg>
          <b>{state.streak}</b>
        </div>
      </header>

      {d.done ? (
        <section className="complete">
          <span className="complete-word">Daily complete!</span>
          <pre className="share-box">{shareText(state)}</pre>
          <div className="two-col">
            <button className="btn ghost" onClick={share}>{canShare ? "Share" : "Copy"}</button>
            <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(shareText(state))}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
          <span className="muted">Next daily in {countdown(msUntilNextDaily(d.key, now))}</span>
        </section>
      ) : (
        <p className="hub-left">{left === 3 ? "Three small games. About two minutes." : `${left} to go`}</p>
      )}

      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.id} className={`tile ${t.status ? "done" : ""}`} style={{ "--tile": t.color } as React.CSSProperties} onClick={() => setGame(t.id)}>
            <span className="tile-icon"><GameIcon kind={t.id} /></span>
            <span className="tile-text">
              <span className="tile-name">{t.name}</span>
              <span className="tile-tag">{t.status ?? t.tagline}</span>
            </span>
            <span className="tile-cta">{t.status ? "View" : inProgress && t.id === "spot" ? "Resume" : "Play"}</span>
          </button>
        ))}
      </div>
      <p className="hub-played">
        {counts.played} {counts.played === 1 ? "neighbour" : "neighbours"} played today {counts.sample && <span className="tag">sample</span>}
      </p>

      <section className="board-card">
        <span className="board-title">Today&apos;s leaderboard {board.sample && <span className="tag">sample</span>}</span>
        <ol className="board">
          {board.rows.map((r, i) => (
            <li key={r.name} className={r.me ? "me" : ""}>
              <span className="rank">{i + 1}</span>
              {r.color && r.style ? <Mask color={r.color} style={r.style} size={28} /> : <NeighbourMask name={r.name} me={state} size={28} />}
              <span>{r.me ? `${r.name} (you)` : r.name}</span>
              <span className="pts">{r.points}</span>
            </li>
          ))}
        </ol>
        {!spot && <span className="muted">Play Spot to get on the board.</span>}
      </section>
    </div>
  );
}
