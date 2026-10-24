import { overpassQuery, parseOverpass, type SpotPlace } from "./spotPlace";

/**
 * Public Overpass API servers, tried in order. The main server is often busy,
 * so falling back keeps Spot working.
 */
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export interface FetchResult {
  places: SpotPlace[];
  endpoint?: string;
  errors: string[];
}

/**
 * Fetches named public places around a point, trying each endpoint with a
 * timeout. Returns every error so failures can be shown honestly.
 */
export async function fetchPlaces(
  lat: number,
  lng: number,
  radius: number,
  fetcher: typeof fetch = fetch,
  timeoutMs = 12_000,
  fromBrowser = false,
): Promise<FetchResult> {
  const errors: string[] = [];
  const body = `data=${encodeURIComponent(overpassQuery(lat, lng, radius))}`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetcher(endpoint, {
        method: "POST",
        // Browsers can't set User-Agent, and a plain form post skips the CORS preflight.
        headers: fromBrowser
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Kavala/0.1 (neighbourhood game prototype)" },
        body,
        signal: controller.signal,
      });
      if (!res.ok) {
        errors.push(`${new URL(endpoint).host} answered ${res.status}`);
        continue;
      }
      const places = parseOverpass(await res.json());
      return { places, endpoint, errors };
    } catch (err) {
      const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "could not be reached";
      errors.push(`${new URL(endpoint).host} ${reason}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return { places: [], errors };
}
