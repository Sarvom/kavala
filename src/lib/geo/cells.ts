import {
  cellToBoundary,
  cellToParent,
  getResolution,
  gridDistance,
  isValidCell,
  latLngToCell,
} from "h3-js";
import { HOME_RESOLUTION, pickResolution, type FineResolution } from "./resolution";

export interface CellReading {
  /** Finest cell the accuracy allows (resolution 9, 10 or 11). */
  cellFine: string;
  resolution: FineResolution;
  /** The resolution-9 cell that contains it (about 0.1 sq km). */
  cellR9: string;
}

/**
 * Converts a position into cell IDs on the device. Returns null when the
 * accuracy is too poor for any resolution.
 */
export function toCells(lat: number, lng: number, accuracyMetres: number): CellReading | null {
  const resolution = pickResolution(accuracyMetres);
  if (resolution === null) return null;
  const cellFine = latLngToCell(lat, lng, resolution);
  const cellR9 = resolution === HOME_RESOLUTION ? cellFine : cellToParent(cellFine, HOME_RESOLUTION);
  return { cellFine, resolution, cellR9 };
}

/** Polygon for drawing a cell on a map, as [lat, lng] pairs. */
export function cellPolygon(cell: string): [number, number][] {
  return cellToBoundary(cell) as [number, number][];
}

/**
 * True when two cells are the same or touch. Cells at different resolutions
 * are compared at the coarser of the two, so precision is never overclaimed.
 */
export function cellsNear(a: string, b: string): boolean {
  if (!isValidCell(a) || !isValidCell(b)) return false;
  const res = Math.min(getResolution(a), getResolution(b));
  const pa = getResolution(a) === res ? a : cellToParent(a, res);
  const pb = getResolution(b) === res ? b : cellToParent(b, res);
  if (pa === pb) return true;
  try {
    return gridDistance(pa, pb) <= 1;
  } catch {
    // gridDistance throws for cells too far apart to compare; they are not near.
    return false;
  }
}
