import { describe, expect, it } from "vitest";
import {
  advance,
  completeDaily,
  dailyNumber,
  initialState,
  nextStreak,
  rollDay,
  SAMPLE_NEIGHBOURS,
  SAMPLE_REPLY_MS,
  WIDEN_AFTER_MS,
  randomMaskName,
  type AppState,
  type Question,
} from "./state";
import { overpassQuery, parseOverpass, pickDailyPlace, type SpotPlace } from "../daily/spotPlace";
import { GOOD_TURNS, LINGO, POLLS, QUESTS, QUIZ, bonusFor, goodTurnFor, questFor, sampleBoard } from "./dailyContent";
import { googleProviderEnabled } from "./useGoogleAccount";

const NOW = 1_800_000_000_000;

function withMyQuestion(state: AppState, q: Partial<Question>): AppState {
  const mine: Question = {
    id: "mine-1",
    by: state.maskName,
    text: "Anyone know a plumber?",
    category: "Repairs",
    askedAt: NOW,
    mine: true,
    reach: "own",
    widenOffered: false,
    answers: [],
    ...q,
  };
  return { ...state, questions: [mine, ...state.questions] };
}

describe("streaks", () => {
  it("starts at 1, grows on consecutive days and forgives one missed day", () => {
    expect(nextStreak(undefined, "2026-10-25", 0)).toBe(1);
    expect(nextStreak("2026-10-25", "2026-10-26", 1)).toBe(2);
    expect(nextStreak("2026-10-25", "2026-10-27", 2)).toBe(3);
    expect(nextStreak("2026-10-25", "2026-10-29", 5)).toBe(1);
    expect(nextStreak("2026-10-25", "2026-10-25", 3)).toBe(3);
  });

  it("numbers dailies from 24 October 2026, one number per 6 AM day", () => {
    expect(dailyNumber("2026-10-24")).toBe(1);
    expect(dailyNumber("2026-10-25")).toBe(2);
    expect(dailyNumber("2026-11-02")).toBe(10);
  });
});

describe("rollDay", () => {
  it("resets the daily on a new day but keeps questions", () => {
    const s = { ...initialState("2026-10-25", NOW), daily: { key: "2026-10-25", done: true } };
    const next = rollDay(s, "2026-10-26");
    expect(next.daily).toEqual({ key: "2026-10-26", done: false });
    expect(next.questions).toBe(s.questions);
    expect(rollDay(next, "2026-10-26")).toBe(next);
  });
});

describe("advance", () => {
  it("offers widening once a question has waited long enough", () => {
    const s = withMyQuestion(initialState("2026-10-25", NOW), {});
    expect(advance(s, NOW + WIDEN_AFTER_MS - 1).state).toBe(s);
    const r = advance(s, NOW + WIDEN_AFTER_MS);
    expect(r.state.questions[0].widenOffered).toBe(true);
    expect(r.events).toHaveLength(1);
  });

  it("adds a labelled sample reply after widening", () => {
    const s = withMyQuestion(initialState("2026-10-25", NOW), { reach: "adjacent", widenedAt: NOW });
    const r = advance(s, NOW + SAMPLE_REPLY_MS);
    expect(r.state.questions[0].answers).toHaveLength(1);
    expect(r.state.questions[0].answers[0].sample).toBe(true);
  });

  it("thanks the user's own Good Turn tip once, without changing the old state", () => {
    const base = initialState("2026-10-25", NOW);
    const withTip: AppState = {
      ...base,
      daily: { ...base.daily, help: "answered", helpPick: "mine", helpText: "Try the shop", helpAnsweredAt: NOW },
    };
    expect(advance(withTip, NOW + SAMPLE_REPLY_MS - 1).state).toBe(withTip);
    const r = advance(withTip, NOW + SAMPLE_REPLY_MS);
    expect(r.state.thanks).toBe(1);
    expect(r.state.daily.helpThanked).toBe(true);
    expect(r.state.daily.helpAnsweredAt).toBeUndefined();
    expect(r.events[0].message).toContain(goodTurnFor("2026-10-25").asker);
    expect(withTip.thanks).toBe(0);
    expect(advance(r.state, NOW + 10 * SAMPLE_REPLY_MS).state.thanks).toBe(1);
  });
});

describe("mask names", () => {
  it("never collides with a sample neighbour", () => {
    for (let i = 0; i < 200; i++) expect(SAMPLE_NEIGHBOURS[randomMaskName()]).toBeUndefined();
  });
});

describe("spot places", () => {
  const places: SpotPlace[] = [
    { id: "node/3", name: "C", kind: "cafe", lat: 1, lng: 1 },
    { id: "node/1", name: "A", kind: "library", lat: 1, lng: 1 },
    { id: "node/2", name: "B", kind: "bakery", lat: 1, lng: 1 },
  ];

  it("picks the same place for the same neighbourhood and day, whatever the input order", () => {
    const a = pickDailyPlace(places, "2026-10-25", "hood-1");
    const b = pickDailyPlace([...places].reverse(), "2026-10-25", "hood-1");
    expect(a).toEqual(b);
    expect(pickDailyPlace([], "2026-10-25", "hood-1")).toBeNull();
  });

  it("parses named places and skips unusable ones", () => {
    const parsed = parseOverpass({
      elements: [
        { type: "node", id: 1, lat: 9.98, lon: 76.3, tags: { amenity: "cafe", name: "Tea Point" } },
        { type: "node", id: 2, lat: 9.98, lon: 76.3, tags: { amenity: "cafe" } },
        { type: "node", id: 3, tags: { amenity: "library", name: "No position" } },
        { type: "node", id: 4, lat: 9.98, lon: 76.3, tags: { amenity: "parking", name: "Car park" } },
        { type: "node", id: 5, lat: 9.98, lon: 76.3, tags: { shop: "bakery", name: "Bake House" } },
      ],
    });
    expect(parsed.map((p) => p.name)).toEqual(["Tea Point", "Bake House"]);
    expect(parseOverpass(null)).toEqual([]);
  });

  it("builds a bounded query", () => {
    expect(overpassQuery(9.98, 76.3, 1800)).toContain("around:1800,9.98000,76.30000");
  });
});

describe("linkAccount", () => {
  const profile = { provider: "google" as const, userId: "u1", name: "Govind S", email: "g@example.com" };

  it("links a Google profile and marks the user verified, keeping the mask", async () => {
    const { linkAccount } = await import("./state");
    const s = initialState("2026-10-25", NOW);
    const linked = linkAccount(s, profile);
    expect(linked.level).toBe("verified");
    expect(linked.account?.email).toBe("g@example.com");
    expect(linked.maskName).toBe(s.maskName);
    expect(linkAccount(linked, profile)).toBe(linked);
  });

  it("unlinks on sign-out and hides the real name again", async () => {
    const { linkAccount } = await import("./state");
    const linked = { ...linkAccount(initialState("2026-10-25", NOW), profile), revealedTo: ["Carol Chacko"] };
    const out = linkAccount(linked, null);
    expect(out.account).toBeUndefined();
    expect(out.level).toBe("masked");
    expect(out.revealedTo).toEqual([]);
  });
});

describe("completeDaily", () => {
  it("completes only when all three games are finished, and counts the streak once", async () => {
    const { completeDaily } = await import("./state");
    const base = initialState("2026-10-25", NOW);
    const partial = { ...base, daily: { ...base.daily, help: "marked" as const, step: "done" as const } };
    expect(completeDaily(partial)).toBe(partial);
    const full = { ...partial, daily: { ...partial.daily, spot: "skipped" as const } };
    const done = completeDaily(full);
    expect(done.daily.done).toBe(true);
    expect(done.streak).toBe(1);
    expect(done.bestStreak).toBe(1);
    expect(completeDaily(done)).toBe(done);
  });

  it("keeps the best streak when the current one restarts", async () => {
    const { completeDaily } = await import("./state");
    const base = initialState("2026-11-10", NOW);
    const s: AppState = {
      ...base,
      streak: 6,
      bestStreak: 6,
      lastPlayedKey: "2026-11-01",
      daily: { key: "2026-11-10", done: false, spot: "skipped", help: "marked", step: "done" },
    };
    const done = completeDaily(s);
    expect(done.streak).toBe(1);
    expect(done.bestStreak).toBe(6);
  });
});

describe("daily content", () => {
  it("gives everyone the same Good Turn and Quest on the same day", () => {
    expect(goodTurnFor("2026-10-25")).toBe(goodTurnFor("2026-10-25"));
    expect(questFor("2026-10-25")).toBe(questFor("2026-10-25"));
  });

  it("rotates through different content across a week", () => {
    const days = Array.from({ length: 14 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
    expect(new Set(days.map((d) => goodTurnFor(d).id)).size).toBeGreaterThan(2);
    expect(new Set(days.map((d) => questFor(d).id)).size).toBeGreaterThan(2);
  });

  it("has tips whose sample shares add up to 100 and unique ids", () => {
    for (const turn of GOOD_TURNS) {
      expect(turn.tips.reduce((sum, t) => sum + t.picked, 0)).toBe(100);
      expect(new Set(turn.tips.map((t) => t.id)).size).toBe(turn.tips.length);
    }
    expect(new Set(GOOD_TURNS.map((t) => t.id)).size).toBe(GOOD_TURNS.length);
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
  });

  it("builds a sorted five-row sample leaderboard that changes by day", () => {
    const a = sampleBoard("2026-10-25");
    expect(a).toHaveLength(5);
    expect(a.map((r) => r.points)).toEqual([...a.map((r) => r.points)].sort((x, y) => y - x));
    expect(sampleBoard("2026-10-25")).toEqual(a);
    expect(sampleBoard("2026-10-26")).not.toEqual(a);
  });
});

describe("googleProviderEnabled", () => {
  const reply = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("reads whether Google is switched on in Supabase", async () => {
    expect(await googleProviderEnabled("https://x.supabase.co", "k", reply(200, { external: { google: true } }))).toBe(true);
    expect(await googleProviderEnabled("https://x.supabase.co/", "k", reply(200, { external: { google: false } }))).toBe(false);
  });

  it("returns unknown instead of blocking when the check fails", async () => {
    expect(await googleProviderEnabled("https://x.supabase.co", "k", reply(500, {}))).toBeNull();
    expect(await googleProviderEnabled("https://x.supabase.co", "k", reply(200, { nothing: 1 }))).toBeNull();
    const broken = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await googleProviderEnabled("https://x.supabase.co", "k", broken)).toBeNull();
  });
});

describe("bonus games", () => {
  const kinds = ["lingo", "quiz", "poll"] as const;

  it("gives everyone the same round on the same day and rotates across days", () => {
    const days = Array.from({ length: 14 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
    for (const kind of kinds) {
      expect(bonusFor(kind, "2026-10-25")).toBe(bonusFor(kind, "2026-10-25"));
      expect(new Set(days.map((d) => bonusFor(kind, d).id)).size).toBeGreaterThan(2);
    }
  });

  it("has a valid answer for every Lingo word and Kochi Quiz question", () => {
    for (const round of [...LINGO, ...QUIZ]) {
      expect(round.choices.map((c) => c.id)).toContain(round.answer);
      expect(new Set(round.choices.map((c) => c.id)).size).toBe(round.choices.length);
    }
  });

  it("has poll shares that add up to 100 and no answer", () => {
    for (const poll of POLLS) {
      expect(poll.answer).toBeUndefined();
      expect(poll.choices.reduce((sum, c) => sum + (c.picked ?? 0), 0)).toBe(100);
    }
  });

  it("doesn't change whether the daily is complete", () => {
    const s = initialState("2026-10-25", NOW);
    const played = { ...s, daily: { ...s.daily, bonus: { lingo: { pick: "a", timeMs: 1000 } } } };
    expect(completeDaily(played).daily.done).toBe(false);
  });
});
