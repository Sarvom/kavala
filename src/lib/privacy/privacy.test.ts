import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { latLngToCell } from "h3-js";
import { findCoordinateKeys } from "./coordinates";
import { validateBeacon } from "../geo/beacon";
import { PUT } from "../../app/api/me/route";

const MIGRATIONS = path.resolve(process.cwd(), "supabase/migrations");
const COORDINATE_COLUMNS = /^\s*(lat|lng|lon|latitude|longitude|coords|coordinates|position|location|geom|geog)\b/i;

/** Column definitions per table, from every `create table` block in the migrations. */
function tableColumns(): Map<string, string[]> {
  const tables = new Map<string, string[]>();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(path.join(MIGRATIONS, file), "utf8");
    for (const m of sql.matchAll(/create table (\w+) \(([\s\S]*?)\n\);/g)) {
      tables.set(m[1], m[2].split("\n").map((l) => l.replace(/--.*$/, "").trim()).filter(Boolean));
    }
    for (const m of sql.matchAll(/alter table (\w+)\s+((?:add column[\s\S]*?)+);/g)) {
      const cols = m[2].split(/add column/).map((l) => l.replace(/--.*$/, "").trim()).filter(Boolean);
      tables.set(m[1], [...(tables.get(m[1]) ?? []), ...cols]);
    }
  }
  return tables;
}

describe("no coordinates for people", () => {
  it("finds coordinate keys however deeply they are nested", () => {
    expect(findCoordinateKeys({ cellR9: "x", at: 1 })).toEqual([]);
    expect(findCoordinateKeys({ Lat: 1, lng: 2 })).toEqual(["Lat", "lng"]);
    expect(findCoordinateKeys({ daily: { spot: { guesses: [{ lat: 1, lng: 2 }] } } })).toEqual([
      "daily.spot.guesses[0].lat",
      "daily.spot.guesses[0].lng",
    ]);
    expect(findCoordinateKeys({ profile: { coordinates: [1, 2] } })).toEqual(["profile.coordinates"]);
  });

  it("beacon refuses coordinates even when nested", () => {
    const fine = latLngToCell(9.98, 76.3, 11);
    const ok = { cellFine: fine, resolution: 11, cellR9: latLngToCell(9.98, 76.3, 9), accuracyM: 12, at: 1000 };
    expect(validateBeacon(ok, 2000).ok).toBe(true);
    expect(validateBeacon({ ...ok, extra: { latitude: 9.98 } }, 2000)).toMatchObject({ ok: false, error: /Raw coordinates/ });
  });

  it("/api/me refuses a body with coordinates before touching the database", async () => {
    const put = (body: unknown) =>
      PUT(new Request("http://kavala.test/api/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
    const home = latLngToCell(9.98, 76.3, 9);
    const hood = latLngToCell(9.98, 76.3, 7);
    const clean = {
      maskName: "Gwen George",
      maskColor: "#1d6a4e",
      maskStyle: "classic",
      homeCell: home,
      homeFromGps: true,
      hood: { id: hood, cells: [hood], resolution: 7 },
      level: "masked",
      thanks: 0,
      streak: 0,
      bestStreak: 0,
      daily: { key: "2026-10-25", spotSkipped: false, done: false },
    };
    const withCoords = await put({ ...clean, daily: { ...clean.daily, guesses: [{ lat: 9.98, lng: 76.3 }] } });
    expect(withCoords.status).toBe(422);
    expect((await withCoords.json()).error).toMatch(/Raw coordinates are not accepted \(daily.guesses\[0\].lat/);

    const fineCell = await put({ ...clean, homeCell: latLngToCell(9.98, 76.3, 11) });
    expect(fineCell.status).toBe(422);
    expect((await fineCell.json()).error).toMatch(/resolution-9/);

    // Valid body, but no database here: an honest 503, not a silent success.
    const valid = await put(clean);
    expect(valid.status).toBe(503);
  });

  it("no table except places has a coordinate column", () => {
    const tables = tableColumns();
    expect(tables.size).toBeGreaterThan(10);
    for (const [table, cols] of tables) {
      const bad = cols.filter((c) => COORDINATE_COLUMNS.test(c));
      if (table === "places") expect(bad.length).toBe(2);
      else expect({ table, bad }).toEqual({ table, bad: [] });
    }
    for (const table of ["users", "presence", "daily_plays", "vouches", "reveals"]) {
      const cols = tables.get(table)!.join("\n");
      expect(cols).not.toMatch(/double precision|geography|geometry|point\b/i);
    }
  });
});
