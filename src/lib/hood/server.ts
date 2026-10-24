import type { SupabaseClient } from "@supabase/supabase-js";
import { assignNeighbourhood } from "./assign";
import { rebalance, type Neighbourhood, type Resident } from "./rebalance";

/** A neighbourhood as stored in the `neighbourhoods` table. */
export interface HoodRecord {
  id: string;
  cells: string[];
  resolution: number;
}

export interface RebalancePlan {
  hoods: HoodRecord[];
  /** Resident ID -> neighbourhood ID after the rebalance. */
  assignments: Map<string, string>;
  /** Residents whose neighbourhood changed. */
  moved: string[];
}

function toRecord(h: Neighbourhood): HoodRecord {
  return { id: h.id, cells: h.cells, resolution: h.resolution };
}

function asNeighbourhoods(records: HoodRecord[]): Neighbourhood[] {
  return records.map((r) => ({ ...r, members: [] }));
}

/**
 * Works out new neighbourhoods for everyone from their home cells. Pure, so
 * the nightly job and the tests share it. `current` maps resident ID to the
 * neighbourhood they are in now, to report who moved.
 */
export function planRebalance(residents: Resident[], current: Map<string, string | null>): RebalancePlan {
  const hoods = rebalance(residents);
  const assignments = new Map<string, string>();
  for (const h of hoods) for (const id of h.members) assignments.set(id, h.id);
  const moved = residents.filter((r) => current.get(r.id) !== assignments.get(r.id)).map((r) => r.id);
  return { hoods: hoods.map(toRecord), assignments, moved };
}

async function loadRealHoods(db: SupabaseClient): Promise<HoodRecord[]> {
  const { data, error } = await db.from("neighbourhoods").select("id, cells, resolution").eq("is_synthetic", false);
  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as HoodRecord[];
}

async function recount(db: SupabaseClient, hoodId: string): Promise<void> {
  const { count, error } = await db.from("users").select("id", { count: "exact", head: true }).eq("neighbourhood_id", hoodId).eq("is_synthetic", false);
  if (error) throw new Error(`Database error: ${error.message}`);
  const { error: updateError } = await db.from("neighbourhoods").update({ member_count: count ?? 0 }).eq("id", hoodId);
  if (updateError) throw new Error(`Database error: ${updateError.message}`);
}

/**
 * Picks the neighbourhood for a person's resolution-9 home cell: the existing
 * one that covers it, or a new one (the coarsest free cell at resolution 7, 8
 * or 9) saved to the table. Throws on database errors.
 */
export async function assignOnServer(db: SupabaseClient, homeCell: string): Promise<HoodRecord> {
  const { hood, created } = assignNeighbourhood(homeCell, asNeighbourhoods(await loadRealHoods(db)));
  if (created) {
    const { error } = await db
      .from("neighbourhoods")
      .upsert({ id: hood.id, cells: hood.cells, resolution: hood.resolution, is_synthetic: false }, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new Error(`Database error: ${error.message}`);
  }
  return toRecord(hood);
}

/** Updates the stored member count of one neighbourhood from the users table. */
export async function recountOnServer(db: SupabaseClient, hoodId: string): Promise<void> {
  await recount(db, hoodId);
}

export interface RebalanceResult {
  people: number;
  hoods: number;
  moved: number;
}

/**
 * The nightly (or on-demand) rebalance: regroups every real person by home
 * cell, saves the neighbourhoods, moves people whose neighbourhood changed and
 * refreshes member counts. Empty neighbourhoods are kept with a count of 0 so
 * nothing that points at them breaks.
 */
export async function rebalanceOnServer(db: SupabaseClient): Promise<RebalanceResult> {
  const { data: users, error } = await db.from("users").select("id, home_cell, neighbourhood_id").eq("is_synthetic", false);
  if (error) throw new Error(`Database error: ${error.message}`);
  const rows = (users ?? []) as { id: string; home_cell: string; neighbourhood_id: string | null }[];
  if (rows.length === 0) return { people: 0, hoods: 0, moved: 0 };

  const plan = planRebalance(
    rows.map((u) => ({ id: u.id, homeCell: u.home_cell })),
    new Map(rows.map((u) => [u.id, u.neighbourhood_id])),
  );

  const { error: hoodError } = await db
    .from("neighbourhoods")
    .upsert(plan.hoods.map((h) => ({ id: h.id, cells: h.cells, resolution: h.resolution, is_synthetic: false })), { onConflict: "id" });
  if (hoodError) throw new Error(`Database error: ${hoodError.message}`);

  for (const id of plan.moved) {
    const { error: moveError } = await db.from("users").update({ neighbourhood_id: plan.assignments.get(id) }).eq("id", id);
    if (moveError) throw new Error(`Database error: ${moveError.message}`);
  }

  const touched = new Set<string>([...plan.hoods.map((h) => h.id), ...rows.map((u) => u.neighbourhood_id).filter((x): x is string => !!x)]);
  for (const id of touched) await recount(db, id);

  return { people: rows.length, hoods: plan.hoods.length, moved: plan.moved.length };
}
