import { describe, expect, it } from "vitest";
import { checkWeave, extendThread, randomThread, weaveFor, WEAVE_SIZE } from "./weave";
import { checkPookkalam, countPookkalamSolutions, pookkalamConflicts, pookkalamFor, POOKKALAM_SIZE } from "./pookkalam";
import { checkPakalRaavu, countPakalSolutions, MOON, pakalConflicts, pakalRaavuFor, SUN, type Mark } from "./pakalRaavu";
import { puzzlePoints } from "./score";
import { areAdjacent, seededRandom } from "./rng";

const DAYS = ["2026-10-25", "2026-10-26", "2026-11-01", "2026-12-25", "2027-01-14"];

describe("Web Weave", () => {
  it("random threads cover the grid one step at a time", () => {
    const path = randomThread(6, seededRandom(7));
    expect(new Set(path).size).toBe(36);
    for (let i = 1; i < path.length; i++) expect(areAdjacent(path[i - 1], path[i], 6)).toBe(true);
  });

  it.each(DAYS)("the %s puzzle is the same for everyone and its own solution passes", (day) => {
    const p = weaveFor(day);
    expect(weaveFor(day)).toEqual(p);
    expect(p.size).toBe(WEAVE_SIZE);
    expect(Object.values(p.anchors).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(checkWeave(p, p.solution)).toEqual({ ok: true });
  });

  it("explains what's wrong with a thread", () => {
    const p = weaveFor("2026-10-25");
    expect(checkWeave(p, p.solution.slice(1))).toMatchObject({ ok: false, reason: "Start on 1." });
    expect(checkWeave(p, p.solution.slice(0, 20))).toMatchObject({ ok: false });
    const jump = [...p.solution];
    [jump[3], jump[10]] = [jump[10], jump[3]];
    expect(checkWeave(p, jump).ok).toBe(false);
  });

  it("drawing extends from the end, cuts back, and won't skip anchors", () => {
    const p = weaveFor("2026-10-25");
    const start = p.solution[0];
    expect(extendThread(p, [], p.solution[5])).toEqual(p.anchors[p.solution[5]] === 1 ? [p.solution[5]] : []);
    let path = extendThread(p, [], start);
    expect(path).toEqual([start]);
    for (const cell of p.solution.slice(1, 6)) path = extendThread(p, path, cell);
    expect(path).toEqual(p.solution.slice(0, 6));
    expect(extendThread(p, path, p.solution[2])).toEqual(p.solution.slice(0, 3));
    // Building the whole solution by taps gives a winning thread.
    let full: number[] = [];
    for (const cell of p.solution) full = extendThread(p, full, cell);
    expect(checkWeave(p, full)).toEqual({ ok: true });
  });
});

describe("Pookkalam", () => {
  it.each(DAYS)("the %s carpet has one answer, and it passes", (day) => {
    const p = pookkalamFor(day);
    expect(pookkalamFor(day)).toEqual(p);
    expect(new Set(p.regions).size).toBe(POOKKALAM_SIZE);
    expect(countPookkalamSolutions(p.size, p.regions)).toBe(1);
    const flowers = p.solution.map((c, r) => r * p.size + c);
    expect(checkPookkalam(p, flowers)).toBe(true);
  });

  it("flags flowers that share a row or touch", () => {
    const p = pookkalamFor("2026-10-25");
    expect([...pookkalamConflicts(p, [0, 1])].sort()).toEqual([0, 1]);
    expect([...pookkalamConflicts(p, [0, p.size + 1])].sort((a, b) => a - b)).toEqual([0, p.size + 1]);
    expect(checkPookkalam(p, [0])).toBe(false);
  });
});

describe("Pakal–Raavu", () => {
  it.each(DAYS)("the %s grid has one answer, and it passes", (day) => {
    const p = pakalRaavuFor(day);
    expect(pakalRaavuFor(day)).toEqual(p);
    expect(countPakalSolutions(p.size, p.givens, p.links).count).toBe(1);
    expect(checkPakalRaavu(p, p.solution)).toBe(true);
    expect(p.links.length).toBeGreaterThanOrEqual(3);
    expect(p.givens.filter((g) => g !== 0).length).toBeLessThan(p.size * p.size);
  });

  it("flags three in a row and broken links", () => {
    const p = { size: 6, links: [{ a: 6, b: 7, same: true }] };
    const grid = new Array<Mark>(36).fill(0);
    grid[0] = SUN; grid[1] = SUN; grid[2] = SUN;
    grid[6] = SUN; grid[7] = MOON;
    expect([...pakalConflicts(p, grid)].sort((a, b) => a - b)).toEqual([0, 1, 2, 6, 7]);
  });
});

describe("puzzle points", () => {
  it("rewards speed but never drops below 100", () => {
    expect(puzzlePoints(0)).toBe(333);
    expect(puzzlePoints(30_000)).toBe(323);
    expect(puzzlePoints(3_600_000)).toBe(100);
  });
});
