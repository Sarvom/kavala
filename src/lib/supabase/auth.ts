import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Finds the signed-in Supabase user behind a request's bearer token. Returns
 * null when there is no token or it does not check out.
 */
export async function userFromRequest(request: Request, db: SupabaseClient): Promise<User | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
