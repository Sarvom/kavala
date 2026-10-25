import { dailyPoints, leaderboard, SAMPLE_MEMBERS, SAMPLE_PLAYED_TODAY, type AppState, type MaskStyle } from "./state";

/**
 * What the phone knows about its real neighbourhood, read through the
 * `my_neighbourhood_*` database functions: counts and today's board, masks
 * only. Until a neighbourhood has MIN_REAL_PLAYERS people, the app shows the
 * labelled sample content instead, so a first player isn't alone on a board.
 */
export interface LiveRow {
  maskName: string;
  maskColor: string;
  maskStyle: MaskStyle;
  points: number;
  done: boolean;
  me: boolean;
}

export interface LiveHood {
  hoodId: string;
  members: number;
  playedToday: number;
  board: LiveRow[];
}

export const MIN_REAL_PLAYERS = 5;

export interface BoardRow {
  name: string;
  points: number;
  me: boolean;
  /** Set for real neighbours; sample rows use the sample palette by name. */
  color?: string;
  style?: MaskStyle;
}

export function isReal(live: LiveHood | null | undefined): live is LiveHood {
  return !!live && live.members >= MIN_REAL_PLAYERS;
}

function myPoints(state: AppState): number | null {
  return dailyPoints(state.daily);
}

/**
 * Today's leaderboard. Real when the neighbourhood is big enough; the
 * player's own row always reflects this phone, which may be a moment ahead
 * of the saved copy.
 */
export function boardFor(state: AppState, live: LiveHood | null | undefined): { rows: BoardRow[]; sample: boolean } {
  if (!isReal(live)) return { rows: leaderboard(state), sample: true };
  const mine = myPoints(state);
  const rows: BoardRow[] = live.board
    .filter((r) => !r.me)
    .map((r) => ({ name: r.maskName, points: r.points, me: false, color: r.maskColor, style: r.maskStyle }));
  if (mine !== null) rows.push({ name: state.maskName, points: mine, me: true, color: state.maskColor, style: state.maskStyle ?? "classic" });
  rows.sort((a, b) => b.points - a.points);
  return { rows: rows.slice(0, 10), sample: false };
}

const PLAYED_KEYS: (keyof AppState["daily"])[] = ["puzzles", "spot", "help", "step"];

/** Member and played-today counts, real or sample. */
export function countsFor(state: AppState, live: LiveHood | null | undefined): { members: number; played: number; sample: boolean } {
  const playedHere = PLAYED_KEYS.some((k) => state.daily[k] !== undefined) ? 1 : 0;
  if (!isReal(live)) return { members: SAMPLE_MEMBERS, played: SAMPLE_PLAYED_TODAY + (state.daily.done ? 1 : 0), sample: true };
  return { members: live.members, played: Math.max(live.playedToday, playedHere), sample: false };
}
