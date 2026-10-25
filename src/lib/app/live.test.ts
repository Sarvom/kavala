import { describe, expect, it } from "vitest";
import { boardFor, countsFor, isReal, MIN_REAL_PLAYERS, type LiveHood } from "./live";
import { initialState, SAMPLE_MEMBERS, type AppState } from "./state";

function played(points: number): AppState {
  const s = initialState("2026-10-25", 0);
  return {
    ...s,
    maskName: "Gwen George",
    daily: { ...s.daily, puzzles: { weave: { solved: true, timeMs: 30_000, points } } },
  };
}

const live: LiveHood = {
  hoodId: "h",
  members: MIN_REAL_PLAYERS,
  playedToday: 2,
  board: [
    { maskName: "Miles Mohan", maskColor: "#3d6fa8", maskStyle: "web", points: 700, done: true, me: false },
    { maskName: "Gwen George", maskColor: "#1d6a4e", maskStyle: "classic", points: 500, done: false, me: true },
  ],
};

describe("live neighbourhood or sample", () => {
  it("stays on sample content below the minimum", () => {
    const small = { ...live, members: MIN_REAL_PLAYERS - 1 };
    expect(isReal(small)).toBe(false);
    expect(isReal(null)).toBe(false);
    expect(boardFor(played(900), small).sample).toBe(true);
    expect(countsFor(played(900), small)).toEqual({ members: SAMPLE_MEMBERS, played: expect.any(Number), sample: true });
  });

  it("uses real rows and this phone's own score once the neighbourhood is big enough", () => {
    const { rows, sample } = boardFor(played(920), live);
    expect(sample).toBe(false);
    expect(rows.map((r) => [r.name, r.points, r.me])).toEqual([
      ["Gwen George", 920, true],
      ["Miles Mohan", 700, false],
    ]);
    expect(rows[1].color).toBe("#3d6fa8");
  });

  it("counts this phone as played even before the save lands", () => {
    expect(countsFor(played(1), { ...live, playedToday: 0 })).toEqual({ members: 5, played: 1, sample: false });
    expect(countsFor(initialState("2026-10-25", 0), live)).toEqual({ members: 5, played: 2, sample: false });
  });
});
