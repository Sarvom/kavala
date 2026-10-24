"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { browserSupabase } from "../supabase/browser";
import { applySnapshot, toSnapshot, type ProfileSnapshot } from "./sync";
import type { AppState } from "./state";
import type { AccountProfile } from "./useGoogleAccount";

export type SaveStatus = "off" | "loading" | "saving" | "saved" | "error";

async function token(): Promise<string | null> {
  const { data } = (await browserSupabase()?.auth.getSession()) ?? { data: { session: null } };
  return data.session?.access_token ?? null;
}

async function fetchSnapshot(day: string): Promise<ProfileSnapshot | null | undefined> {
  const t = await token();
  if (!t) return undefined;
  const res = await fetch(`/api/me?day=${day}`, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) return undefined;
  const body = (await res.json()) as { ok: boolean; snapshot: ProfileSnapshot | null };
  return body.ok ? body.snapshot : undefined;
}

async function putSnapshot(snap: ProfileSnapshot): Promise<boolean> {
  const t = await token();
  if (!t) return false;
  const res = await fetch("/api/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(snap),
  });
  return res.ok;
}

/**
 * Keeps a signed-in person's progress in their account. On the first load for
 * an account it pulls the saved snapshot (or pushes this phone's progress when
 * the account is new, which is how a masked player's history follows them into
 * Google sign-in). After that, changes are saved a moment after they happen.
 */
export function useCloudSave(state: AppState | null, setState: Dispatch<SetStateAction<AppState | null>>, account: AccountProfile | null, ready: boolean) {
  const [status, setStatus] = useState<SaveStatus>("off");
  const loadedFor = useRef<string | null>(null);
  const lastSent = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const userId = account?.userId ?? null;
  const joined = state?.joined ?? false;
  const dayKey = state?.daily.key;

  useEffect(() => {
    if (!ready || !userId || !joined || !dayKey || loadedFor.current === userId) return;
    loadedFor.current = userId;
    let active = true;
    setStatus("loading");
    fetchSnapshot(dayKey).then(async (snap) => {
      if (!active) return;
      if (snap === undefined) {
        setStatus("error");
        return;
      }
      if (snap) {
        setState((s) => (s ? applySnapshot(s, snap) : s));
        setStatus("saved");
        return;
      }
      setState((s) => {
        const local = s ? toSnapshot(s) : null;
        if (local) {
          lastSent.current = JSON.stringify(local);
          putSnapshot(local).then((ok) => active && setStatus(ok ? "saved" : "error"));
        }
        return s;
      });
    });
    return () => {
      active = false;
    };
  }, [ready, userId, joined, dayKey, setState]);

  useEffect(() => {
    if (!userId || loadedFor.current !== userId || !state || status === "loading" || status === "off") return;
    const snap = toSnapshot(state);
    if (!snap) return;
    const json = JSON.stringify(snap);
    if (json === lastSent.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      lastSent.current = json;
      setStatus("saving");
      setStatus((await putSnapshot(snap)) ? "saved" : "error");
    }, 1_500);
    return () => clearTimeout(timer.current);
  }, [state, userId, status]);

  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      lastSent.current = "";
      setStatus("off");
    }
  }, [userId]);

  return status;
}
