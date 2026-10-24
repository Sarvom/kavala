"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkFix, LocationSmoother, type Fix } from "./filter";
import { toCells, type CellReading } from "./cells";

export type LocationStatus = "idle" | "asking" | "watching" | "denied" | "unsupported" | "error";

export interface LocationState {
  status: LocationStatus;
  /** Latest accepted, smoothed position. Shown on this device only. */
  position: Fix | null;
  /** Accuracy of the latest raw fix, in metres. */
  rawAccuracy: number | null;
  cells: CellReading | null;
  accepted: number;
  rejected: number;
  lastRejection: string | null;
  message: string | null;
}

const INITIAL: LocationState = {
  status: "idle",
  position: null,
  rawAccuracy: null,
  cells: null,
  accepted: 0,
  rejected: 0,
  lastRejection: null,
  message: null,
};

const REJECTION_TEXT: Record<string, string> = {
  invalid: "The phone sent an impossible position.",
  too_inaccurate: "GPS accuracy is worse than about 100 m. Move near a window or outside.",
  too_fast: "The position jumped faster than 50 m/s, so it was ignored.",
};

/**
 * Watches the phone's location with high accuracy, filters bad fixes, smooths
 * jitter and converts the result to H3 cells. Coordinates never leave this hook
 * except to draw on the user's own screen.
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>(INITIAL);
  const watchId = useRef<number | null>(null);
  const smoother = useRef(new LocationSmoother());
  const lastAccepted = useRef<Fix | undefined>(undefined);

  const stop = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, status: "unsupported", message: "This browser can't share location." }));
      return;
    }
    stop();
    smoother.current.reset();
    lastAccepted.current = undefined;
    setState({ ...INITIAL, status: "asking", message: "Waiting for location permission…" });

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: Fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        const verdict = checkFix(fix, lastAccepted.current);
        if (!verdict.ok) {
          setState((s) => ({
            ...s,
            status: "watching",
            rawAccuracy: fix.accuracy,
            rejected: s.rejected + 1,
            lastRejection: REJECTION_TEXT[verdict.reason],
            message: null,
          }));
          return;
        }
        lastAccepted.current = fix;
        const smoothed = smoother.current.update(fix);
        // Precision is chosen from the raw fix's accuracy, so smoothing never
        // makes the app claim more precision than the GPS reported.
        const cells = toCells(smoothed.lat, smoothed.lng, fix.accuracy);
        setState((s) => ({
          ...s,
          status: "watching",
          position: smoothed,
          rawAccuracy: fix.accuracy,
          cells,
          accepted: s.accepted + 1,
          message: null,
        }));
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setState((s) => ({
          ...s,
          status: denied ? "denied" : "error",
          message: denied
            ? "Location permission was denied. Allow it in your browser's site settings, then try again."
            : err.code === err.TIMEOUT
              ? "Location took too long. Move near a window or outside and try again."
              : "The phone couldn't get a location. Check that location services are on.",
        }));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { ...state, start, stop };
}
