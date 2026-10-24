import { randomBytes } from "node:crypto";

let temporary: string | null = null;

/**
 * The secret used to sign handshake codes. In production it must come from the
 * HANDSHAKE_SECRET environment variable. During local development a temporary
 * random secret is used if none is set, and the caller is told so.
 */
export function handshakeSecret(): { secret: string; temporary: boolean } | null {
  const fromEnv = process.env.HANDSHAKE_SECRET;
  if (fromEnv && fromEnv.length >= 32) return { secret: fromEnv, temporary: false };
  if (process.env.NODE_ENV === "production") return null;
  temporary ??= randomBytes(32).toString("hex");
  return { secret: temporary, temporary: true };
}

/**
 * Codes that have already been used. Kept in memory for the base version, so
 * it resets when the server restarts; Phase 4 moves it to the database.
 */
export const usedNonces = new Set<string>();
