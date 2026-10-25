/**
 * Points for a solved puzzle: up to 333, a point off every 3 seconds, never
 * below 100. Three puzzles make at most 999 points a day.
 */
export const PUZZLE_MAX_POINTS = 333;
export const PUZZLE_MIN_POINTS = 100;

export function puzzlePoints(timeMs: number): number {
  const seconds = Math.max(0, Math.floor(timeMs / 1000));
  return Math.max(PUZZLE_MIN_POINTS, PUZZLE_MAX_POINTS - Math.floor(seconds / 3));
}
