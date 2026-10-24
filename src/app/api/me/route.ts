import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { coordinateError, findCoordinateKeys } from "@/lib/privacy/coordinates";
import { rowsToSnapshot, validateSnapshot, type DailyPlayRow, type HoodRow, type ProfileSnapshot, type UserRow } from "@/lib/app/sync";
import { serverSupabase } from "@/lib/supabase/server";
import { userFromRequest } from "@/lib/supabase/auth";
import { dailyKey } from "@/lib/daily/score";

/**
 * A signed-in phone's saved profile and today's results.
 *   GET  /api/me?day=YYYY-MM-DD  -> { ok, snapshot | null }
 *   PUT  /api/me  (ProfileSnapshot body) -> { ok }
 * Bodies with coordinates anywhere in them are refused with 422.
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

  const error = await saveSnapshot(db, user, check.snapshot);
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true });
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
 * not from the phone: Google counts as verified, anonymous stays masked.
 */
async function saveSnapshot(db: SupabaseClient, user: User, snap: ProfileSnapshot): Promise<string | null> {
  const provider = user.is_anonymous ? "anonymous" : "google";
  const { error: hoodError } = await db
    .from("neighbourhoods")
    .upsert({ id: snap.hood.id, cells: snap.hood.cells, resolution: snap.hood.resolution }, { onConflict: "id", ignoreDuplicates: true });
  if (hoodError) return `Database error: ${hoodError.message}`;

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
        neighbourhood_id: snap.hood.id,
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
  if (userError || !saved) return `Database error: ${userError?.message ?? "no user row"}`;

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
  if (playError) return `Database error: ${playError.message}`;
  return null;
}
