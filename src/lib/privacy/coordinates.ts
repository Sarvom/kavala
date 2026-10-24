/**
 * Kavala's servers never accept a person's coordinates. Every API that takes
 * JSON from a phone runs its body through findCoordinateKeys first and refuses
 * the request if anything looks like a latitude or longitude, however deeply
 * it is nested.
 */
export const COORDINATE_KEYS = ["lat", "lng", "lon", "latitude", "longitude", "coords", "coordinates"];

/** Returns the paths of every coordinate-like key in `value` (empty when clean). */
export function findCoordinateKeys(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findCoordinateKeys(item, `${path}[${i}]`));
  }
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const here = path ? `${path}.${key}` : key;
    const hit = COORDINATE_KEYS.includes(key.toLowerCase()) ? [here] : [];
    return [...hit, ...findCoordinateKeys(child, here)];
  });
}

export function coordinateError(keys: string[]): string {
  return `Raw coordinates are not accepted (${keys.join(", ")}). Send H3 cell IDs only.`;
}
