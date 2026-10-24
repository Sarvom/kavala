import { describe, expect, it } from "vitest";
import { latLngToCell } from "h3-js";
import { dailyKey, guessDistance, spotPoints, spotSquare, verifyCheckin } from "./score";

describe("spot scoring", () => {
  it("gives 1000 for a perfect guess and falls off with distance", () => {
    expect(spotPoints(0)).toBe(1000);
    expect(spotPoints(500)).toBe(368);
    expect(spotPoints(2000)).toBe(18);
    expect(spotPoints(-5)).toBe(0);
  });

  it("maps distances to result squares", () => {
    expect(spotSquare(80)).toBe("green");
    expect(spotSquare(120)).toBe("green");
    expect(spotSquare(121)).toBe("yellow");
    expect(spotSquare(300)).toBe("yellow");
    expect(spotSquare(1500)).toBe("orange");
    expect(spotSquare(5000)).toBe("grey");
  });

  it("measures guess distance in metres", () => {
    const d = guessDistance({ lat: 9.98, lng: 76.3 }, { lat: 9.981, lng: 76.3 });
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});

describe("dailyKey", () => {
  it("starts a new daily at 6:00 AM India time", () => {
    // 2026-10-25 05:59 IST is 2026-10-25 00:29 UTC.
    expect(dailyKey(Date.UTC(2026, 9, 25, 0, 29))).toBe("2026-10-24");
    // 2026-10-25 06:00 IST is 2026-10-25 00:30 UTC.
    expect(dailyKey(Date.UTC(2026, 9, 25, 0, 30))).toBe("2026-10-25");
  });
});

describe("verifyCheckin", () => {
  const place = { lat: 9.9816, lng: 76.2999 };

  it("accepts a phone at the place", () => {
    expect(verifyCheckin(latLngToCell(place.lat, place.lng, 11), place)).toBe(true);
  });

  it("refuses a phone a kilometre away", () => {
    expect(verifyCheckin(latLngToCell(place.lat + 0.01, place.lng, 11), place)).toBe(false);
  });
});

import { bearingDegrees, compassWord, warmth } from "./score";
import { fetchPlaces, OVERPASS_ENDPOINTS } from "./fetchPlaces";

describe("spot hints", () => {
  it("points the right way", () => {
    const here = { lat: 10, lng: 76 };
    expect(compassWord(bearingDegrees(here, { lat: 10.01, lng: 76 }))).toBe("north");
    expect(compassWord(bearingDegrees(here, { lat: 10, lng: 76.01 }))).toBe("east");
    expect(compassWord(bearingDegrees(here, { lat: 9.99, lng: 75.99 }))).toBe("south-west");
  });

  it("grades distance as hot or cold", () => {
    expect(warmth(80)).toBe("Found it");
    expect(warmth(250)).toBe("Hot");
    expect(warmth(600)).toBe("Warm");
    expect(warmth(1200)).toBe("Cold");
    expect(warmth(5000)).toBe("Freezing");
  });
});

describe("fetchPlaces", () => {
  const okJson = { elements: [{ type: "node", id: 1, lat: 10, lon: 76, tags: { amenity: "cafe", name: "Tea Point" } }] };

  it("falls back to the next server when one fails", async () => {
    const calls: string[] = [];
    const fake = (async (url: string) => {
      calls.push(url);
      if (calls.length === 1) return new Response("busy", { status: 429 });
      return new Response(JSON.stringify(okJson), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await fetchPlaces(10, 76, 500, fake);
    expect(r.places.map((p) => p.name)).toEqual(["Tea Point"]);
    expect(r.endpoint).toBe(OVERPASS_ENDPOINTS[1]);
    expect(r.errors[0]).toMatch(/429/);
  });

  it("reports every failure when all servers fail", async () => {
    const fake = (async () => {
      throw new TypeError("network");
    }) as unknown as typeof fetch;
    const r = await fetchPlaces(10, 76, 500, fake);
    expect(r.places).toEqual([]);
    expect(r.endpoint).toBeUndefined();
    expect(r.errors).toHaveLength(OVERPASS_ENDPOINTS.length);
  });

  it("sends a plain form post from the browser, with no User-Agent", async () => {
    let headers: Record<string, string> = {};
    const fake = (async (_url: string, init: RequestInit) => {
      headers = init.headers as Record<string, string>;
      return new Response(JSON.stringify(okJson), { status: 200 });
    }) as unknown as typeof fetch;
    await fetchPlaces(10, 76, 500, fake, 1000, true);
    expect(Object.keys(headers)).toEqual(["Content-Type"]);
  });
});
