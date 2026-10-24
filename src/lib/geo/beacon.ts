import { cellToParent, getResolution, isValidCell } from "h3-js";
import { FINE_RESOLUTIONS, HOME_RESOLUTION } from "./resolution";
import { coordinateError, findCoordinateKeys } from "../privacy/coordinates";

/** What a phone sends about its position. No coordinates, ever. */
export interface Beacon {
  cellFine: string;
  resolution: number;
  cellR9: string;
  accuracyM: number;
  /** Milliseconds since the Unix epoch when the fix was taken. */
  at: number;
}

export type BeaconCheck = { ok: true; beacon: Beacon } | { ok: false; error: string };

/** Beacons older than this are refused. */
export const MAX_BEACON_AGE_MS = 60_000;

/**
 * Validates a beacon request body. Rejects anything that carries raw
 * coordinates, so precise locations can never be stored by mistake.
 */
export function validateBeacon(body: unknown, now: number = Date.now()): BeaconCheck {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const data = body as Record<string, unknown>;
  const forbidden = findCoordinateKeys(data);
  if (forbidden.length > 0) return { ok: false, error: coordinateError(forbidden) };

  const { cellFine, resolution, cellR9, accuracyM, at } = data;
  if (typeof cellFine !== "string" || !isValidCell(cellFine)) {
    return { ok: false, error: "cellFine must be a valid H3 cell ID." };
  }
  if (typeof resolution !== "number" || !(FINE_RESOLUTIONS as readonly number[]).includes(resolution)) {
    return { ok: false, error: `resolution must be one of ${FINE_RESOLUTIONS.join(", ")}.` };
  }
  if (getResolution(cellFine) !== resolution) {
    return { ok: false, error: "cellFine does not match the stated resolution." };
  }
  if (typeof cellR9 !== "string" || !isValidCell(cellR9) || getResolution(cellR9) !== HOME_RESOLUTION) {
    return { ok: false, error: "cellR9 must be a valid resolution-9 H3 cell ID." };
  }
  const expectedR9 = resolution === HOME_RESOLUTION ? cellFine : cellToParent(cellFine, HOME_RESOLUTION);
  if (expectedR9 !== cellR9) {
    return { ok: false, error: "cellR9 is not the parent of cellFine." };
  }
  if (typeof accuracyM !== "number" || !Number.isFinite(accuracyM) || accuracyM <= 0) {
    return { ok: false, error: "accuracyM must be a positive number of metres." };
  }
  if (typeof at !== "number" || !Number.isFinite(at)) {
    return { ok: false, error: "at must be a timestamp in milliseconds." };
  }
  if (now - at > MAX_BEACON_AGE_MS) {
    return { ok: false, error: "Beacon is older than 60 seconds." };
  }
  if (at - now > 5_000) {
    return { ok: false, error: "Beacon timestamp is in the future." };
  }
  return { ok: true, beacon: { cellFine, resolution, cellR9, accuracyM, at } };
}
