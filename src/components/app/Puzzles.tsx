"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { completeDaily, type AppState, type PuzzleKind } from "@/lib/app/state";
import { checkWeave, extendThread, weaveFor } from "@/lib/puzzles/weave";
import { checkPookkalam, pookkalamConflicts, pookkalamFor } from "@/lib/puzzles/pookkalam";
import { checkPakalRaavu, MOON, pakalConflicts, pakalRaavuFor, SUN, type Mark } from "@/lib/puzzles/pakalRaavu";
import { puzzlePoints } from "@/lib/puzzles/score";
import { areAdjacent } from "@/lib/puzzles/rng";
import { GameFrame, ResultSheet, buzz, formatTime, useElapsed } from "./GameKit";
import { Flower, MoonPiece, SunPiece, GAME_COLORS } from "./Icons";

type Update = (fn: (s: AppState) => AppState) => void;

export const PUZZLE_META: Record<PuzzleKind, { name: string; ml: string; tagline: string; emoji: string }> = {
  weave: { name: "Web Weave", ml: "വല", tagline: "One thread through every square", emoji: "🕸️" },
  pookkalam: { name: "Pookkalam", ml: "പൂക്കളം", tagline: "One flower per row, column and colour", emoji: "🌼" },
  pakal: { name: "Pakal–Raavu", ml: "പകൽ–രാവ്", tagline: "Balance the suns and moons", emoji: "🌗" },
};

/** Shared puzzle plumbing: the saved board, the clock, finishing and skipping. */
function usePuzzle(kind: PuzzleKind, state: AppState, update: Update) {
  const result = state.daily.puzzles?.[kind];
  const work = state.daily.puzzleWork?.[kind];
  const startedAt = state.daily.puzzleStartedAt?.[kind];
  const elapsed = useElapsed(!result && !!startedAt, startedAt);

  useEffect(() => {
    if (!result && !startedAt) {
      update((s) => (s.daily.puzzleStartedAt?.[kind] ? s : { ...s, daily: { ...s.daily, puzzleStartedAt: { ...s.daily.puzzleStartedAt, [kind]: Date.now() } } }));
    }
  }, [kind, result, startedAt, update]);

  const setWork = useCallback(
    (next: number[]) => update((s) => (s.daily.puzzles?.[kind] ? s : { ...s, daily: { ...s.daily, puzzleWork: { ...s.daily.puzzleWork, [kind]: next } } })),
    [kind, update],
  );

  const finish = useCallback(
    (solved: boolean) => {
      buzz(solved ? [30, 40, 60] : 15);
      update((s) => {
        if (s.daily.puzzles?.[kind]) return s;
        const started = s.daily.puzzleStartedAt?.[kind] ?? Date.now();
        const timeMs = solved ? Date.now() - started : 0;
        const points = solved ? puzzlePoints(timeMs) : 0;
        return completeDaily({ ...s, daily: { ...s.daily, puzzles: { ...s.daily.puzzles, [kind]: { solved, timeMs, points } } } });
      });
    },
    [kind, update],
  );

  return { result, work, elapsed: result ? result.timeMs : elapsed, setWork, finish };
}

function PuzzleEnd({ kind, result, onClose }: { kind: PuzzleKind; result: { solved: boolean; timeMs: number; points: number }; onClose: () => void }) {
  const meta = PUZZLE_META[kind];
  if (!result.solved) {
    return <ResultSheet tone="calm" title="Skipped for today" sub={`A new ${meta.name} arrives at 6 AM.`} onAction={onClose} />;
  }
  const quick = result.timeMs < 60_000;
  return (
    <ResultSheet
      tone="good"
      title={quick ? `Lightning fast! +${result.points}` : `Solved! +${result.points}`}
      sub={quick ? "Under a minute. Neighbours will be impressed." : "Nicely done. Points go on today's board."}
      stats={[
        { label: "time", value: formatTime(result.timeMs) },
        { label: "points", value: String(result.points) },
      ]}
      onAction={onClose}
    />
  );
}

/** Which cell of an n × n board a pointer is over, or -1. */
function cellAt(el: HTMLElement, n: number, x: number, y: number): number {
  const rect = el.getBoundingClientRect();
  const c = Math.floor(((x - rect.left) / rect.width) * n);
  const r = Math.floor(((y - rect.top) / rect.height) * n);
  if (c < 0 || r < 0 || c >= n || r >= n) return -1;
  return r * n + c;
}

/* ---------------- Web Weave ---------------- */

export function WeaveGame({ state, update, onClose }: { state: AppState; update: Update; onClose: () => void }) {
  const puzzle = useMemo(() => weaveFor(state.daily.key), [state.daily.key]);
  const { result, work, elapsed, setWork, finish } = usePuzzle("weave", state, update);
  const path = useMemo(() => (result?.solved ? puzzle.solution : work ?? []), [result, work, puzzle]);
  const wrap = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const n = puzzle.size;
  const total = n * n;
  const check = checkWeave(puzzle, path);
  const passed = new Set(path.filter((c) => puzzle.anchors[c] !== undefined));
  const colors = GAME_COLORS.weave;

  useEffect(() => {
    if (!result && path.length > 0 && check.ok) finish(true);
  }, [check.ok, path.length, result, finish]);

  function touch(cell: number) {
    if (result || cell < 0) return;
    let next = path;
    const end = next[next.length - 1];
    // A fast swipe can skip squares in a straight line: walk them one at a time.
    if (end !== undefined && !next.includes(cell) && !areAdjacent(end, cell, n)) {
      const [er, ec, cr, cc] = [Math.floor(end / n), end % n, Math.floor(cell / n), cell % n];
      if (er === cr || ec === cc) {
        const step = er === cr ? Math.sign(cc - ec) : Math.sign(cr - er) * n;
        for (let at = end + step; ; at += step) {
          const extended = extendThread(puzzle, next, at);
          if (extended === next) break;
          next = extended;
          if (at === cell) break;
        }
      }
    } else {
      next = extendThread(puzzle, next, cell);
    }
    if (next !== path && next.length !== path.length) {
      if (next.length > path.length) buzz(6);
      setWork(next);
    }
  }

  const points = path.map((c) => `${(c % n) + 0.5},${Math.floor(c / n) + 0.5}`).join(" ");

  return (
    <GameFrame title={PUZZLE_META.weave.name} ml={PUZZLE_META.weave.ml} accent={colors.face} accentDeep={colors.deep} elapsed={elapsed} onClose={onClose}>
      <div className="rules">
        <span>Start at 1</span>
        <span>Pass every number in order</span>
        <span>Fill every square</span>
      </div>
      <div
        ref={wrap}
        className={`board-wrap weave ${result?.solved ? "solved" : ""}`}
        onPointerDown={(e) => {
          if (!wrap.current) return;
          drawing.current = true;
          wrap.current.setPointerCapture?.(e.pointerId);
          touch(cellAt(wrap.current, n, e.clientX, e.clientY));
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !wrap.current) return;
          const cell = cellAt(wrap.current, n, e.clientX, e.clientY);
          if (cell !== path[path.length - 1]) touch(cell);
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
      >
        <div className="pgrid" style={{ "--n": n } as React.CSSProperties} role="grid" aria-label={`Web Weave, ${n} by ${n}`}>
          {Array.from({ length: total }, (_, i) => {
            const anchor = puzzle.anchors[i];
            return (
              <button
                key={i}
                type="button"
                className={`pcell ${path.includes(i) ? "on" : ""}`}
                aria-label={anchor ? `Anchor ${anchor}` : `Square ${Math.floor(i / n) + 1}, ${(i % n) + 1}`}
                aria-pressed={path.includes(i)}
                tabIndex={-1}
              >
                {anchor && <span className={`anchor ${passed.has(i) ? "passed" : ""}`}>{anchor}</span>}
              </button>
            );
          })}
        </div>
        {path.length > 1 && (
          <svg className="thread" viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline points={points} strokeWidth={0.34} />
            <polyline className="silk" points={points} strokeWidth={0.07} />
          </svg>
        )}
      </div>
      {result ? (
        <PuzzleEnd kind="weave" result={result} onClose={onClose} />
      ) : (
        <>
          <p className="game-note">
            {path.length === 0
              ? "Drag from 1. Swipe back to undo."
              : path.length === total && !check.ok
                ? check.reason
                : `${total - path.length} squares to go`}
          </p>
          <div className="game-tools">
            <button className="btn ghost" onClick={() => setWork(path.slice(0, -1))} disabled={path.length === 0}>Undo</button>
            <button className="btn ghost" onClick={() => setWork([])} disabled={path.length === 0}>Clear</button>
          </div>
          <button className="linkish center" onClick={() => finish(false)}>Skip today</button>
        </>
      )}
    </GameFrame>
  );
}

/* ---------------- Pookkalam ---------------- */

/** Petal colours of an Onam carpet: marigold, orange, hibiscus, jasmine, leaf, violet, sky. */
const PETALS = ["#ffd166", "#ffa45b", "#f9a8c9", "#f6eed4", "#b5e48c", "#cdb4f6", "#9ed8f5", "#f4c095", "#a8e6cf"];

export function PookkalamGame({ state, update, onClose }: { state: AppState; update: Update; onClose: () => void }) {
  const puzzle = useMemo(() => pookkalamFor(state.daily.key), [state.daily.key]);
  const { result, work, elapsed, setWork, finish } = usePuzzle("pookkalam", state, update);
  const n = puzzle.size;
  const marks = useMemo(() => {
    if (result?.solved) return Array.from({ length: n * n }, (_, i) => (puzzle.solution[Math.floor(i / n)] === i % n ? 2 : 0));
    return work && work.length === n * n ? work : new Array<number>(n * n).fill(0);
  }, [result, work, puzzle, n]);
  const flowers = marks.flatMap((m, i) => (m === 2 ? [i] : []));
  const bad = pookkalamConflicts(puzzle, flowers);
  const solved = checkPookkalam(puzzle, flowers);
  const colors = GAME_COLORS.pookkalam;

  useEffect(() => {
    if (!result && solved) finish(true);
  }, [solved, result, finish]);

  function tap(i: number) {
    if (result) return;
    const next = [...marks];
    next[i] = (next[i] + 1) % 3;
    buzz(next[i] === 2 ? 12 : 5);
    setWork(next);
  }

  return (
    <GameFrame title={PUZZLE_META.pookkalam.name} ml={PUZZLE_META.pookkalam.ml} accent={colors.face} accentDeep={colors.deep} elapsed={elapsed} onClose={onClose}>
      <div className="rules">
        <span>One flower per row</span>
        <span>…per column</span>
        <span>…per colour</span>
        <span>No two touch</span>
      </div>
      <div className="board-wrap pookkalam">
        <div className="pgrid" style={{ "--n": n } as React.CSSProperties} role="grid" aria-label={`Pookkalam, ${n} by ${n}`}>
          {marks.map((m, i) => {
            const r = Math.floor(i / n);
            const c = i % n;
            const region = puzzle.regions[i];
            const edges = `${r > 0 && puzzle.regions[i - n] !== region ? "edge-t" : ""} ${c > 0 && puzzle.regions[i - 1] !== region ? "edge-l" : ""}`;
            return (
              <button
                key={i}
                type="button"
                className={`pcell ${edges} ${m === 2 && bad.has(i) ? "bad" : ""}`}
                style={{ "--rc": PETALS[region % PETALS.length] } as React.CSSProperties}
                onClick={() => tap(i)}
                aria-label={`Row ${r + 1}, column ${c + 1}, colour ${region + 1}: ${m === 2 ? "flower" : m === 1 ? "crossed out" : "empty"}`}
              >
                {m === 2 ? <Flower /> : m === 1 ? <span className="x" aria-hidden="true">✕</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      {result ? (
        <PuzzleEnd kind="pookkalam" result={result} onClose={onClose} />
      ) : (
        <>
          <p className="game-note">{bad.size > 0 ? "Two flowers clash. Look for the red squares." : `Tap once to cross out, twice for a flower. ${flowers.length} of ${n} placed.`}</p>
          <div className="game-tools">
            <button className="btn ghost" onClick={() => setWork(marks.map((m) => (m === 1 ? 0 : m)))} disabled={!marks.includes(1)}>Clear crosses</button>
            <button className="btn ghost" onClick={() => setWork(new Array(n * n).fill(0))} disabled={marks.every((m) => m === 0)}>Clear all</button>
          </div>
          <button className="linkish center" onClick={() => finish(false)}>Skip today</button>
        </>
      )}
    </GameFrame>
  );
}

/* ---------------- Pakal–Raavu ---------------- */

export function PakalGame({ state, update, onClose }: { state: AppState; update: Update; onClose: () => void }) {
  const puzzle = useMemo(() => pakalRaavuFor(state.daily.key), [state.daily.key]);
  const { result, work, elapsed, setWork, finish } = usePuzzle("pakal", state, update);
  const n = puzzle.size;
  const grid = useMemo<Mark[]>(() => {
    if (result?.solved) return puzzle.solution;
    return work && work.length === n * n ? (work as Mark[]) : [...puzzle.givens];
  }, [result, work, puzzle, n]);
  const bad = pakalConflicts(puzzle, grid);
  const solved = checkPakalRaavu(puzzle, grid);
  const colors = GAME_COLORS.pakal;

  useEffect(() => {
    if (!result && solved) finish(true);
  }, [solved, result, finish]);

  function tap(i: number) {
    if (result || puzzle.givens[i] !== 0) return;
    const next = [...grid];
    next[i] = ((next[i] + 1) % 3) as Mark;
    buzz(6);
    setWork(next);
  }

  return (
    <GameFrame title={PUZZLE_META.pakal.name} ml={PUZZLE_META.pakal.ml} accent={colors.face} accentDeep={colors.deep} elapsed={elapsed} onClose={onClose}>
      <div className="rules">
        <span>3 suns + 3 moons per line</span>
        <span>No 3 alike in a row</span>
      </div>
      <div className="board-wrap pakal">
        <div className="pgrid" style={{ "--n": n } as React.CSSProperties} role="grid" aria-label={`Pakal–Raavu, ${n} by ${n}`}>
          {grid.map((m, i) => (
            <button
              key={i}
              type="button"
              className={`pcell ${puzzle.givens[i] !== 0 ? "given" : ""} ${m !== 0 && bad.has(i) ? "bad" : ""}`}
              onClick={() => tap(i)}
              aria-label={`Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}: ${m === SUN ? "sun" : m === MOON ? "moon" : "empty"}${puzzle.givens[i] !== 0 ? " (fixed)" : ""}`}
            >
              {m === SUN ? <SunPiece /> : m === MOON ? <MoonPiece /> : null}
            </button>
          ))}
        </div>
        {puzzle.links.map(({ a, b, same }) => {
          const horizontal = b === a + 1;
          const r = Math.floor(a / n);
          const c = a % n;
          const left = horizontal ? ((c + 1) / n) * 100 : ((c + 0.5) / n) * 100;
          const top = horizontal ? ((r + 0.5) / n) * 100 : ((r + 1) / n) * 100;
          return (
            <span key={`${a}-${b}`} className="link-badge" style={{ left: `${left}%`, top: `${top}%` }} aria-label={same ? "same" : "different"}>
              {same ? "=" : "×"}
            </span>
          );
        })}
      </div>
      {result ? (
        <PuzzleEnd kind="pakal" result={result} onClose={onClose} />
      ) : (
        <>
          <div className="legend">
            <span><SunPiece /> Pakal (day)</span>
            <span><MoonPiece /> Raavu (night)</span>
            <span><b>=</b> same</span>
            <span><b>×</b> different</span>
          </div>
          <p className="game-note">{bad.size > 0 ? "Something doesn't balance. Check the red squares." : "Tap a square: sun, then moon, then empty."}</p>
          <div className="game-tools">
            <button className="btn ghost" onClick={() => setWork([...puzzle.givens])} disabled={grid.every((m, i) => m === puzzle.givens[i])}>Clear</button>
            <button className="btn ghost" onClick={() => finish(false)}>Skip today</button>
          </div>
        </>
      )}
    </GameFrame>
  );
}
