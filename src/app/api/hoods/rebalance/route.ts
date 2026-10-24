import { NextResponse } from "next/server";
import { rebalanceOnServer } from "@/lib/hood/server";
import { serverSupabase } from "@/lib/supabase/server";

/**
 * Regroups everyone into neighbourhoods sized by people. Vercel's cron calls
 * GET nightly with `Authorization: Bearer <CRON_SECRET>` (see vercel.json);
 * the same header lets you run it on demand with POST, for example
 * `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/hoods/rebalance`.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not set, so the rebalance cannot be called safely." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }
  const db = serverSupabase();
  if (!db) return NextResponse.json({ ok: false, error: "The database is not connected." }, { status: 503 });
  try {
    const result = await rebalanceOnServer(db);
    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Rebalance failed." }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
