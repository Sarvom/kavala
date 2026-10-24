import { latLngToCell } from "h3-js";
import { HOME_RESOLUTION } from "../geo/resolution";
import type { Resident } from "./rebalance";

/** Centre of Kochi, used only for synthetic test data. */
export const KOCHI_CENTRE = { lat: 9.9816, lng: 76.2999 };

/** Small deterministic random number generator, so runs are repeatable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function offset(lat: number, lng: number, northM: number, eastM: number) {
  const dLat = northM / 111_320;
  const dLng = eastM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/**
 * Synthetic residents around Kochi: most clustered near the centre (dense),
 * the rest spread thinly up to 18 km out (sparse). Clearly fake data, used to
 * test and demonstrate neighbourhood sizing. Never mix with real users.
 */
export function syntheticResidents(count = 600, seed = 42, centre = KOCHI_CENTRE): Resident[] {
  const rand = mulberry32(seed);
  const gaussian = () => {
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const residents: Resident[] = [];
  for (let i = 0; i < count; i++) {
    let northM: number;
    let eastM: number;
    if (rand() < 0.7) {
      northM = gaussian() * 1200;
      eastM = gaussian() * 1200;
    } else {
      const r = 3000 + rand() * 15000;
      const theta = rand() * 2 * Math.PI;
      northM = r * Math.sin(theta);
      eastM = r * Math.cos(theta);
    }
    const p = offset(centre.lat, centre.lng, northM, eastM);
    residents.push({ id: `synthetic-${i}`, homeCell: latLngToCell(p.lat, p.lng, HOME_RESOLUTION) });
  }
  return residents;
}
