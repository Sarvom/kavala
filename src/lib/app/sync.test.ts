import { describe, expect, it } from "vitest";
import { latLngToCell } from "h3-js";
import { applySnapshot, rowsToSnapshot, toSnapshot, validateSnapshot, type ProfileSnapshot } from "./sync";
import { initialState, linkAccount, type AppState } from "./state";
import { findCoordinateKeys } from "../privacy/coordinates";

const home = latLngToCell(9.9816, 76.2999, 9);
const hoodCell = latLngToCell(9.9816, 76.2999, 7);

function joined(): AppState {
  return {
    ...initialState("2026-10-25", 0),
    joined: true,
    maskName: "Gwen George",
    homeCell: home,
    homeFromGps: true,
    hood: { id: hoodCell, cells: [hoodCell], resolution: 7 },
    thanks: 3,
    streak: 2,
    bestStreak: 4,
    lastPlayedKey: "2026-10-24",
    daily: {
      key: "2026-10-25",
      spot: {
        place: { id: "p", name: "Cafe", kind: "cafe", lat: 9.98, lng: 76.3 },
        distance: 87.4,
        points: 920,
        square: "green",
        guesses: [{ lat: 9.981, lng: 76.299 }],
        tries: [87.4],
      },
      spotGuesses: [{ lat: 9.981, lng: 76.299, distance: 87.4 }],
      help: "marked",
      done: false,
    },
  };
}

describe("profile snapshot", () => {
  it("is null before joining", () => {
    expect(toSnapshot(initialState("2026-10-25", 0))).toBeNull();
  });

  it("carries results but never the map taps or the place position", () => {
    const snap = toSnapshot(joined())!;
    expect(snap.daily).toEqual({ key: "2026-10-25", spotPoints: 920, spotDistanceM: 87, spotSkipped: false, help: "marked", step: undefined, done: false });
    expect(findCoordinateKeys(snap)).toEqual([]);
    expect(JSON.stringify(snap)).not.toContain("76.29");
  });

  it("round-trips through validation", () => {
    const snap = toSnapshot(joined())!;
    const check = validateSnapshot(JSON.parse(JSON.stringify(snap)));
    expect(check).toMatchObject({ ok: true });
    if (check.ok) expect(check.snapshot).toEqual(snap);
  });

  it("refuses bad cells, colours and counts", () => {
    const snap = toSnapshot(joined())!;
    expect(validateSnapshot({ ...snap, homeCell: latLngToCell(9.98, 76.3, 11) })).toMatchObject({ ok: false, error: /resolution-9/ });
    expect(validateSnapshot({ ...snap, homeCell: "not-a-cell" })).toMatchObject({ ok: false });
    expect(validateSnapshot({ ...snap, hood: { ...snap.hood, cells: [home] } })).toMatchObject({ ok: false, error: /hood.cells/ });
    expect(validateSnapshot({ ...snap, maskColor: "red" })).toMatchObject({ ok: false, error: /hex colour/ });
    expect(validateSnapshot({ ...snap, thanks: -1 })).toMatchObject({ ok: false, error: /thanks/ });
    expect(validateSnapshot({ ...snap, daily: { ...snap.daily, spotPoints: 5000 } })).toMatchObject({ ok: false, error: /spotPoints/ });
    expect(validateSnapshot({ ...snap, level: "vouched" })).toMatchObject({ ok: false, error: /level/ });
    expect(validateSnapshot([])).toMatchObject({ ok: false });
  });

  it("applies account data to this phone without touching today's games", () => {
    const local = joined();
    const fromServer: ProfileSnapshot = {
      ...toSnapshot(local)!,
      maskName: "Miles Mohan",
      thanks: 10,
      streak: 7,
      bestStreak: 7,
      lastPlayedKey: "2026-10-25",
      daily: { key: "2026-10-25", spotSkipped: true, done: true },
    };
    const merged = applySnapshot(local, fromServer);
    expect(merged.maskName).toBe("Miles Mohan");
    expect(merged.thanks).toBe(10);
    expect(merged.streak).toBe(7);
    expect(merged.lastPlayedKey).toBe("2026-10-25");
    expect(merged.daily).toEqual(local.daily);
    expect(merged.level).toBe("masked");
  });

  it("keeps a verified level on this phone when the account says masked", () => {
    const local = { ...joined(), level: "verified" as const };
    expect(applySnapshot(local, toSnapshot(joined())!).level).toBe("verified");
  });

  it("rebuilds a snapshot from database rows", () => {
    const snap = rowsToSnapshot(
      {
        mask_name: "Gwen George",
        mask_color: "#1d6a4e",
        mask_style: "owl",
        home_cell: home,
        home_from_gps: false,
        neighbourhood_id: hoodCell,
        trust_level: "vouched",
        thanks: 1,
        streak: 1,
        best_streak: 3,
        last_played_on: "2026-10-24",
      },
      { id: hoodCell, cells: [hoodCell], resolution: 7 },
      null,
      "2026-10-25",
    );
    expect(snap.level).toBe("verified");
    expect(snap.maskStyle).toBe("owl");
    expect(snap.daily).toEqual({ key: "2026-10-25", spotSkipped: false, done: false });
    expect(validateSnapshot(snap)).toMatchObject({ ok: true });
  });
});

describe("account linking", () => {
  const base = initialState("2026-10-25", 0);

  it("keeps an anonymous account masked and makes a Google account verified", () => {
    const anon = linkAccount(base, { provider: "anonymous", userId: "a1", name: "", email: "" });
    expect(anon.level).toBe("masked");
    expect(anon.account?.provider).toBe("anonymous");
    const google = linkAccount(anon, { provider: "google", userId: "g1", name: "G", email: "g@example.com" });
    expect(google.level).toBe("verified");
  });

  it("drops to masked and forgets reveals when the Google account is replaced by an anonymous one", () => {
    const google = { ...linkAccount(base, { provider: "google", userId: "g1", name: "G", email: "g@example.com" }), revealedTo: ["Carol Chacko"] };
    const back = linkAccount(google, { provider: "anonymous", userId: "a2", name: "", email: "" });
    expect(back.level).toBe("masked");
    expect(back.revealedTo).toEqual([]);
    expect(linkAccount(google, null).level).toBe("masked");
  });
});

describe("puzzle points in the snapshot", () => {
  it("sends today's points and nothing from the boards", async () => {
    const s = joined();
    s.daily = { key: "2026-10-25", done: false, puzzles: { weave: { solved: true, timeMs: 42_000, points: 319 } }, puzzleWork: { pookkalam: [3, 10, 17] } };
    const snap = toSnapshot(s)!;
    expect(snap.daily.points).toBe(319);
    expect(JSON.stringify(snap)).not.toContain("puzzleWork");
    expect(validateSnapshot({ ...snap, daily: { ...snap.daily, points: 1001 } })).toMatchObject({ ok: false, error: /daily.points/ });
  });

  it("reads points back from a database row, with or without migration 0004", () => {
    const user = { mask_name: "Gwen George", mask_color: "#1d6a4e", mask_style: "web", home_cell: home, home_from_gps: true, neighbourhood_id: null, trust_level: "masked", thanks: 0, streak: 0, best_streak: 0, last_played_on: null };
    const play = { day: "2026-10-25", spot_points: null, spot_distance_m: null, spot_skipped: false, help: null, step: null, done: false };
    expect(rowsToSnapshot(user, null, { ...play, puzzle_points: 640 }, "2026-10-25").daily.points).toBe(640);
    expect(rowsToSnapshot(user, null, play, "2026-10-25").daily.points).toBeUndefined();
  });
});
