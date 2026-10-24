import { MAX_USABLE_ACCURACY_M } from "./resolution";

/** One location reading from the phone. Coordinates stay on the device. */
export interface Fix {
  lat: number;
  lng: number;
  /** Accuracy radius in metres, as reported by the browser. */
  accuracy: number;
  /** Milliseconds since the Unix epoch. */
  timestamp: number;
}

export type FixVerdict =
  | { ok: true; fix: Fix }
  | { ok: false; reason: "invalid" | "too_inaccurate" | "too_fast" };

/** Faster than this between two fixes is treated as a bad fix or spoofing. */
export const MAX_SPEED_MPS = 50;

const EARTH_RADIUS_M = 6_371_008.8;

/** Great-circle distance in metres between two points. */
export function haversineMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function isValid(fix: Fix): boolean {
  return (
    Number.isFinite(fix.lat) &&
    Number.isFinite(fix.lng) &&
    Math.abs(fix.lat) <= 90 &&
    Math.abs(fix.lng) <= 180 &&
    Number.isFinite(fix.accuracy) &&
    fix.accuracy > 0 &&
    Number.isFinite(fix.timestamp)
  );
}

/**
 * Accuracy gate plus speed check. `previous` is the last accepted fix, if any.
 */
export function checkFix(fix: Fix, previous?: Fix): FixVerdict {
  if (!isValid(fix)) return { ok: false, reason: "invalid" };
  if (fix.accuracy > MAX_USABLE_ACCURACY_M) return { ok: false, reason: "too_inaccurate" };
  if (previous) {
    const seconds = (fix.timestamp - previous.timestamp) / 1000;
    if (seconds > 0) {
      const metres = haversineMetres(previous.lat, previous.lng, fix.lat, fix.lng);
      // Allow for the combined uncertainty of both fixes before judging speed.
      const unexplained = Math.max(0, metres - fix.accuracy - previous.accuracy);
      if (unexplained / seconds > MAX_SPEED_MPS) return { ok: false, reason: "too_fast" };
    }
  }
  return { ok: true, fix };
}

/**
 * A small Kalman filter that smooths GPS jitter. Each new fix is weighted by
 * its accuracy, and uncertainty grows with time while the person may move.
 */
export class LocationSmoother {
  private lat = 0;
  private lng = 0;
  private variance = -1; // metres squared; negative means "no estimate yet"
  private lastTime = 0;

  /** Expected walking speed used to grow uncertainty between fixes. */
  constructor(private readonly speedMps = 3) {}

  update(fix: Fix): Fix {
    const measurementVariance = fix.accuracy * fix.accuracy;
    if (this.variance < 0) {
      this.lat = fix.lat;
      this.lng = fix.lng;
      this.variance = measurementVariance;
      this.lastTime = fix.timestamp;
      return { ...fix };
    }
    const dt = Math.max(0, (fix.timestamp - this.lastTime) / 1000);
    this.variance += dt * this.speedMps * this.speedMps;
    this.lastTime = fix.timestamp;

    const gain = this.variance / (this.variance + measurementVariance);
    this.lat += gain * (fix.lat - this.lat);
    this.lng += gain * (fix.lng - this.lng);
    this.variance = (1 - gain) * this.variance;

    return { lat: this.lat, lng: this.lng, accuracy: Math.sqrt(this.variance), timestamp: fix.timestamp };
  }

  reset(): void {
    this.variance = -1;
  }
}
