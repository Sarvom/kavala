"use client";

import { useEffect, useState } from "react";
import { browserSupabase } from "../supabase/browser";
import type { LiveHood, LiveRow } from "./live";
import type { MaskStyle } from "./state";

interface StatsRow {
  neighbourhood_id: string;
  members: number;
  played_today: number;
}

interface BoardRowDb {
  mask_name: string;
  mask_color: string;
  mask_style: string;
  points: number | null;
  done: boolean;
  is_me: boolean;
}

export const LIVE_REFRESH_MS = 60_000;

/**
 * Reads the signed-in person's real neighbourhood: member count, how many
 * played today and today's board, through the masks-only database functions.
 * Null while there is no account, no neighbourhood yet, or the database is
 * not connected. Refreshes every minute and whenever `refreshKey` changes
 * (the app passes its save status, so a fresh result shows up right after it
 * is saved).
 */
export function useLiveHood(userId: string | null, dayKey: string | undefined, refreshKey: string): LiveHood | null {
  const [live, setLive] = useState<LiveHood | null>(null);

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase || !userId || !dayKey) {
      setLive(null);
      return;
    }
    let active = true;
    const load = async () => {
      const [stats, board] = await Promise.all([
        supabase.rpc("my_neighbourhood_stats", { p_day: dayKey }),
        supabase.rpc("my_neighbourhood_board", { p_day: dayKey }),
      ]);
      if (!active) return;
      const s = (stats.data as StatsRow[] | null)?.[0];
      if (stats.error || board.error || !s) {
        setLive(null);
        return;
      }
      const rows: LiveRow[] = ((board.data as BoardRowDb[] | null) ?? [])
        .filter((r) => r.points !== null)
        .map((r) => ({ maskName: r.mask_name, maskColor: r.mask_color, maskStyle: r.mask_style as MaskStyle, points: r.points ?? 0, done: r.done, me: r.is_me }));
      setLive({ hoodId: s.neighbourhood_id, members: s.members, playedToday: s.played_today, board: rows });
    };
    load();
    const timer = setInterval(load, LIVE_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [userId, dayKey, refreshKey]);

  return live;
}
