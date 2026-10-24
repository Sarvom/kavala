import { NextResponse } from "next/server";
import { validateBeacon } from "@/lib/geo/beacon";
import { serverSupabase } from "@/lib/supabase/server";

const DEVICE_ID = /^[0-9a-f-]{36}$/i;

/**
 * Receives a phone's position as H3 cell IDs. Requests that contain raw
 * coordinates are refused by validateBeacon.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be valid JSON." }, { status: 400 });
  }

  const deviceId = (body as { deviceId?: unknown })?.deviceId;
  if (typeof deviceId !== "string" || !DEVICE_ID.test(deviceId)) {
    return NextResponse.json({ ok: false, error: "deviceId must be a random UUID." }, { status: 400 });
  }
  const { deviceId: _omit, ...rest } = body as Record<string, unknown>;
  const check = validateBeacon(rest);
  if (!check.ok) return NextResponse.json({ ok: false, error: check.error }, { status: 422 });

  const db = serverSupabase();
  if (!db) {
    return NextResponse.json({
      ok: true,
      stored: false,
      message: "Beacon is valid. Nothing was stored because the database is not connected yet (Phase 2).",
      received: check.beacon,
    });
  }

  const b = check.beacon;
  const { error } = await db.from("presence").upsert(
    {
      device_id: deviceId,
      cell_r9: b.cellR9,
      cell_fine: b.cellFine,
      resolution: b.resolution,
      accuracy_m: Math.round(b.accuracyM),
      seen_at: new Date(b.at).toISOString(),
    },
    { onConflict: "device_id" },
  );
  if (error) {
    return NextResponse.json({ ok: false, error: `Database error: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true, received: b });
}
