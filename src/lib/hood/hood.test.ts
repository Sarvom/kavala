import { describe, expect, it } from "vitest";
import { cellToParent, getResolution, latLngToCell } from "h3-js";
import { rebalance, type Neighbourhood } from "./rebalance";
import { assignNeighbourhood, findNeighbourhood } from "./assign";
import { KOCHI_CENTRE, syntheticResidents } from "./synthetic";

function overlaps(a: string, b: string): boolean {
  const ra = getResolution(a);
  const rb = getResolution(b);
  if (ra === rb) return a === b;
  return ra < rb ? cellToParent(b, ra) === a : cellToParent(a, rb) === b;
}

describe("rebalance", () => {
  const residents = syntheticResidents(600, 42);
  const hoods = rebalance(residents);

  it("places every resident in exactly one neighbourhood", () => {
    const all = hoods.flatMap((h) => h.members);
    expect(all.length).toBe(residents.length);
    expect(new Set(all).size).toBe(residents.length);
  });

  it("never lets two neighbourhoods cover the same ground", () => {
    const cells = hoods.flatMap((h) => h.cells.map((c) => ({ c, id: h.id })));
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        expect(overlaps(cells[i].c, cells[j].c)).toBe(false);
      }
    }
  });

  it("keeps neighbourhoods under the cap, allowing for pooled leftovers", () => {
    for (const h of hoods) expect(h.members.length).toBeLessThanOrEqual(150 + 30);
  });

  it("uses smaller cells in the dense centre than at the sparse edge", () => {
    const centre = latLngToCell(KOCHI_CENTRE.lat, KOCHI_CENTRE.lng, 9);
    const centreHood = findNeighbourhood(centre, hoods)!;
    const coarsest = Math.min(...hoods.map((h) => h.resolution));
    expect(centreHood).not.toBeNull();
    expect(centreHood.resolution).toBeGreaterThan(coarsest);
  });

  it("keeps a small sparse area as one neighbourhood", () => {
    const few = syntheticResidents(20, 7);
    const sparse = rebalance(few.map((r) => ({ ...r, homeCell: few[0].homeCell })));
    expect(sparse.length).toBe(1);
    expect(sparse[0].resolution).toBe(6);
  });
});

describe("assignNeighbourhood", () => {
  it("returns the existing neighbourhood that contains the home cell", () => {
    const home = latLngToCell(KOCHI_CENTRE.lat, KOCHI_CENTRE.lng, 9);
    const hood: Neighbourhood = { id: "x", cells: [cellToParent(home, 7)], resolution: 7, members: [] };
    expect(assignNeighbourhood(home, [hood])).toEqual({ hood, created: false });
  });

  it("creates a resolution-7 neighbourhood where there is none", () => {
    const home = latLngToCell(KOCHI_CENTRE.lat, KOCHI_CENTRE.lng, 9);
    const r = assignNeighbourhood(home, []);
    expect(r.created).toBe(true);
    expect(r.hood.resolution).toBe(7);
  });

  it("creates a finer neighbourhood rather than overlap an existing one", () => {
    const home = latLngToCell(KOCHI_CENTRE.lat, KOCHI_CENTRE.lng, 9);
    const sibling = latLngToCell(KOCHI_CENTRE.lat + 0.004, KOCHI_CENTRE.lng, 9);
    const neighbour8 = cellToParent(sibling, 8);
    const existing: Neighbourhood = { id: neighbour8, cells: [neighbour8], resolution: 8, members: [] };
    const r = assignNeighbourhood(home, [existing]);
    if (cellToParent(home, 8) === neighbour8) {
      expect(r.created).toBe(false);
    } else {
      expect(r.created).toBe(true);
      expect(r.hood.resolution).toBeGreaterThan(7);
      expect(overlaps(r.hood.cells[0], neighbour8)).toBe(false);
    }
  });
});
