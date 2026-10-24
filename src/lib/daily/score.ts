import { latLngToCell, getResolution } from "h3-js";
import { cellsNear } from "../geo/cells";
import { haversineMetres } from "../geo/filter";

export type Square = "green" | "yellow" | "orange" | "grey";

/** Spot points: 1000 for a perfect guess, falling off with distance. */
export function spotPoints(distanceMetres: number, scaleMetres = 500): number {
  if (!Number.isFinite(distanceMetres) || distanceMetres < 0) return 0;
  return Math.round(1000 * Math.exp(-distanceMetres / scaleMetres));
}

/** Result-card square for a Spot guess. Green means found (within the solve radius). */
export function spotSquare(distanceMetres: number): Square {
  if (distanceMetres <= SOLVE_RADIUS_M) return "green";
  if (distanceMetres <= 500) return "yellow";
  if (distanceMetres <= 2000) return "orange";
  return "grey";
}

/** Distance in metres between a guess and the real place. */
export function guessDistance(guess: { lat: number; lng: number }, target: { lat: number; lng: number }): number {
  return Math.round(haversineMetres(guess.lat, guess.lng, target.lat, target.lng));
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_START_HOUR_IST = 6;

/**
 * The Kavala Daily key (YYYY-MM-DD) for a moment in time. A new daily starts
 * at 6:00 AM India time, so 5:59 AM still belongs to the previous day.
 */
export function dailyKey(nowMs: number = Date.now()): string {
  const shifted = new Date(nowMs + IST_OFFSET_MS - DAY_START_HOUR_IST * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Accepts a check-in at a place only when the phone's current cell is the
 * place's cell or touches it, compared at the phone's resolution.
 */
export function verifyCheckin(phoneCell: string, place: { lat: number; lng: number }): boolean {
  const res = getResolution(phoneCell);
  const placeCell = latLngToCell(place.lat, place.lng, res);
  return cellsNear(phoneCell, placeCell);
}

/** A Spot guess within this distance counts as found. */
export const SOLVE_RADIUS_M = 120;
/** Guesses allowed per Spot game. */
export const MAX_TRIES = 3;

/** Compass bearing in degrees (0 = north, 90 = east) from one point to another. */
export function bearingDegrees(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(to.lng - from.lng)) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng - from.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

/** Eight-point compass word for a bearing. */
export function compassWord(bearing: number): string {
  return COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

/** Hot-or-cold hint for a guess. */
export function warmth(distanceMetres: number): "Found it" | "Hot" | "Warm" | "Cold" | "Freezing" {
  if (distanceMetres <= SOLVE_RADIUS_M) return "Found it";
  if (distanceMetres <= 300) return "Hot";
  if (distanceMetres <= 700) return "Warm";
  if (distanceMetres <= 1500) return "Cold";
  return "Freezing";
}
