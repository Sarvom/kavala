import { hashString, randomInt, seededRandom, shuffled, neighbours } from "./rng";

/**
 * Pookkalam: place one flower in every row, every column and every colour
 * patch of the floral carpet, with no two flowers touching, not even
 * corner to corner. A placement puzzle in the family of LinkedIn's daily
 * logic games; the theme (an Onam pookkalam) and art are Kavala's own.
 */
export interface PookkalamPuzzle {
  size: number;
  /** Colour patch (0 … size-1) for each cell, row by row. */
  regions: number[];
  /** The flower's column in each row, for tests and hints. */
  solution: number[];
}

export const POOKKALAM_SIZE = 7;

/** A random placement with one flower per row and column and none touching. */
function randomPlacement(size: number, random: () => number): number[] {
  const cols: number[] = [];
  const used = new Set<number>();
  const place = (row: number): boolean => {
    if (row === size) return true;
    for (const c of shuffled([...Array(size).keys()], random)) {
      if (used.has(c)) continue;
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
      cols[row] = c;
      used.add(c);
      if (place(row + 1)) return true;
      used.delete(c);
    }
    return false;
  };
  place(0);
  return cols;
}

/** Grows one colour patch from each flower until the carpet is covered. */
function growRegions(size: number, flowers: number[], random: () => number): number[] {
  const regions = new Array<number>(size * size).fill(-1);
  const frontier: number[][] = flowers.map((c, r) => [r * size + c]);
  flowers.forEach((c, r) => (regions[r * size + c] = r));
  let left = size * size - size;
  while (left > 0) {
    const region = randomInt(random, size);
    const edge = frontier[region];
    if (edge.length === 0) continue;
    const from = edge[randomInt(random, edge.length)];
    const open = neighbours(from, size).filter((n) => regions[n] === -1);
    if (open.length === 0) {
      edge.splice(edge.indexOf(from), 1);
      continue;
    }
    const cell = open[randomInt(random, open.length)];
    regions[cell] = region;
    edge.push(cell);
    left -= 1;
  }
  return regions;
}

/** Finds up to `limit` solutions, each as the flower's column in every row. */
export function findPookkalamSolutions(size: number, regions: number[], limit = 2): number[][] {
  const found: number[][] = [];
  const cols: number[] = [];
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();
  const place = (row: number) => {
    if (found.length >= limit) return;
    if (row === size) {
      found.push([...cols]);
      return;
    }
    for (let c = 0; c < size; c++) {
      const region = regions[row * size + c];
      if (usedCols.has(c) || usedRegions.has(region)) continue;
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
      cols[row] = c;
      usedCols.add(c);
      usedRegions.add(region);
      place(row + 1);
      usedCols.delete(c);
      usedRegions.delete(region);
    }
  };
  place(0);
  return found;
}

export function countPookkalamSolutions(size: number, regions: number[], limit = 2): number {
  return findPookkalamSolutions(size, regions, limit).length;
}

/** True when every cell of `region` can reach every other without leaving it. */
function connected(size: number, regions: number[], region: number): boolean {
  const cells = regions.flatMap((r, i) => (r === region ? [i] : []));
  if (cells.length === 0) return false;
  const seen = new Set([cells[0]]);
  const queue = [cells[0]];
  while (queue.length > 0) {
    for (const n of neighbours(queue.pop()!, size)) {
      if (regions[n] === region && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * Breaks other answers one at a time: take a flower an alternative answer
 * uses (never one of ours) and hand its cell to a neighbouring patch. That
 * alternative can no longer work; repeat until ours is the only one left.
 */
function makeUnique(size: number, regions: number[], solution: number[], random: () => number): number[] | null {
  const ours = new Set(solution.map((c, r) => r * size + c));
  const grid = [...regions];
  for (let step = 0; step < 60; step++) {
    const answers = findPookkalamSolutions(size, grid, 2);
    const other = answers.find((a) => a.some((c, r) => c !== solution[r]));
    if (!other) return grid;
    const candidates = shuffled(
      other.map((c, r) => r * size + c).filter((cell) => !ours.has(cell)),
      random,
    );
    let moved = false;
    for (const cell of candidates) {
      const from = grid[cell];
      for (const n of shuffled(neighbours(cell, size), random)) {
        const to = grid[n];
        if (to === from) continue;
        grid[cell] = to;
        if (connected(size, grid, from)) {
          moved = true;
          break;
        }
        grid[cell] = from;
      }
      if (moved) break;
    }
    if (!moved) return null;
  }
  return null;
}

export function pookkalamFor(dailyKey: string): PookkalamPuzzle {
  const size = POOKKALAM_SIZE;
  const random = seededRandom(hashString(`pookkalam|${dailyKey}`));
  let fallback: PookkalamPuzzle | null = null;
  // Keep regrowing until the carpet has exactly one answer, so it can be
  // solved by reasoning rather than guessing.
  for (let attempt = 0; attempt < 50; attempt++) {
    const solution = randomPlacement(size, random);
    const grown = growRegions(size, solution, random);
    const regions = makeUnique(size, grown, solution, random);
    if (regions) return { size, regions, solution };
    fallback ??= { size, regions: grown, solution };
  }
  return fallback!;
}

/** Problems with a set of flowers, as cell indexes that break a rule. */
export function pookkalamConflicts(puzzle: PookkalamPuzzle, flowers: number[]): Set<number> {
  const { size, regions } = puzzle;
  const bad = new Set<number>();
  for (let i = 0; i < flowers.length; i++) {
    for (let j = i + 1; j < flowers.length; j++) {
      const a = flowers[i];
      const b = flowers[j];
      const [ra, ca, rb, cb] = [Math.floor(a / size), a % size, Math.floor(b / size), b % size];
      const touching = Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1;
      if (ra === rb || ca === cb || regions[a] === regions[b] || touching) {
        bad.add(a);
        bad.add(b);
      }
    }
  }
  return bad;
}

/** True when the flowers solve the carpet: one per row, column and patch, none touching. */
export function checkPookkalam(puzzle: PookkalamPuzzle, flowers: number[]): boolean {
  return flowers.length === puzzle.size && new Set(flowers).size === flowers.length && pookkalamConflicts(puzzle, flowers).size === 0;
}
