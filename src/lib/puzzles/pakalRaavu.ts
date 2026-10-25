import { hashString, randomInt, seededRandom, shuffled } from "./rng";

/**
 * Pakal–Raavu (day and night): fill the grid with suns and moons. Each row
 * and column has as many suns as moons, no more than two of the same sit
 * side by side, cells joined by "=" match and cells joined by "×" differ.
 * A balance puzzle in the family of LinkedIn's daily logic games; the
 * Malayalam theme and art are Kavala's own.
 */
export const SUN = 1;
export const MOON = 2;
export type Mark = 0 | typeof SUN | typeof MOON;

export interface Link {
  /** Two orthogonally adjacent cells, a < b. */
  a: number;
  b: number;
  same: boolean;
}

export interface PakalRaavuPuzzle {
  size: number;
  /** Fixed starting marks; 0 for open cells. */
  givens: Mark[];
  links: Link[];
  solution: Mark[];
}

export const PAKAL_SIZE = 6;

/** Rule check on a possibly unfinished grid: false as soon as a rule is broken. */
function lineOk(line: Mark[], size: number): boolean {
  let suns = 0;
  let moons = 0;
  for (let i = 0; i < size; i++) {
    if (line[i] === SUN) suns++;
    if (line[i] === MOON) moons++;
    if (i >= 2 && line[i] !== 0 && line[i] === line[i - 1] && line[i] === line[i - 2]) return false;
  }
  return suns <= size / 2 && moons <= size / 2;
}

function row(grid: Mark[], size: number, r: number): Mark[] {
  return grid.slice(r * size, r * size + size);
}

function col(grid: Mark[], size: number, c: number): Mark[] {
  return Array.from({ length: size }, (_, r) => grid[r * size + c]);
}

function linksOk(grid: Mark[], links: Link[]): boolean {
  return links.every(({ a, b, same }) => grid[a] === 0 || grid[b] === 0 || (grid[a] === grid[b]) === same);
}

/** Cells that break a rule right now, for highlighting. */
export function pakalConflicts(puzzle: Pick<PakalRaavuPuzzle, "size" | "links">, grid: Mark[]): Set<number> {
  const { size, links } = puzzle;
  const bad = new Set<number>();
  for (let k = 0; k < size; k++) {
    const r = row(grid, size, k);
    const c = col(grid, size, k);
    if (!lineOk(r, size)) for (let i = 0; i < size; i++) if (r[i] !== 0) bad.add(k * size + i);
    if (!lineOk(c, size)) for (let i = 0; i < size; i++) if (c[i] !== 0) bad.add(i * size + k);
  }
  for (const { a, b, same } of links) {
    if (grid[a] !== 0 && grid[b] !== 0 && (grid[a] === grid[b]) !== same) {
      bad.add(a);
      bad.add(b);
    }
  }
  return bad;
}

/** Counts completions of `start` up to `limit`. */
export function countPakalSolutions(size: number, start: Mark[], links: Link[], limit = 2, random?: () => number): { count: number; first: Mark[] | null } {
  const grid = [...start];
  let count = 0;
  let first: Mark[] | null = null;
  const fill = (i: number) => {
    if (count >= limit) return;
    if (i === grid.length) {
      count += 1;
      first ??= [...grid];
      return;
    }
    if (grid[i] !== 0) {
      fill(i + 1);
      return;
    }
    const order: Mark[] = random && random() < 0.5 ? [MOON, SUN] : [SUN, MOON];
    for (const m of order) {
      grid[i] = m;
      const r = Math.floor(i / size);
      const c = i % size;
      if (lineOk(row(grid, size, r), size) && lineOk(col(grid, size, c), size) && linksOk(grid, links)) fill(i + 1);
      grid[i] = 0;
    }
  };
  fill(0);
  return { count, first };
}

export function pakalRaavuFor(dailyKey: string): PakalRaavuPuzzle {
  const size = PAKAL_SIZE;
  const random = seededRandom(hashString(`pakal-raavu|${dailyKey}`));
  const empty = new Array<Mark>(size * size).fill(0);
  const solution = countPakalSolutions(size, empty, [], 1, random).first!;

  // Every possible clue: a given for each cell and a link for each touching pair.
  type Clue = { kind: "given"; cell: number } | { kind: "link"; link: Link };
  const clues: Clue[] = [];
  for (let i = 0; i < size * size; i++) {
    clues.push({ kind: "given", cell: i });
    if (i % size < size - 1) clues.push({ kind: "link", link: { a: i, b: i + 1, same: solution[i] === solution[i + 1] } });
    if (i + size < size * size) clues.push({ kind: "link", link: { a: i, b: i + size, same: solution[i] === solution[i + size] } });
  }

  // Start from all clues, then drop them one by one while the answer stays unique.
  let kept = shuffled(clues, random);
  const build = (set: Clue[]) => {
    const givens = new Array<Mark>(size * size).fill(0);
    const links: Link[] = [];
    for (const c of set) {
      if (c.kind === "given") givens[c.cell] = solution[c.cell];
      else links.push(c.link);
    }
    return { givens, links };
  };
  for (const clue of [...kept]) {
    const trial = kept.filter((c) => c !== clue);
    const { givens, links } = build(trial);
    if (countPakalSolutions(size, givens, links).count === 1) kept = trial;
  }
  // A minimal grid is hard work for a two-minute daily, so hand back a few
  // starting marks and keep some links on screen: they're half the fun.
  const { givens, links } = build(kept);
  for (const i of shuffled([...Array(size * size).keys()], random)) {
    if (givens.filter((g) => g !== 0).length >= 7) break;
    givens[i] = solution[i];
  }
  if (links.length < 3) {
    for (const c of shuffled(clues, random)) {
      if (c.kind === "link" && !links.some((l) => l.a === c.link.a && l.b === c.link.b)) links.push(c.link);
      if (links.length >= 3 + randomInt(random, 2)) break;
    }
  }
  links.sort((x, y) => x.a - y.a || x.b - y.b);
  return { size, givens, links, solution };
}

/** True when the grid is full and follows every rule, links and givens included. */
export function checkPakalRaavu(puzzle: PakalRaavuPuzzle, grid: Mark[]): boolean {
  if (grid.length !== puzzle.size * puzzle.size || grid.some((m) => m === 0)) return false;
  if (puzzle.givens.some((g, i) => g !== 0 && grid[i] !== g)) return false;
  return pakalConflicts(puzzle, grid).size === 0;
}
