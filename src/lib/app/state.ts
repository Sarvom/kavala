import type { SpotPlace } from "../daily/spotPlace";
import type { AccountProfile } from "./useGoogleAccount";
import type { Square } from "../daily/score";
import { goodTurnFor, sampleBoard, type BonusKind } from "./dailyContent";

/**
 * Everything the app experience remembers, saved on the phone only. Neighbours,
 * questions and leaderboard entries marked `sample` are demo content, shown
 * until accounts and the database arrive (Phase 2).
 */

export type TrustLevel = "masked" | "verified";

export interface Answer {
  id: string;
  by: string;
  text: string;
  useful: boolean;
  sample: boolean;
  /** Set when the answer came from a neighbouring area after widening. */
  area?: string;
}

export interface Question {
  id: string;
  by: string;
  text: string;
  category: string;
  askedAt: number;
  mine: boolean;
  reach: "own" | "adjacent";
  widenOffered: boolean;
  widenedAt?: number;
  answers: Answer[];
}

export interface SpotResult {
  place: SpotPlace;
  /** Best (closest) guess, in metres. */
  distance: number;
  points: number;
  square: Square;
  /** Distance of each guess in order, in metres. */
  tries?: number[];
  /** Where each guess was placed on the map (map taps, not the player's position). */
  guesses?: { lat: number; lng: number }[];
  solved?: boolean;
  timeMs?: number;
}

export interface SpotGuess {
  lat: number;
  lng: number;
  distance: number;
}

/** Kavala's daily logic puzzles. Web Weave and Pookkalam are on the daily path; Pakal–Raavu is a bonus. */
export type PuzzleKind = "weave" | "pookkalam" | "pakal";
export const CORE_PUZZLES: PuzzleKind[] = ["weave", "pookkalam"];
export const PUZZLE_KINDS: PuzzleKind[] = ["weave", "pookkalam", "pakal"];

export interface PuzzleResult {
  /** False when the player skipped the puzzle today. */
  solved: boolean;
  timeMs: number;
  points: number;
}

export interface DailyState {
  key: string;
  /** Today's puzzles, finished or skipped. */
  puzzles?: Partial<Record<PuzzleKind, PuzzleResult>>;
  /** Unfinished puzzle boards, so closing a puzzle doesn't lose the work. */
  puzzleWork?: Partial<Record<PuzzleKind, number[]>>;
  /** When each puzzle was first opened, for its clock. */
  puzzleStartedAt?: Partial<Record<PuzzleKind, number>>;
  /** Spot (find a real place on the map) was retired from the daily on 25 October 2026; kept so older saved days still load. */
  spot?: SpotResult | "skipped";
  /** Guesses so far in today's Spot, kept so closing the game doesn't reset the tries. */
  spotGuesses?: SpotGuess[];
  /** When today's Spot was first opened, for its clock. */
  spotStartedAt?: number;
  help?: "marked" | "answered" | "skipped";
  /** Tip the player trusted, or "mine" when they wrote their own. */
  helpPick?: string;
  /** The player's own tip, when they wrote one. */
  helpText?: string;
  /** When the user's own tip was posted, for the sample asker's reply. */
  helpAnsweredAt?: number;
  /** Set once the sample asker has thanked the player's tip. */
  helpThanked?: boolean;
  step?: "done" | "checked-in" | "later";
  /** How long each game took, for the result cards. */
  times?: { help?: number; step?: number };
  /** Bonus games played today: the choice tapped and the time taken. Not part of `done`. */
  bonus?: Partial<Record<BonusKind, { pick: string; timeMs: number }>>;
  done: boolean;
}

export interface Neighbourhood {
  id: string;
  cells: string[];
  resolution: number;
}

export interface AppState {
  version: 1;
  joined: boolean;
  maskName: string;
  maskColor: string;
  homeCell?: string;
  homeFromGps: boolean;
  hood?: Neighbourhood;
  level: TrustLevel;
  thanks: number;
  streak: number;
  /** Longest streak so far; older saved states may not have one. */
  bestStreak?: number;
  lastPlayedKey?: string;
  daily: DailyState;
  questions: Question[];
  revealedTo: string[];
  /** Supabase account behind this state: Google (verified) or anonymous (masked). Others still see the mask. */
  account?: AccountProfile;
  /** Mask design; older saved states may not have one. */
  maskStyle?: MaskStyle;
}

/** Original mask designs, several drawn from Kerala art forms. */
export type MaskStyle = "classic" | "web" | "kathakali" | "pulikali" | "owl";
export const MASK_STYLES: { id: MaskStyle; label: string }[] = [
  { id: "classic", label: "Night watch" },
  { id: "web", label: "Web weaver" },
  { id: "kathakali", label: "Kathakali" },
  { id: "pulikali", label: "Pulikali tiger" },
  { id: "owl", label: "Night owl" },
];

export function maskStyleOf(state: Pick<AppState, "maskStyle">): MaskStyle {
  return state.maskStyle ?? "classic";
}

export const MASK_COLORS = ["#1d6a4e", "#c58a12", "#3d6fa8", "#b4533a", "#7a5ba6", "#2e8c8c"];

/** Sample neighbours shown in the demo. Clearly not real people. */
export const SAMPLE_NEIGHBOURS: Record<string, string> = {
  "Wanda Warrier": "#b4533a",
  "Bruce Varghese": "#3d6fa8",
  "Tony Thomas": "#c58a12",
  "Steve Sebastian": "#2e8c8c",
  "Natasha Nair": "#7a5ba6",
  "Carol Chacko": "#1d6a4e",
  "Clint Kurian": "#b4533a",
  "Stephen Sankar": "#3d6fa8",
  "Scott Mathew": "#2e8c8c",
};

export const SAMPLE_PLAYED_TODAY = 38;

export interface BoardRow {
  name: string;
  points: number;
  me: boolean;
}

/** Today's puzzle points (0 to 999), or null before any puzzle is solved. */
export function dailyPoints(daily: DailyState): number | null {
  const solved = PUZZLE_KINDS.map((k) => daily.puzzles?.[k]).filter((r): r is PuzzleResult => !!r && r.solved);
  if (solved.length === 0) return null;
  return Math.min(1000, solved.reduce((sum, r) => sum + r.points, 0));
}

/** Today's leaderboard: the day's sample neighbours plus the player once they've solved a puzzle. */
export function leaderboard(state: AppState): BoardRow[] {
  const points = dailyPoints(state.daily);
  return [
    ...sampleBoard(state.daily.key).map((r) => ({ ...r, me: false })),
    ...(points !== null ? [{ name: state.maskName, points, me: true }] : []),
  ].sort((a, b) => b.points - a.points);
}
export const SAMPLE_MEMBERS = 112;

/** Demo wait before offering to ask neighbouring areas (the spec uses 60 s in demo mode). */
export const WIDEN_AFTER_MS = 20_000;
/** Demo delay before a sample neighbour replies. */
export const SAMPLE_REPLY_MS = 4_000;

/** Hero names: comic-inspired first names with Malayali family names. */
export const HERO_NAMES = [
  "Peter Bhaskaran",
  "Miles Mohan",
  "Gwen George",
  "Kamala Kurup",
  "Bucky Babu",
  "Shuri Sasidharan",
  "Logan Lonappan",
  "Sam Suresh",
  "Hope Haridas",
  "Matt Menon",
  "Jessica Joseph",
  "Luke Lukose",
  "Riri Raghavan",
  "Danny Devassy",
];

export function randomMaskName(random: () => number = Math.random, current?: string): string {
  const options = HERO_NAMES.filter((n) => !SAMPLE_NEIGHBOURS[n] && n !== current);
  return options[Math.floor(random() * options.length)] ?? HERO_NAMES[0];
}

function sampleQuestions(now: number): Question[] {
  const hour = 3_600_000;
  return [
    {
      id: "sample-induction",
      by: "Wanda Warrier",
      text: "My induction cooker stopped heating this morning. Anyone know a repair person who comes home?",
      category: "Repairs",
      askedAt: now - 2 * hour,
      mine: false,
      reach: "own",
      widenOffered: false,
      answers: [
        {
          id: "a1",
          by: "Bruce Varghese",
          text: "The electronics shop near the bus stop repairs them, but you have to carry it there.",
          useful: false,
          sample: true,
        },
      ],
    },
    {
      id: "sample-puncture",
      by: "Steve Sebastian",
      text: "Puncture shop open now, anywhere close?",
      category: "Transport",
      askedAt: now - 14 * hour,
      mine: false,
      reach: "own",
      widenOffered: false,
      answers: [
        {
          id: "a2",
          by: "Tony Thomas",
          text: "The shop behind the mosque is open till 9:30. About ₹80 for a bike tyre.",
          useful: true,
          sample: true,
        },
      ],
    },
    {
      id: "sample-waste",
      by: "Clint Kurian",
      text: "Which days does the waste collection come to our lane? Just moved in.",
      category: "Waste",
      askedAt: now - 20 * hour,
      mine: false,
      reach: "own",
      widenOffered: false,
      answers: [
        {
          id: "a3",
          by: "Carol Chacko",
          text: "Tuesdays and Fridays, around 8 AM. They take plastic only if it's washed and dry.",
          useful: true,
          sample: true,
        },
      ],
    },
    {
      id: "sample-lunch",
      by: "Stephen Sankar",
      text: "Cheap and good lunch meals near the library?",
      category: "Food",
      askedAt: now - 30 * hour,
      mine: false,
      reach: "own",
      widenOffered: false,
      answers: [],
    },
  ];
}

export function initialState(dailyKey: string, now: number = Date.now()): AppState {
  return {
    version: 1,
    joined: false,
    maskName: randomMaskName(),
    maskColor: MASK_COLORS[0],
    homeFromGps: false,
    level: "masked",
    thanks: 0,
    streak: 0,
    daily: { key: dailyKey, done: false },
    questions: sampleQuestions(now),
    revealedTo: [],
  };
}

/** Starts a fresh daily when the 6 AM boundary has passed. Questions carry over. */
export function rollDay(state: AppState, dailyKey: string): AppState {
  if (state.daily.key === dailyKey) return state;
  return { ...state, daily: { key: dailyKey, done: false } };
}

/** Days between two YYYY-MM-DD keys. */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * New streak after finishing today's daily. Missing one day is forgiven (a
 * rest day); missing two or more starts again from 1.
 */
export function nextStreak(lastKey: string | undefined, todayKey: string, streak: number): number {
  if (!lastKey) return 1;
  const gap = daysBetween(lastKey, todayKey);
  if (gap <= 0) return Math.max(streak, 1);
  if (gap <= 2) return streak + 1;
  return 1;
}

/** Steps on today's path: the two core puzzles, Good Turn and Quest. */
export function pathDone(d: DailyState): { weave: boolean; pookkalam: boolean; help: boolean; step: boolean } {
  return { weave: !!d.puzzles?.weave, pookkalam: !!d.puzzles?.pookkalam, help: !!d.help, step: !!d.step };
}

/** Marks the daily complete (and moves the streak) once every step on the path is finished. */
export function completeDaily(state: AppState): AppState {
  const d = state.daily;
  if (d.done || !Object.values(pathDone(d)).every(Boolean)) return state;
  const streak = nextStreak(state.lastPlayedKey, d.key, state.streak);
  return {
    ...state,
    streak,
    bestStreak: Math.max(state.bestStreak ?? 0, streak),
    lastPlayedKey: d.key,
    daily: { ...d, done: true },
  };
}

/**
 * Kavala Daily number, counted from the first daily (24 October 2026). A daily
 * runs from 6 AM to 6 AM India time, so the night of 24-25 October is #1.
 */
export function dailyNumber(dailyKey: string): number {
  return Math.max(1, daysBetween("2026-10-24", dailyKey) + 1);
}

export interface AppEvent {
  message: string;
}

const SAMPLE_REPLIES: Record<string, string> = {
  Repairs: "There's a repair person on Market Road who comes home. Usually free after 4 PM.",
  Food: "The mess opposite the station does a full meal for about ₹70.",
  Transport: "The early bus to the city leaves from the stop near the market. It fills up fast.",
  Waste: "Our side gets collection on Mondays and Thursdays. Yours may be the same.",
  Internet: "Most people near us use the local cable broadband. It holds up in the rain.",
  Other: "I can help with that. Ask here again this evening and I'll share details.",
};

/**
 * Moves demo time forward: offers widening for unanswered questions, adds a
 * sample reply after widening, and lets today's Good Turn asker thank the
 * user's tip. Pure, so it is easy to test.
 */
export function advance(state: AppState, now: number): { state: AppState; events: AppEvent[] } {
  const events: AppEvent[] = [];
  let changed = false;

  const questions = state.questions.map((q) => {
    if (!q.mine) return q;
    if (q.reach === "own" && q.answers.length === 0 && !q.widenOffered && now - q.askedAt >= WIDEN_AFTER_MS) {
      changed = true;
      events.push({ message: "No answer yet. You can ask the next areas too." });
      return { ...q, widenOffered: true };
    }
    if (q.reach === "adjacent" && q.widenedAt && q.answers.length === 0 && now - q.widenedAt >= SAMPLE_REPLY_MS) {
      changed = true;
      events.push({ message: "Natasha Nair (sample) from a neighbouring area answered." });
      const reply: Answer = {
        id: `reply-${q.id}`,
        by: "Natasha Nair",
        text: SAMPLE_REPLIES[q.category] ?? SAMPLE_REPLIES.Other,
        useful: false,
        sample: true,
        area: "a neighbouring area",
      };
      return { ...q, answers: [reply] };
    }
    return q;
  });

  let thanks = state.thanks;
  let daily = state.daily;
  if (daily.helpAnsweredAt && !daily.helpThanked && now - daily.helpAnsweredAt >= SAMPLE_REPLY_MS) {
    thanks += 1;
    daily = { ...daily, helpAnsweredAt: undefined, helpThanked: true };
    events.push({ message: `${goodTurnFor(daily.key).asker} (sample) found your tip useful. +1 Thanks` });
    changed = true;
  }

  if (!changed) return { state, events };
  return { state: { ...state, questions, thanks, daily }, events };
}

/**
 * Links or unlinks the signed-in account. Google counts as verified identity;
 * an anonymous account keeps the person masked. Either way the mask is what
 * neighbours see.
 */
export function linkAccount(state: AppState, profile: AccountProfile | null): AppState {
  if (!profile) {
    if (!state.account) return state;
    return { ...state, account: undefined, level: "masked", revealedTo: [] };
  }
  const level: TrustLevel = profile.provider === "google" ? "verified" : state.account?.provider === "google" ? "masked" : state.level;
  if (state.account?.userId === profile.userId && state.level === level) return state;
  return { ...state, account: profile, level, revealedTo: level === "masked" ? [] : state.revealedTo };
}

export const STORAGE_KEY = "kavala-app-v1";

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); the app still works for this visit.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
