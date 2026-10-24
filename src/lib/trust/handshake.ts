import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isValidCell } from "h3-js";
import { cellsNear } from "../geo/cells";

/** What phone A shows as a QR code (or a typed code) for phone B to scan. */
export interface HandshakePayload {
  userId: string;
  nonce: string;
  issuedAt: number;
  cellFine: string;
}

export type HandshakeResult =
  | { ok: true; payload: HandshakePayload }
  | {
      ok: false;
      reason: "bad_format" | "bad_signature" | "expired" | "reused" | "too_far" | "same_person" | "bad_cell";
      message: string;
    };

/** A code is valid for this long after it is issued. */
export const HANDSHAKE_TTL_MS = 30_000;

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(body: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(body).digest());
}

/** Creates a signed code for phone A. */
export function issueCode(userId: string, cellFine: string, secret: string, now = Date.now()): string {
  const payload: HandshakePayload = { userId, nonce: b64url(randomBytes(12)), issuedAt: now, cellFine };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body, secret)}`;
}

/**
 * Checks a code scanned by phone B. Passes only when the signature is genuine,
 * the code is under 30 seconds old, it has not been used before, it belongs to
 * someone else, and both phones are in the same or touching cells.
 */
export function verifyCode(
  code: string,
  verifier: { userId: string; cellFine: string },
  secret: string,
  usedNonces: Set<string>,
  now = Date.now(),
): HandshakeResult {
  const parts = typeof code === "string" ? code.split(".") : [];
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "bad_format", message: "This is not a Kavala handshake code." };
  }
  const [body, signature] = parts;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad_signature", message: "The code's signature is not genuine." };
  }

  let payload: HandshakePayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_format", message: "The code could not be read." };
  }
  if (now - payload.issuedAt > HANDSHAKE_TTL_MS || payload.issuedAt - now > 5_000) {
    return { ok: false, reason: "expired", message: "The code is older than 30 seconds. Ask for a fresh one." };
  }
  if (usedNonces.has(payload.nonce)) {
    return { ok: false, reason: "reused", message: "This code has already been used." };
  }
  if (payload.userId === verifier.userId) {
    return { ok: false, reason: "same_person", message: "You can't vouch for yourself." };
  }
  if (!isValidCell(payload.cellFine) || !isValidCell(verifier.cellFine)) {
    return { ok: false, reason: "bad_cell", message: "A location cell is missing or invalid." };
  }
  if (!cellsNear(payload.cellFine, verifier.cellFine)) {
    return { ok: false, reason: "too_far", message: "The two phones are not in the same place." };
  }
  usedNonces.add(payload.nonce);
  return { ok: true, payload };
}
