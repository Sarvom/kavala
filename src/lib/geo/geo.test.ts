import { describe, expect, it } from "vitest";
import { cellToParent, gridDisk, latLngToCell } from "h3-js";
import { checkFix, haversineMetres, LocationSmoother, type Fix } from "./filter";
import { edgeMetres, maxAccuracyFor, MAX_USABLE_ACCURACY_M, pickResolution } from "./resolution";
import { cellsNear, toCells } from "./cells";
import { validateBeacon } from "./beacon";

const KOCHI = { lat: 9.9816, lng: 76.2999 };

describe("pickResolution", () => {
  it("uses the finest level the accuracy can support", () => {
    expect(pickResolution(5)).toBe(11);
    expect(pickResolution(maxAccuracyFor(11))).toBe(11);
    expect(pickResolution(maxAccuracyFor(11) + 1)).toBe(10);
    expect(pickResolution(30)).toBe(10);
    expect(pickResolution(60)).toBe(9);
  });

  it("rejects fixes too imprecise for any level", () => {
    expect(pickResolution(MAX_USABLE_ACCURACY_M + 1)).toBeNull();
    expect(pickResolution(0)).toBeNull();
    expect(pickResolution(Number.NaN)).toBeNull();
  });

  it("never picks a cell narrower than twice the accuracy", () => {
    for (const acc of [3, 10, 14, 20, 37, 50, 99]) {
      const res = pickResolution(acc);
      if (res !== null) expect(edgeMetres(res)).toBeGreaterThanOrEqual(2 * acc);
    }
  });
});

describe("checkFix", () => {
  const base: Fix = { ...KOCHI, accuracy: 10, timestamp: 1_000_000 };

  it("accepts a normal fix", () => {
    expect(checkFix(base).ok).toBe(true);
  });

  it("rejects an inaccurate fix", () => {
    expect(checkFix({ ...base, accuracy: 500 })).toEqual({ ok: false, reason: "too_inaccurate" });
  });

  it("rejects impossible coordinates", () => {
    expect(checkFix({ ...base, lat: 120 })).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a jump faster than 50 m/s", () => {
    // About 5.5 km north in 10 seconds.
    const jump: Fix = { ...base, lat: base.lat + 0.05, timestamp: base.timestamp + 10_000 };
    expect(checkFix(jump, base)).toEqual({ ok: false, reason: "too_fast" });
  });

  it("allows walking speed", () => {
    // About 11 m in 10 seconds.
    const walk: Fix = { ...base, lat: base.lat + 0.0001, timestamp: base.timestamp + 10_000 };
    expect(checkFix(walk, base).ok).toBe(true);
  });
});

describe("haversineMetres", () => {
  it("measures one degree of latitude as about 111 km", () => {
    expect(haversineMetres(0, 0, 1, 0)).toBeGreaterThan(110_000);
    expect(haversineMetres(0, 0, 1, 0)).toBeLessThan(112_000);
  });
});

describe("LocationSmoother", () => {
  it("pulls a noisy fix toward the earlier estimate and lowers uncertainty", () => {
    const s = new LocationSmoother();
    s.update({ ...KOCHI, accuracy: 10, timestamp: 0 });
    const out = s.update({ lat: KOCHI.lat + 0.0005, lng: KOCHI.lng, accuracy: 30, timestamp: 1000 });
    expect(out.lat).toBeGreaterThan(KOCHI.lat);
    expect(out.lat).toBeLessThan(KOCHI.lat + 0.0005);
    expect(out.accuracy).toBeLessThan(10);
  });
});

describe("toCells and cellsNear", () => {
  it("returns a fine cell whose parent is the resolution-9 cell", () => {
    const r = toCells(KOCHI.lat, KOCHI.lng, 8);
    expect(r).not.toBeNull();
    expect(r!.resolution).toBe(11);
    expect(cellToParent(r!.cellFine, 9)).toBe(r!.cellR9);
  });

  it("returns null when accuracy is too poor", () => {
    expect(toCells(KOCHI.lat, KOCHI.lng, 400)).toBeNull();
  });

  it("treats touching cells as near and distant cells as not near", () => {
    const a = latLngToCell(KOCHI.lat, KOCHI.lng, 11);
    const touching = gridDisk(a, 1).find((c) => c !== a)!;
    const far = latLngToCell(KOCHI.lat + 0.05, KOCHI.lng, 11);
    expect(cellsNear(a, a)).toBe(true);
    expect(cellsNear(a, touching)).toBe(true);
    expect(cellsNear(a, far)).toBe(false);
  });

  it("compares different resolutions at the coarser one", () => {
    const fine = latLngToCell(KOCHI.lat, KOCHI.lng, 11);
    expect(cellsNear(fine, cellToParent(fine, 9))).toBe(true);
  });
});

describe("validateBeacon", () => {
  const now = 2_000_000;
  const cells = toCells(KOCHI.lat, KOCHI.lng, 8)!;
  const good = { cellFine: cells.cellFine, resolution: cells.resolution, cellR9: cells.cellR9, accuracyM: 8, at: now - 1000 };

  it("accepts a valid beacon", () => {
    expect(validateBeacon(good, now).ok).toBe(true);
  });

  it("refuses any request that contains coordinates", () => {
    const r = validateBeacon({ ...good, lat: KOCHI.lat, lng: KOCHI.lng }, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/coordinates/i);
  });

  it("refuses a mismatched resolution or parent", () => {
    expect(validateBeacon({ ...good, resolution: 10 }, now).ok).toBe(false);
    const otherR9 = latLngToCell(KOCHI.lat + 0.05, KOCHI.lng, 9);
    expect(validateBeacon({ ...good, cellR9: otherR9 }, now).ok).toBe(false);
  });

  it("refuses stale and future beacons", () => {
    expect(validateBeacon({ ...good, at: now - 61_000 }, now).ok).toBe(false);
    expect(validateBeacon({ ...good, at: now + 60_000 }, now).ok).toBe(false);
  });

  it("refuses garbage", () => {
    expect(validateBeacon(null, now).ok).toBe(false);
    expect(validateBeacon({ ...good, cellFine: "not-a-cell" }, now).ok).toBe(false);
  });
});
