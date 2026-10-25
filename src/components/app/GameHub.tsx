"use client";

import { useEffect, useState } from "react";
import { dailyNumber, dailyPoints, pathDone, type AppState, type PuzzleKind } from "@/lib/app/state";
import { boardFor, countsFor, type LiveHood } from "@/lib/app/live";
import { bonusFor, type BonusKind } from "@/lib/app/dailyContent";
import { BONUS_GAMES, ChoiceGame, GoodTurnGame, QuestGame } from "./Games";
import { PakalGame, PookkalamGame, PUZZLE_META, WeaveGame } from "./Puzzles";
import { Confetti, DoneMark, formatTime } from "./GameKit";
import { GAME_COLORS, GameGlyph, Trophy, type GameKind } from "./Icons";
import { Mask, NeighbourMask } from "./Mask";

export type Game = PuzzleKind | "help" | "quest" | BonusKind;

const BONUS_KINDS: BonusKind[] = ["lingo", "quiz", "poll"];

/** ✓ or ✗ for a played bonus game (a poll vote is always ✓), or null if not played. */
function bonusMark(state: AppState, kind: BonusKind): string | null {
  const result = state.daily.bonus?.[kind];
  if (!result) return null;
  const answer = bonusFor(kind, state.daily.key).answer;
  return !answer || result.pick === answer ? "✓" : "✗";
}

function puzzleLine(state: AppState, kind: PuzzleKind): string | null {
  const r = state.daily.puzzles?.[kind];
  if (!r) return null;
  return r.solved ? formatTime(r.timeMs) : "–";
}

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

export function shareText(state: AppState): string {
  const d = state.daily;
  const points = dailyPoints(d);
  const line = (kind: PuzzleKind) => {
    const v = puzzleLine(state, kind);
    return v ? `${PUZZLE_META[kind].emoji} ${PUZZLE_META[kind].name} ${v}` : "";
  };
  return [
    `Kavala #${dailyNumber(d.key)}`,
    line("weave") || `${PUZZLE_META.weave.emoji} ${PUZZLE_META.weave.name} –`,
    line("pookkalam") || `${PUZZLE_META.pookkalam.emoji} ${PUZZLE_META.pookkalam.name} –`,
    line("pakal"),
    `🤝 Good Turn ${d.help && d.help !== "skipped" ? "✓" : "–"}`,
    `🌱 Quest ${d.step === "done" || d.step === "checked-in" ? "✓" : "–"}`,
    ...BONUS_KINDS.map((k) => {
      const mark = bonusMark(state, k);
      return mark ? `${BONUS_GAMES[k].emoji} ${BONUS_GAMES[k].name} ${mark}` : "";
    }),
    points !== null ? `⭐ ${points} points` : "",
    state.streak > 1 ? `🔥 ${state.streak} day streak` : "",
    "Your friendly neighbourhood",
  ]
    .filter(Boolean)
    .join("\n");
}

const PATH_X = ["0px", "54px", "8px", "-50px"];

export default function GameHub({ state, update, notify, game, setGame, live }: Props) {
  const [now, setNow] = useState(Date.now());
  const [canShare, setCanShare] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const wasDone = useState(() => state.daily.done)[0];
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => clearInterval(t);
  }, []);
  // Confetti the first time the hub shows a freshly completed daily.
  useEffect(() => {
    if (state.daily.done && !wasDone && game === null) setCelebrate(true);
  }, [state.daily.done, wasDone, game]);

  const close = () => {
    setGame(null);
    window.scrollTo(0, 0);
  };
  if (game === "weave") return <WeaveGame state={state} update={update} onClose={close} />;
  if (game === "pookkalam") return <PookkalamGame state={state} update={update} onClose={close} />;
  if (game === "pakal") return <PakalGame state={state} update={update} onClose={close} />;
  if (game === "help") return <GoodTurnGame state={state} update={update} onClose={close} />;
  if (game === "quest") return <QuestGame state={state} update={update} onClose={close} />;
  if (game === "lingo" || game === "quiz" || game === "poll") return <ChoiceGame kind={game} state={state} update={update} onClose={close} />;

  const d = state.daily;
  const done = pathDone(d);
  const counts = countsFor(state, live);
  const board = boardFor(state, live);
  const points = dailyPoints(d);

  const steps: { id: Game & GameKind; name: string; sub: string; finished: boolean }[] = [
    {
      id: "weave",
      name: PUZZLE_META.weave.name,
      sub: d.puzzles?.weave ? (d.puzzles.weave.solved ? `${formatTime(d.puzzles.weave.timeMs)} · ${d.puzzles.weave.points} pts` : "Skipped") : "Logic puzzle",
      finished: done.weave,
    },
    {
      id: "pookkalam",
      name: PUZZLE_META.pookkalam.name,
      sub: d.puzzles?.pookkalam ? (d.puzzles.pookkalam.solved ? `${formatTime(d.puzzles.pookkalam.timeMs)} · ${d.puzzles.pookkalam.points} pts` : "Skipped") : "Logic puzzle",
      finished: done.pookkalam,
    },
    { id: "help", name: "Good Turn", sub: d.help ? "Helped a neighbour" : "Help a neighbour", finished: done.help },
    { id: "quest", name: "Quest", sub: d.step ? (d.step === "later" ? "Skipped" : "Done") : "One small step", finished: done.step },
  ];
  const finishedCount = steps.filter((s) => s.finished).length;
  const current = steps.find((s) => !s.finished)?.id;

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

  const pakal = d.puzzles?.pakal;
  const bonusTiles: { id: Game & GameKind; name: string; tag: string; mark: string | null }[] = [
    { id: "pakal", name: PUZZLE_META.pakal.name, tag: pakal ? (pakal.solved ? `${formatTime(pakal.timeMs)} · ${pakal.points} pts` : "Skipped") : PUZZLE_META.pakal.tagline, mark: pakal ? (pakal.solved ? "✓" : "–") : null },
    ...BONUS_KINDS.map((k) => {
      const mark = bonusMark(state, k);
      return { id: k, name: BONUS_GAMES[k].name, tag: mark ? `${mark} ${formatTime(d.bonus?.[k]?.timeMs ?? 0)}` : BONUS_GAMES[k].tagline, mark };
    }),
  ];

  return (
    <div className="hub">
      {celebrate && <Confetti />}
      <section className="daily-hero" aria-label={`Kavala Daily number ${dailyNumber(d.key)}`}>
        <div className="hero-row">
          <div>
            <div className="hero-kicker">Kavala Daily</div>
            <div className="hero-number">#{dailyNumber(d.key)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="hero-ml" lang="ml">ഇന്നത്തെ കളി</div>
            <div className="hero-count">Next in {countdown(msUntilNextDaily(d.key, now))}</div>
          </div>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={finishedCount}>
          <i style={{ "--pct": `${(finishedCount / 4) * 100}%`, "--fill": "var(--gold)" } as React.CSSProperties} />
        </div>
        <div className="hero-row">
          <span className="hero-left">{d.done ? "Daily complete" : finishedCount === 0 ? "Four steps · about five minutes" : `${4 - finishedCount} to go`}</span>
          <span className="hero-count">
            {counts.played} played today {counts.sample && <span className="tag">sample</span>}
          </span>
        </div>
        <div className="kasavu" aria-hidden="true" />
      </section>

      {d.done && (
        <section className="complete">
          <Trophy />
          <span className="complete-word">Daily complete!</span>
          <span className="complete-ml" lang="ml">കൊള്ളാം!</span>
          {points !== null && <span className="chip gold" style={{ justifySelf: "center" }}>⭐ {points} points today</span>}
          <pre className="share-box">{shareText(state)}</pre>
          <div className="two-col">
            <button className="btn ghost" onClick={share}>{canShare ? "Share" : "Copy"}</button>
            <a className="btn green" href={`https://wa.me/?text=${encodeURIComponent(shareText(state))}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
        </section>
      )}

      <div className="section-head">
        <span className="section-title">Today&apos;s path</span>
        <span className="section-ml" lang="ml">ഇന്നത്തെ വഴി</span>
      </div>
      <ol className="path">
        {steps.map((s, i) => {
          const c = GAME_COLORS[s.id];
          const isCurrent = s.id === current;
          return (
            <li key={s.id} style={{ "--x": PATH_X[i] } as React.CSSProperties}>
              {isCurrent && <span className="start-bubble" style={{ "--face": c.face } as React.CSSProperties}>{finishedCount === 0 ? "Start" : "Next"}</span>}
              <button
                className={`node ${s.finished ? "done" : ""} ${isCurrent ? "current" : ""}`}
                style={{ "--face": c.face, "--deep": c.deep } as React.CSSProperties}
                onClick={() => setGame(s.id)}
                aria-label={`${s.name}: ${s.finished ? "finished" : "play"}`}
              >
                <GameGlyph kind={s.id} />
                {s.finished && <DoneMark />}
              </button>
              <span className="node-label">{s.name}</span>
              <span className="node-sub">{s.sub}</span>
            </li>
          );
        })}
      </ol>

      <div className="section-head">
        <span className="section-title">More to play</span>
        <span className="section-ml">Just for fun · won&apos;t affect your streak</span>
      </div>
      <div className="tile-grid">
        {bonusTiles.map((t) => {
          const c = GAME_COLORS[t.id];
          return (
            <button key={t.id} className="tile" style={{ "--face": c.face, "--deep": c.deep } as React.CSSProperties} onClick={() => setGame(t.id)}>
              <span className="tile-icon"><GameGlyph kind={t.id} /></span>
              <span className="tile-name">{t.name}</span>
              <span className="tile-tag">{t.tag}</span>
              {t.mark && <span className="done-mark chip">{t.mark}</span>}
            </button>
          );
        })}
      </div>

      <section className="card board-card">
        <div className="section-head">
          <h2>Today&apos;s leaderboard {board.sample && <span className="tag">sample</span>}</h2>
        </div>
        <ol className="board">
          {board.rows.map((r, i) => (
            <li key={r.name} className={r.me ? "me" : ""}>
              <span className="rank">{i + 1}</span>
              {r.color && r.style ? <Mask color={r.color} style={r.style} size={30} /> : <NeighbourMask name={r.name} me={state} size={30} />}
              <span>{r.me ? `${r.name} (you)` : r.name}</span>
              <span className="pts">{r.points}</span>
            </li>
          ))}
        </ol>
        {points === null && <span className="muted">Solve a puzzle to get on the board.</span>}
      </section>
    </div>
  );
}
