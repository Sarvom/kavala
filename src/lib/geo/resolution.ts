import { getHexagonEdgeLengthAvg, UNITS } from "h3-js";

/** The H3 resolutions Kavala uses for a phone's position, finest first. */
export const FINE_RESOLUTIONS = [11, 10, 9] as const;
export type FineResolution = (typeof FINE_RESOLUTIONS)[number];

/** Resolution used for a person's home cell and for neighbourhood lookups. */
export const HOME_RESOLUTION = 9;

/** Average H3 cell edge length in metres for a resolution. */
export function edgeMetres(resolution: number): number {
  return getHexagonEdgeLengthAvg(resolution, UNITS.m);
}

/**
 * The worst GPS accuracy (in metres) that a resolution can honestly represent.
 * Rule: the cell edge must be at least twice the accuracy radius, so a cell
 * never claims more precision than the GPS fix actually has.
 */
export function maxAccuracyFor(resolution: number): number {
  return edgeMetres(resolution) / 2;
}

/** Fixes worse than this are rejected outright (about 100 m). */
export const MAX_USABLE_ACCURACY_M = maxAccuracyFor(9);

/**
 * Picks the finest resolution whose cells are at least twice as wide as the
 * accuracy radius. Returns null when the fix is too imprecise to use.
 */
export function pickResolution(accuracyMetres: number): FineResolution | null {
  if (!Number.isFinite(accuracyMetres) || accuracyMetres <= 0) return null;
  for (const res of FINE_RESOLUTIONS) {
    if (accuracyMetres <= maxAccuracyFor(res)) return res;
  }
  return null;
}
