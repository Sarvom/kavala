import { NextResponse } from "next/server";
import { isValidCell } from "h3-js";
import { HANDSHAKE_TTL_MS, issueCode } from "@/lib/trust/handshake";
import { handshakeSecret } from "@/lib/trust/secret";

/** Phone A asks for a fresh signed code to show phone B. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: unknown; cellFine?: unknown } | null;
  if (!body || typeof body.userId !== "string" || body.userId.length < 1 || body.userId.length > 64) {
    return NextResponse.json({ ok: false, error: "userId is required." }, { status: 400 });
  }
  if (typeof body.cellFine !== "string" || !isValidCell(body.cellFine)) {
    return NextResponse.json({ ok: false, error: "cellFine must be a valid H3 cell ID." }, { status: 400 });
  }
  const s = handshakeSecret();
  if (!s) {
    return NextResponse.json({ ok: false, error: "HANDSHAKE_SECRET is not set on the server." }, { status: 503 });
  }
  const code = issueCode(body.userId, body.cellFine, s.secret);
  return NextResponse.json({ ok: true, code, expiresInMs: HANDSHAKE_TTL_MS, temporarySecret: s.temporary });
}
