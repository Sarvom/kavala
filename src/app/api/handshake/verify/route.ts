import { NextResponse } from "next/server";
import { verifyCode } from "@/lib/trust/handshake";
import { handshakeSecret, usedNonces } from "@/lib/trust/secret";

/** Phone B sends the code it scanned plus its own current cell. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { code?: unknown; userId?: unknown; cellFine?: unknown }
    | null;
  if (!body || typeof body.code !== "string" || typeof body.userId !== "string" || typeof body.cellFine !== "string") {
    return NextResponse.json({ ok: false, error: "code, userId and cellFine are required." }, { status: 400 });
  }
  const s = handshakeSecret();
  if (!s) {
    return NextResponse.json({ ok: false, error: "HANDSHAKE_SECRET is not set on the server." }, { status: 503 });
  }
  const result = verifyCode(body.code, { userId: body.userId, cellFine: body.cellFine }, s.secret, usedNonces);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason, message: result.message }, { status: 422 });
  }
  return NextResponse.json({
    ok: true,
    vouchedFor: result.payload.userId,
    message: `Handshake verified. ${body.userId} vouched for ${result.payload.userId}.`,
  });
}
