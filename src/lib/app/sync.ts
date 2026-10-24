import { getResolution, isValidCell } from "h3-js";
import { HOME_RESOLUTION } from "../geo/resolution";
import { MASK_STYLES, type AppState, type DailyState, type MaskStyle, type TrustLevel } from "./state";

/**
 * What the phone sends to /api/me and gets back: the profile and today's
 * results, with nothing that could place a person more precisely than their
 * resolution-9 home cell. Spot guesses (map taps) stay on the phone; only the
 * best distance and the points travel.
 */
export interface DailySnapshot {
  key: string;
  spotPoints?: number;
  spotDistanceM?: number;
  spotSkipped: boolean;
  help?: "marked" | "answered" | "skipped";
  step?: "done" | "checked-in" | "later";
  done: boolean;
}

export interface ProfileSnapshot {
  maskName: string;
  maskColor: string;
  maskStyle: MaskStyle;
  homeCell: string;
  homeFromGps: boolean;
  hood: { id: string; cells: string[]; resolution: number };
  level: TrustLevel;
  thanks: number;
  streak: number;
  bestStreak: number;
  lastPlayedKey?: string;
  daily: DailySnapshot;
}

export function dailySnapshot(d: DailyState): DailySnapshot {
  const spot = d.spot && d.spot !== "skipped" ? d.spot : undefined;
  return {
    key: d.key,
    spotPoints: spot?.points,
    spotDistanceM: spot ? Math.round(spot.distance) : undefined,
    spotSkipped: d.spot === "skipped",
    help: d.help,
    step: d.step,
    done: d.done,
  };
}

/** The saveable part of the app state, or null before the person has joined. */
export function toSnapshot(state: AppState): ProfileSnapshot | null {
  if (!state.joined || !state.homeCell || !state.hood) return null;
  return {
    maskName: state.maskName,
    maskColor: state.maskColor,
    maskStyle: state.maskStyle ?? "classic",
    homeCell: state.homeCell,
    homeFromGps: state.homeFromGps,
    hood: { id: state.hood.id, cells: state.hood.cells, resolution: state.hood.resolution },
    level: state.level,
    thanks: state.thanks,
    streak: state.streak,
    bestStreak: Math.max(state.bestStreak ?? 0, state.streak),
    lastPlayedKey: state.lastPlayedKey,
    daily: dailySnapshot(state.daily),
  };
}

/**
 * Brings a saved snapshot into the state on this phone. Profile, Thanks and
 * streaks come from the account. Today's games stay as played on this phone:
 * the account only remembers results, not the map or the clues, so a daily
 * played on another phone shows as not played here while the streak stays safe.
 */
export function applySnapshot(state: AppState, snap: ProfileSnapshot): AppState {
  return {
    ...state,
    joined: true,
    maskName: snap.maskName,
    maskColor: snap.maskColor,
    maskStyle: snap.maskStyle,
    homeCell: snap.homeCell,
    homeFromGps: snap.homeFromGps,
    hood: snap.hood,
    level: state.level === "verified" ? "verified" : snap.level,
    thanks: snap.thanks,
    streak: snap.streak,
    bestStreak: Math.max(snap.bestStreak, state.bestStreak ?? 0),
    lastPlayedKey: snap.lastPlayedKey ?? state.lastPlayedKey,
  };
}

export type SnapshotCheck = { ok: true; snapshot: ProfileSnapshot } | { ok: false; error: string };

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const COLOUR = /^#[0-9a-f]{6}$/i;
const MASK_IDS = MASK_STYLES.map((m) => m.id) as string[];

function isCount(n: unknown, max: number): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
}

function isText(s: unknown, max: number): s is string {
  return typeof s === "string" && s.trim().length > 0 && s.length <= max;
}

/** Checks a snapshot sent by a phone. Coordinates are refused before this runs. */
export function validateSnapshot(body: unknown): SnapshotCheck {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { ok: false, error: "Body must be a JSON object." };
  const b = body as Record<string, unknown>;

  if (!isText(b.maskName, 40)) return { ok: false, error: "maskName must be 1 to 40 characters." };
  if (typeof b.maskColor !== "string" || !COLOUR.test(b.maskColor)) return { ok: false, error: "maskColor must be a hex colour." };
  if (typeof b.maskStyle !== "string" || !MASK_IDS.includes(b.maskStyle)) return { ok: false, error: `maskStyle must be one of ${MASK_IDS.join(", ")}.` };
  if (typeof b.homeCell !== "string" || !isValidCell(b.homeCell) || getResolution(b.homeCell) !== HOME_RESOLUTION) {
    return { ok: false, error: "homeCell must be a valid resolution-9 H3 cell ID." };
  }
  if (typeof b.homeFromGps !== "boolean") return { ok: false, error: "homeFromGps must be true or false." };

  const hood = b.hood as Record<string, unknown> | undefined;
  if (typeof hood !== "object" || hood === null) return { ok: false, error: "hood is required." };
  if (!isText(hood.id, 40)) return { ok: false, error: "hood.id must be 1 to 40 characters." };
  if (!isCount(hood.resolution, 9) || hood.resolution < 6) return { ok: false, error: "hood.resolution must be between 6 and 9." };
  const cells = hood.cells;
  if (!Array.isArray(cells) || cells.length === 0 || cells.length > 64) return { ok: false, error: "hood.cells must list 1 to 64 cells." };
  for (const c of cells) {
    if (typeof c !== "string" || !isValidCell(c) || getResolution(c) !== hood.resolution) {
      return { ok: false, error: "hood.cells must be valid H3 cells at hood.resolution." };
    }
  }

  if (b.level !== "masked" && b.level !== "verified") return { ok: false, error: "level must be masked or verified." };
  if (!isCount(b.thanks, 1_000_000)) return { ok: false, error: "thanks must be a whole number." };
  if (!isCount(b.streak, 100_000)) return { ok: false, error: "streak must be a whole number." };
  if (!isCount(b.bestStreak, 100_000)) return { ok: false, error: "bestStreak must be a whole number." };
  if (b.lastPlayedKey !== undefined && (typeof b.lastPlayedKey !== "string" || !DAY_KEY.test(b.lastPlayedKey))) {
    return { ok: false, error: "lastPlayedKey must be YYYY-MM-DD." };
  }

  const d = b.daily as Record<string, unknown> | undefined;
  if (typeof d !== "object" || d === null) return { ok: false, error: "daily is required." };
  if (typeof d.key !== "string" || !DAY_KEY.test(d.key)) return { ok: false, error: "daily.key must be YYYY-MM-DD." };
  if (d.spotPoints !== undefined && !isCount(d.spotPoints, 1000)) return { ok: false, error: "daily.spotPoints must be 0 to 1000." };
  if (d.spotDistanceM !== undefined && !isCount(d.spotDistanceM, 100_000)) return { ok: false, error: "daily.spotDistanceM must be a whole number of metres." };
  if (typeof d.spotSkipped !== "boolean") return { ok: false, error: "daily.spotSkipped must be true or false." };
  if (d.help !== undefined && !["marked", "answered", "skipped"].includes(d.help as string)) return { ok: false, error: "daily.help is not valid." };
  if (d.step !== undefined && !["done", "checked-in", "later"].includes(d.step as string)) return { ok: false, error: "daily.step is not valid." };
  if (typeof d.done !== "boolean") return { ok: false, error: "daily.done must be true or false." };

  return {
    ok: true,
    snapshot: {
      maskName: b.maskName.trim(),
      maskColor: b.maskColor.toLowerCase(),
      maskStyle: b.maskStyle as MaskStyle,
      homeCell: b.homeCell,
      homeFromGps: b.homeFromGps,
      hood: { id: hood.id, cells: cells as string[], resolution: hood.resolution },
      level: b.level,
      thanks: b.thanks,
      streak: b.streak,
      bestStreak: b.bestStreak,
      lastPlayedKey: b.lastPlayedKey as string | undefined,
      daily: {
        key: d.key,
        spotPoints: d.spotPoints as number | undefined,
        spotDistanceM: d.spotDistanceM as number | undefined,
        spotSkipped: d.spotSkipped,
        help: d.help as DailySnapshot["help"],
        step: d.step as DailySnapshot["step"],
        done: d.done,
      },
    },
  };
}

/** Database rows for a snapshot, and back. Column names follow 0001/0002. */
export interface UserRow {
  mask_name: string;
  mask_color: string;
  mask_style: string;
  home_cell: string;
  home_from_gps: boolean;
  neighbourhood_id: string | null;
  trust_level: string;
  thanks: number;
  streak: number;
  best_streak: number;
  last_played_on: string | null;
}

export interface DailyPlayRow {
  day: string;
  spot_points: number | null;
  spot_distance_m: number | null;
  spot_skipped: boolean;
  help: string | null;
  step: string | null;
  done: boolean;
}

export interface HoodRow {
  id: string;
  cells: string[];
  resolution: number;
}

export function rowsToSnapshot(user: UserRow, hood: HoodRow | null, play: DailyPlayRow | null, todayKey: string): ProfileSnapshot {
  const level: TrustLevel = user.trust_level === "masked" ? "masked" : "verified";
  return {
    maskName: user.mask_name,
    maskColor: user.mask_color,
    maskStyle: (MASK_IDS.includes(user.mask_style) ? user.mask_style : "classic") as MaskStyle,
    homeCell: user.home_cell,
    homeFromGps: user.home_from_gps,
    hood: hood ?? { id: user.home_cell, cells: [user.home_cell], resolution: HOME_RESOLUTION },
    level,
    thanks: user.thanks,
    streak: user.streak,
    bestStreak: user.best_streak,
    lastPlayedKey: user.last_played_on ?? undefined,
    daily: play
      ? {
          key: play.day,
          spotPoints: play.spot_points ?? undefined,
          spotDistanceM: play.spot_distance_m ?? undefined,
          spotSkipped: play.spot_skipped,
          help: (play.help ?? undefined) as DailySnapshot["help"],
          step: (play.step ?? undefined) as DailySnapshot["step"],
          done: play.done,
        }
      : { key: todayKey, spotSkipped: false, done: false },
  };
}
