import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { coordinateError, findCoordinateKeys } from "@/lib/privacy/coordinates";
import { rowsToSnapshot, validateSnapshot, type DailyPlayRow, type HoodRow, type ProfileSnapshot, type UserRow } from "@/lib/app/sync";
import { serverSupabase } from "@/lib/supabase/server";
import { userFromRequest } from "@/lib/supabase/auth";
import { dailyKey } from "@/lib/daily/score";
import { assignOnServer, recountOnServer, type HoodRecord } from "@/lib/hood/server";

/**
 * A signed-in phone's saved profile and today's results.
 *   GET  /api/me?day=YYYY-MM-DD  -> { ok, snapshot | null }
 *   PUT  /api/me  (ProfileSnapshot body) -> { ok, hood }
 * Bodies with coordinates anywhere in them are refused with 422. The server
 * picks the neighbourhood from the home cell; the hood sent by the phone is
 * only a placeholder from before it had an account.
 */

const USER_COLUMNS = "id, mask_name, mask_color, mask_style, home_cell, home_from_gps, neighbourhood_id, trust_level, thanks, streak, best_streak, last_played_on";

function notConnected() {
  return NextResponse.json({ ok: false, error: "The database is not connected, so nothing is saved to an account yet." }, { status: 503 });
}

export async function GET(request: Request) {
  const db = serverSupabase();
  if (!db) return notConnected();
  const user = await userFromRequest(request, db);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const day = new URL(request.url).searchParams.get("day") ?? dailyKey();
  const result = await loadSnapshot(db, user.id, day);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, snapshot: result.snapshot });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be valid JSON." }, { status: 400 });
  }
  const coords = findCoordinateKeys(body);
  if (coords.length > 0) return NextResponse.json({ ok: false, error: coordinateError(coords) }, { status: 422 });
  const check = validateSnapshot(body);
  if (!check.ok) return NextResponse.json({ ok: false, error: check.error }, { status: 422 });

  const db = serverSupabase();
  if (!db) return notConnected();
  const user = await userFromRequest(request, db);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const result = await saveSnapshot(db, user, check.snapshot);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, hood: result.hood });
}

async function loadSnapshot(db: SupabaseClient, authUserId: string, day: string): Promise<{ snapshot: ProfileSnapshot | null } | { error: string }> {
  const { data: user, error } = await db.from("users").select(USER_COLUMNS).eq("auth_user_id", authUserId).maybeSingle<UserRow & { id: string }>();
  if (error) return { error: `Database error: ${error.message}` };
  if (!user) return { snapshot: null };

  const [hoodRes, playRes] = await Promise.all([
    user.neighbourhood_id
      ? db.from("neighbourhoods").select("id, cells, resolution").eq("id", user.neighbourhood_id).maybeSingle<HoodRow>()
      : Promise.resolve({ data: null, error: null }),
    db.from("daily_plays").select("day, spot_points, spot_distance_m, spot_skipped, help, step, done").eq("user_id", user.id).eq("day", day).maybeSingle<DailyPlayRow>(),
  ]);
  if (hoodRes.error) return { error: `Database error: ${hoodRes.error.message}` };
  if (playRes.error) return { error: `Database error: ${playRes.error.message}` };
  return { snapshot: rowsToSnapshot(user, hoodRes.data, playRes.data, day) };
}

/**
 * Writes the profile and today's play. Trust level comes from the sign-in,
 * not from the phone: Google counts as verified, anonymous stays masked. The
 * neighbourhood is assigned here from the home cell (kept when the person
 * already has one, until the nightly rebalance moves them).
 */
async function saveSnapshot(db: SupabaseClient, user: User, snap: ProfileSnapshot): Promise<{ hood: HoodRecord } | { error: string }> {
  const provider = user.is_anonymous ? "anonymous" : "google";
  const { data: existing, error: existingError } = await db
    .from("users")
    .select("neighbourhood_id, home_cell, neighbourhoods(id, cells, resolution)")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ neighbourhood_id: string | null; home_cell: string; neighbourhoods: HoodRecord | null }>();
  if (existingError) return { error: `Database error: ${existingError.message}` };

  let hood: HoodRecord;
  try {
    hood =
      existing?.neighbourhoods && existing.home_cell === snap.homeCell ? existing.neighbourhoods : await assignOnServer(db, snap.homeCell);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign a neighbourhood." };
  }

  const { data: saved, error: userError } = await db
    .from("users")
    .upsert(
      {
        auth_user_id: user.id,
        provider,
        mask_name: snap.maskName,
        mask_color: snap.maskColor,
        mask_style: snap.maskStyle,
        home_cell: snap.homeCell,
        home_from_gps: snap.homeFromGps,
        neighbourhood_id: hood.id,
        trust_level: provider === "google" ? "verified" : "masked",
        thanks: snap.thanks,
        streak: snap.streak,
        best_streak: snap.bestStreak,
        last_played_on: snap.lastPlayedKey ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single<{ id: string }>();
  if (userError || !saved) return { error: `Database error: ${userError?.message ?? "no user row"}` };
  if (existing?.neighbourhood_id !== hood.id) {
    try {
      await recountOnServer(db, hood.id);
      if (existing?.neighbourhood_id) await recountOnServer(db, existing.neighbourhood_id);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not update member counts." };
    }
  }

  const d = snap.daily;
  const { error: playError } = await db.from("daily_plays").upsert(
    {
      user_id: saved.id,
      day: d.key,
      spot_points: d.spotPoints ?? null,
      spot_distance_m: d.spotDistanceM ?? null,
      spot_skipped: d.spotSkipped,
      help: d.help ?? null,
      step: d.step ?? null,
      done: d.done,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" },
  );
  if (playError) return { error: `Database error: ${playError.message}` };
  return { hood };
}
