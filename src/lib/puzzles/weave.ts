import { areAdjacent, hashString, neighbours, randomInt, seededRandom } from "./rng";

/**
 * Web Weave: draw one thread through every cell of the grid, moving up, down,
 * left or right, passing the numbered anchors in order (1, 2, 3 …) and ending
 * on the last one. Inspired by path puzzles such as LinkedIn's daily games;
 * the grid, rules wording and art are Kavala's own.
 */
export interface WeavePuzzle {
  size: number;
  /** Cell index → anchor number (1-based). */
  anchors: Record<number, number>;
  /** One valid thread, kept for tests and hints. */
  solution: number[];
}

export const WEAVE_SIZE = 6;
const ANCHOR_COUNT = 8;

/** A serpentine path that covers the grid row by row. */
function serpentine(size: number): number[] {
  const path: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let k = 0; k < size; k++) path.push(r * size + (r % 2 === 0 ? k : size - 1 - k));
  }
  return path;
}

/**
 * Random Hamiltonian path by "backbite" moves: join an end of the path to one
 * of its grid neighbours and reverse the loop that forms. Every step keeps a
 * valid path, so many steps give a well-mixed random thread.
 */
export function randomThread(size: number, random: () => number, steps = size * size * 40): number[] {
  let path = serpentine(size);
  for (let s = 0; s < steps; s++) {
    const atStart = random() < 0.5;
    const end = atStart ? path[0] : path[path.length - 1];
    const next = atStart ? path[1] : path[path.length - 2];
    const options = neighbours(end, size).filter((n) => n !== next);
    if (options.length === 0) continue;
    const pick = options[randomInt(random, options.length)];
    const i = path.indexOf(pick);
    if (atStart) {
      path = [...path.slice(0, i).reverse(), ...path.slice(i)];
    } else {
      path = [...path.slice(0, i + 1), ...path.slice(i + 1).reverse()];
    }
  }
  return path;
}

export function weaveFor(dailyKey: string): WeavePuzzle {
  const size = WEAVE_SIZE;
  const random = seededRandom(hashString(`weave|${dailyKey}`));
  const solution = randomThread(size, random);
  const last = solution.length - 1;
  const anchors: Record<number, number> = {};
  for (let k = 0; k < ANCHOR_COUNT; k++) {
    // Spread anchors along the thread (about 5 squares apart), nudged by one
    // square either way so they don't look regular.
    const base = Math.round((k * last) / (ANCHOR_COUNT - 1));
    const inner = k > 0 && k < ANCHOR_COUNT - 1;
    const index = inner ? Math.min(last - 1, Math.max(1, base + randomInt(random, 3) - 1)) : base;
    anchors[solution[index]] = k + 1;
  }
  return { size, anchors, solution };
}

export type WeaveCheck = { ok: true } | { ok: false; reason: string };

/** Checks a drawn thread against the rules; any thread that follows them wins. */
export function checkWeave(puzzle: WeavePuzzle, path: number[]): WeaveCheck {
  const { size, anchors } = puzzle;
  const total = size * size;
  const anchorCount = Object.keys(anchors).length;
  if (path.length === 0 || anchors[path[0]] !== 1) return { ok: false, reason: "Start on 1." };
  if (new Set(path).size !== path.length) return { ok: false, reason: "The thread crosses itself." };
  for (let i = 1; i < path.length; i++) {
    if (path[i] < 0 || path[i] >= total || !areAdjacent(path[i - 1], path[i], size)) return { ok: false, reason: "Move one square at a time." };
  }
  let expected = 1;
  for (const cell of path) {
    const n = anchors[cell];
    if (n === undefined) continue;
    if (n !== expected) return { ok: false, reason: `Pass ${expected} before ${n}.` };
    expected += 1;
  }
  if (path.length < total) return { ok: false, reason: `Fill every square (${total - path.length} left).` };
  if (anchors[path[path.length - 1]] !== anchorCount) return { ok: false, reason: `End on ${anchorCount}.` };
  return { ok: true };
}

/**
 * The next thread after the player touches a cell: extends from the end,
 * or cuts back to a cell already on the thread. Returns the old thread when
 * the move isn't allowed.
 */
export function extendThread(puzzle: WeavePuzzle, path: number[], cell: number): number[] {
  const at = path.indexOf(cell);
  if (at >= 0) return path.slice(0, at + 1);
  if (path.length === 0) return puzzle.anchors[cell] === 1 ? [cell] : path;
  const end = path[path.length - 1];
  if (!areAdjacent(end, cell, puzzle.size)) return path;
  // The last anchor ends the thread.
  if (puzzle.anchors[end] === Object.keys(puzzle.anchors).length) return path;
  // Don't run past the next anchor out of order.
  const passed = path.filter((c) => puzzle.anchors[c] !== undefined).length;
  const n = puzzle.anchors[cell];
  if (n !== undefined && n !== passed + 1) return path;
  return [...path, cell];
}
