import { describe, expect, it } from "vitest";
import { cellToParent, getResolution, latLngToCell } from "h3-js";
import { planRebalance } from "./server";
import { syntheticResidents } from "./synthetic";

const kochi = latLngToCell(9.9816, 76.2999, 9);

describe("planRebalance", () => {
  it("puts a handful of early players into one neighbourhood and reports who moved", () => {
    const residents = [
      { id: "a", homeCell: kochi },
      { id: "b", homeCell: latLngToCell(9.99, 76.31, 9) },
      { id: "c", homeCell: latLngToCell(9.97, 76.29, 9) },
    ];
    const current = new Map<string, string | null>([
      ["a", cellToParent(kochi, 7)],
      ["b", null],
      ["c", cellToParent(kochi, 7)],
    ]);
    const plan = planRebalance(residents, current);
    expect(plan.hoods).toHaveLength(1);
    expect(getResolution(plan.hoods[0].cells[0])).toBe(6);
    expect(new Set(plan.assignments.values()).size).toBe(1);
    expect(plan.moved.sort()).toEqual(["a", "b", "c"]);
    expect(planRebalance(residents, plan.assignments).moved).toEqual([]);
  });

  it("keeps every synthetic resident assigned to exactly one of the planned neighbourhoods", () => {
    const residents = syntheticResidents(600, 7);
    const plan = planRebalance(residents, new Map());
    const ids = new Set(plan.hoods.map((h) => h.id));
    expect(plan.assignments.size).toBe(residents.length);
    for (const r of residents) expect(ids.has(plan.assignments.get(r.id)!)).toBe(true);
    expect(plan.moved).toHaveLength(residents.length);
  });
});
