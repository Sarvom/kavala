/**
 * Picks today's Spot place from real OpenStreetMap data near a neighbourhood.
 * Everyone in the same neighbourhood gets the same place on the same day,
 * because the pick depends only on the neighbourhood and the daily key.
 */

export interface SpotPlace {
  id: string;
  name: string;
  /** Human label such as "cafe" or "library". */
  kind: string;
  lat: number;
  lng: number;
}

const AMENITY_LABELS: Record<string, string> = {
  cafe: "cafe",
  restaurant: "restaurant",
  library: "library",
  place_of_worship: "place of worship",
  pharmacy: "pharmacy",
  bus_station: "bus station",
  marketplace: "market",
  post_office: "post office",
  fuel: "fuel station",
  school: "school",
  hospital: "hospital",
  bank: "bank",
};

const SHOP_LABELS: Record<string, string> = {
  bakery: "bakery",
  supermarket: "supermarket",
  convenience: "corner shop",
};

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** Overpass query for named public places within `radius` metres. */
export function overpassQuery(lat: number, lng: number, radius: number): string {
  const around = `around:${Math.round(radius)},${lat.toFixed(5)},${lng.toFixed(5)}`;
  const amenities = Object.keys(AMENITY_LABELS).join("|");
  const shops = Object.keys(SHOP_LABELS).join("|");
  return `[out:json][timeout:20];(node(${around})["amenity"~"^(${amenities})$"]["name"];node(${around})["shop"~"^(${shops})$"]["name"];);out body 80;`;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

/** Turns an Overpass response into Spot places, skipping anything unusable. */
export function parseOverpass(json: unknown): SpotPlace[] {
  const elements = (json as { elements?: OverpassElement[] })?.elements;
  if (!Array.isArray(elements)) return [];
  const places: SpotPlace[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags["name:en"] || tags.name;
    if (!name || typeof el.lat !== "number" || typeof el.lon !== "number") continue;
    const kind = AMENITY_LABELS[tags.amenity] ?? SHOP_LABELS[tags.shop];
    if (!kind) continue;
    places.push({ id: `${el.type}/${el.id}`, name, kind, lat: el.lat, lng: el.lon });
  }
  return places;
}

/** Small, stable string hash (FNV-1a). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Deterministic daily pick: same neighbourhood and day give the same place. */
export function pickDailyPlace(places: SpotPlace[], dailyKey: string, neighbourhoodId: string): SpotPlace | null {
  if (places.length === 0) return null;
  const sorted = [...places].sort((a, b) => (a.id < b.id ? -1 : 1));
  return sorted[hash(`${neighbourhoodId}|${dailyKey}`) % sorted.length];
}

/** Search radius that fits a neighbourhood of the given H3 resolution. */
export function searchRadiusFor(resolution: number): number {
  if (resolution <= 6) return 4000;
  if (resolution === 7) return 1800;
  if (resolution === 8) return 800;
  return 350;
}
