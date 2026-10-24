import { areNeighborCells, cellToParent, getResolution } from "h3-js";
import { HOME_RESOLUTION } from "../geo/resolution";

export interface Resident {
  id: string;
  /** Resolution-9 home cell. */
  homeCell: string;
}

export interface Neighbourhood {
  /** Stable ID: the first cell, plus a suffix when several cells are pooled. */
  id: string;
  /** H3 cells that make up the neighbourhood, all at `resolution`. */
  cells: string[];
  resolution: number;
  members: string[];
}

export interface RebalanceOptions {
  /** Fewest members a neighbourhood should have (default 30). */
  min: number;
  /** Most members a neighbourhood should have (default 150). */
  max: number;
  /** Coarsest resolution used, for sparse areas (default 6, about 36 sq km). */
  coarsest: number;
  /** Finest resolution used, for dense areas (default 9, about 0.1 sq km). */
  finest: number;
}

export const DEFAULT_OPTIONS: RebalanceOptions = { min: 30, max: 150, coarsest: 6, finest: HOME_RESOLUTION };

interface Group {
  cells: string[];
  residents: Resident[];
}

function parentAt(cell: string, res: number): string {
  return getResolution(cell) === res ? cell : cellToParent(cell, res);
}

function groupBy(residents: Resident[], res: number): Map<string, Resident[]> {
  const groups = new Map<string, Resident[]>();
  for (const r of residents) {
    const key = parentAt(r.homeCell, res);
    const list = groups.get(key);
    if (list) list.push(r);
    else groups.set(key, [r]);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
}

function touches(a: Group, b: Group): boolean {
  return a.cells.some((x) => b.cells.some((y) => areNeighborCells(x, y)));
}

function toHood(g: Group, resolution: number): Neighbourhood {
  const id = g.cells.length === 1 ? g.cells[0] : `${g.cells[0]}+${g.cells.length - 1}`;
  return { id, cells: g.cells, resolution, members: g.residents.map((r) => r.id) };
}

/**
 * Pools cells that are each too small into touching groups of at least `min`
 * people. A pool that stays too small joins the smallest touching group in
 * `others` (or among the pools); an isolated small pool is left on its own.
 */
function poolSmall(small: Group[], others: Group[], min: number): Group[] {
  const pools: Group[] = [];
  const bySize = [...small].sort((a, b) => b.residents.length - a.residents.length);
  for (const item of bySize) {
    const open = pools.find((p) => p.residents.length < min && touches(p, item));
    if (open) {
      open.cells.push(...item.cells);
      open.residents.push(...item.residents);
    } else {
      pools.push({ cells: [...item.cells], residents: [...item.residents] });
    }
  }

  const done: Group[] = [];
  for (const pool of pools) {
    if (pool.residents.length >= min) {
      done.push(pool);
      continue;
    }
    const candidates = [...others, ...done, ...pools.filter((p) => p !== pool && p.residents.length >= min)].filter(
      (g) => g !== pool && touches(g, pool),
    );
    if (candidates.length > 0) {
      const target = candidates.reduce((a, b) => (a.residents.length <= b.residents.length ? a : b));
      target.cells.push(...pool.cells);
      target.residents.push(...pool.residents);
    } else {
      done.push(pool);
    }
  }
  return done;
}

/**
 * Splits one cell's residents into neighbourhoods. A cell with more than `max`
 * residents splits into its child cells; children that end up too small are
 * pooled with touching neighbours.
 */
function build(cell: string, residents: Resident[], res: number, opt: RebalanceOptions): Neighbourhood[] {
  if (residents.length <= opt.max || res >= opt.finest) return [toHood({ cells: [cell], residents }, res)];

  const deeper: Neighbourhood[] = [];
  const sized: Group[] = [];
  const small: Group[] = [];
  for (const [child, group] of groupBy(residents, res + 1)) {
    if (group.length > opt.max) deeper.push(...build(child, group, res + 1, opt));
    else if (group.length >= opt.min) sized.push({ cells: [child], residents: group });
    else small.push({ cells: [child], residents: group });
  }
  const pooled = poolSmall(small, sized, opt.min);
  return [...deeper, ...[...sized, ...pooled].map((g) => toHood(g, res + 1))];
}

/**
 * Groups residents into neighbourhoods sized by people, not distance: dense
 * areas split into small cells, sparse areas stay in large ones, and cells
 * that are too small are pooled with touching cells.
 *
 * Known limits (base version): a pool can exceed `max` by up to `min` people,
 * and an isolated sparse area with fewer than `min` residents stays small.
 */
export function rebalance(residents: Resident[], options: Partial<RebalanceOptions> = {}): Neighbourhood[] {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  const out: Neighbourhood[] = [];
  const topSmall: Group[] = [];
  const topSized: Group[] = [];
  for (const [cell, group] of groupBy(residents, opt.coarsest)) {
    if (group.length > opt.max) out.push(...build(cell, group, opt.coarsest, opt));
    else if (group.length >= opt.min) topSized.push({ cells: [cell], residents: group });
    else topSmall.push({ cells: [cell], residents: group });
  }
  const pooled = poolSmall(topSmall, topSized, opt.min);
  out.push(...[...topSized, ...pooled].map((g) => toHood(g, opt.coarsest)));
  return out;
}
