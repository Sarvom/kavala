import { cellToParent, getResolution } from "h3-js";
import type { Neighbourhood } from "./rebalance";

/** Resolutions tried, coarsest first, when creating a new neighbourhood. */
const NEW_HOOD_RESOLUTIONS = [7, 8, 9];

function parentAt(cell: string, res: number): string {
  return getResolution(cell) === res ? cell : cellToParent(cell, res);
}

/** Finds the neighbourhood whose cells contain this resolution-9 home cell. */
export function findNeighbourhood(homeCell: string, hoods: Neighbourhood[]): Neighbourhood | null {
  for (const hood of hoods) {
    if (getResolution(homeCell) < hood.resolution) continue;
    const key = parentAt(homeCell, hood.resolution);
    if (hood.cells.includes(key)) return hood;
  }
  return null;
}

/**
 * Returns the neighbourhood for a new resident, creating one if needed. A new
 * neighbourhood uses the coarsest cell (resolution 7, then 8, then 9) that
 * does not overlap any existing neighbourhood.
 */
export function assignNeighbourhood(
  homeCell: string,
  hoods: Neighbourhood[],
): { hood: Neighbourhood; created: boolean } {
  const existing = findNeighbourhood(homeCell, hoods);
  if (existing) return { hood: existing, created: false };

  const allCells = hoods.flatMap((h) => h.cells);
  for (const res of NEW_HOOD_RESOLUTIONS) {
    const candidate = parentAt(homeCell, res);
    const overlaps = allCells.some((c) => getResolution(c) >= res && parentAt(c, res) === candidate);
    if (!overlaps) {
      return { hood: { id: candidate, cells: [candidate], resolution: res, members: [] }, created: true };
    }
  }
  // Only reachable if an existing neighbourhood already covers this exact cell.
  return { hood: { id: homeCell, cells: [homeCell], resolution: getResolution(homeCell), members: [] }, created: true };
}
