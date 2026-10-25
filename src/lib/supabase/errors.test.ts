import { describe, expect, it } from "vitest";
import { isMissingColumn } from "./errors";

describe("isMissingColumn", () => {
  it("spots an unapplied migration from Postgres or PostgREST errors", () => {
    expect(isMissingColumn({ code: "PGRST204", message: "Could not find the 'puzzle_points' column of 'daily_plays'" }, "puzzle_points")).toBe(true);
    expect(isMissingColumn({ code: "42703", message: 'column "puzzle_points" does not exist' }, "puzzle_points")).toBe(true);
    expect(isMissingColumn({ code: "23514", message: "violates check constraint puzzle_points" }, "puzzle_points")).toBe(false);
  });
});
