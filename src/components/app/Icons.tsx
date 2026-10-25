"use client";

import { useId } from "react";

/**
 * Kavala's icon set. Game glyphs are white shapes that sit on the coloured 3D
 * nodes and tiles; reward icons (coin, flame, trophy) and tab icons carry
 * their own gradients, a top highlight and a bottom shade. All original.
 */

export type GameKind = "weave" | "pookkalam" | "help" | "quest" | "pakal" | "lingo" | "quiz" | "poll";

/** White glyph for a game, drawn on a 48 × 48 grid. */
export function GameGlyph({ kind }: { kind: GameKind }) {
  const common = { viewBox: "0 0 48 48", "aria-hidden": true as const, fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "weave":
      // A corner of web with a thread drawn across it.
      return (
        <svg {...common} strokeWidth="2.6">
          <path d="M6 6l36 36M6 6v36M6 6h36M6 6l30 14M6 6l14 30" strokeOpacity="0.55" />
          <path d="M6 18q7-1 12-12M6 30q14-4 24-24M6 42q22-8 36-36" strokeOpacity="0.55" />
          <path d="M12 38c6-6 6-14 14-16s12-8 12-16" strokeWidth="4.4" />
          <circle cx="12" cy="38" r="4" fill="currentColor" stroke="none" />
          <circle cx="38" cy="6.5" r="4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pookkalam":
      return (
        <svg {...common} strokeWidth="0">
          <g fill="currentColor">
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse key={i} cx="24" cy="12" rx="5.2" ry="9" transform={`rotate(${i * 45} 24 24)`} opacity={i % 2 ? 0.7 : 1} />
            ))}
          </g>
          <circle cx="24" cy="24" r="6.5" fill="currentColor" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" />
        </svg>
      );
    case "pakal":
      return (
        <svg {...common} strokeWidth="3">
          <circle cx="17" cy="20" r="7" fill="currentColor" stroke="none" />
          <path d="M17 6v3M17 31v3M3 20h3M28 20h3M7 10l2 2M25 28l2 2M7 30l2-2M25 12l2-2" />
          <path d="M40 26a10 10 0 1 1-12 12 8 8 0 0 0 12-12z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "help":
      return (
        <svg {...common} strokeWidth="0">
          <path d="M5 9h28a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H17l-8 7v-7H5a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3z" fill="currentColor" opacity="0.65" />
          <path d="M33 21c3.2-4.2 11-3.2 11 2.2 0 4.4-5.6 7.6-11 12-5.4-4.4-11-7.6-11-12 0-5.4 7.8-6.4 11-2.2z" fill="currentColor" />
        </svg>
      );
    case "quest":
      return (
        <svg {...common} strokeWidth="3.6">
          <path d="M12 43V7" />
          <path d="M13 8h22l-5 7 5 7H13z" fill="currentColor" stroke="none" />
          <path d="M22 41c4-1 7-4 10-3s5 3 9 2" strokeOpacity="0.6" />
        </svg>
      );
    case "lingo":
      return (
        <svg {...common} strokeWidth="0">
          <rect x="4" y="7" width="40" height="30" rx="8" fill="currentColor" opacity="0.35" />
          <path d="M14 42l5-6h9z" fill="currentColor" opacity="0.35" />
          <text x="24" y="30" textAnchor="middle" fontFamily="'Noto Sans Malayalam', sans-serif" fontWeight="700" fontSize="19" fill="currentColor">അ</text>
        </svg>
      );
    case "quiz":
      return (
        <svg {...common} strokeWidth="4.4">
          <path d="M16 17a8 8 0 1 1 12 7c-2.6 1.4-4 2.8-4 6.5" />
          <circle cx="24" cy="39" r="2.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "poll":
      return (
        <svg {...common} strokeWidth="0">
          <rect x="6" y="24" width="9" height="18" rx="3" fill="currentColor" opacity="0.7" />
          <rect x="19.5" y="8" width="9" height="34" rx="3" fill="currentColor" />
          <rect x="33" y="17" width="9" height="25" rx="3" fill="currentColor" opacity="0.85" />
        </svg>
      );
  }
}

/** Colours for each game's node or tile. */
export const GAME_COLORS: Record<GameKind, { face: string; deep: string }> = {
  weave: { face: "var(--weave)", deep: "var(--weave-deep)" },
  pookkalam: { face: "var(--pookkalam)", deep: "var(--pookkalam-deep)" },
  help: { face: "var(--turn)", deep: "var(--turn-deep)" },
  quest: { face: "var(--quest)", deep: "var(--quest-deep)" },
  pakal: { face: "var(--pakal)", deep: "var(--pakal-deep)" },
  lingo: { face: "#7c4dda", deep: "#5531a8" },
  quiz: { face: "#e0477e", deep: "#a72a59" },
  poll: { face: "#139e9b", deep: "#0b7270" },
};

export function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BackGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/** Gold Thanks coin with a top highlight and a darker rim. */
export function Coin({ size = 24 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe17a" />
          <stop offset="1" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="17.5" r="13" fill="#9c7f1f" />
      <circle cx="16" cy="15.5" r="13" fill={`url(#${id}g)`} />
      <circle cx="16" cy="15.5" r="9" fill="none" stroke="#b8901c" strokeWidth="1.6" />
      <path d="M11.5 15.8c1.8-2.6 5.2-2.2 4.5.6.7-2.8 4.6-3 4.5-.2-.1 2.2-2.6 3.7-4.5 5.4-2-1.7-4.6-3.2-4.5-5.8z" fill="#9c7f1f" />
      <ellipse cx="12" cy="8.5" rx="5" ry="2" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

/** Streak flame; it grows a little with the streak. */
export function Flame({ size = 24, lit = true }: { size?: number; lit?: boolean }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit ? "#ffb347" : "#d6dbe5"} />
          <stop offset="1" stopColor={lit ? "#ff5a1f" : "#aeb7c7"} />
        </linearGradient>
      </defs>
      <path d="M16 2c1.6 5.4 9 8.2 9 16.4A9 9 0 0 1 7 18.4c0-4 2.6-6.6 4-8 0 2.8 1.4 4.2 2.8 4.2C13.8 9.4 12.4 6.6 16 2z" fill={`url(#${id}f)`} />
      <path d="M16 15c.8 2.6 4.4 3.8 4.4 7.6a4.4 4.4 0 0 1-8.8 0c0-2 1.2-3.2 2-4 .2 1.4.8 2 1.4 2C15 18 14.6 16.8 16 15z" fill={lit ? "#ffe9a8" : "#eef1f6"} />
    </svg>
  );
}

export function Trophy() {
  const id = useId();
  return (
    <svg className="trophy" viewBox="0 0 84 84" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe17a" />
          <stop offset="1" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      <path d="M22 14h40v14a20 20 0 0 1-40 0z" fill="#9c7f1f" transform="translate(0 4)" />
      <path d="M22 14h40v14a20 20 0 0 1-40 0z" fill={`url(#${id}t)`} />
      <path d="M22 20H12a10 10 0 0 0 12 12M62 20h10a10 10 0 0 1-12 12" fill="none" stroke="#d4a017" strokeWidth="5" strokeLinecap="round" />
      <rect x="36" y="46" width="12" height="12" fill="#b8901c" />
      <rect x="26" y="58" width="32" height="10" rx="4" fill="#0b1a33" />
      <rect x="22" y="66" width="40" height="8" rx="4" fill="#0b1a33" opacity="0.85" />
      <path d="M33 22l4 4 9-9" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <ellipse cx="32" cy="18" rx="6" ry="2.4" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

/** Tab icons in colour, with depth. */
export function TabIcon({ tab }: { tab: "play" | "map" | "ask" | "me" }) {
  const id = useId();
  const grad = (a: string, b: string) => (
    <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
  const fill = `url(#${id}g)`;
  if (tab === "play") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <defs>{grad("#ff6b6b", "#c62828")}</defs>
        <path d="M5 14L16 4l11 10v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#8e1b1b" transform="translate(0 1.5)" />
        <path d="M5 14L16 4l11 10v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill={fill} />
        <rect x="12.5" y="19" width="7" height="10" rx="1.5" fill="#ffd76a" />
        <path d="M9 12l7-6" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (tab === "map") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <defs>{grad("#4d9bff", "#0a47a0")}</defs>
        <polygon points="16,3 28,10 28,23 16,30 4,23 4,10" fill="#07326f" transform="translate(0 1.5)" />
        <polygon points="16,3 28,10 28,23 16,30 4,23 4,10" fill={fill} />
        <path d="M16 9c-3.3 0-6 2.6-6 5.8 0 4.4 6 9.2 6 9.2s6-4.8 6-9.2C22 11.6 19.3 9 16 9z" fill="#ffffff" />
        <circle cx="16" cy="14.8" r="2.3" fill="#e23636" />
      </svg>
    );
  }
  if (tab === "ask") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <defs>{grad("#ffd76a", "#c9971c")}</defs>
        <path d="M4 7a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H13l-6 6v-6a3 3 0 0 1-3-3z" fill="#8a6a12" transform="translate(0 1.5)" />
        <path d="M4 7a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H13l-6 6v-6a3 3 0 0 1-3-3z" fill={fill} />
        <path d="M13 10.5a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.1-1.5 2.4" fill="none" stroke="#0b1a33" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="18.6" r="1.4" fill="#0b1a33" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <defs>{grad("#3fd18b", "#1e8550")}</defs>
      <circle cx="16" cy="17.5" r="13" fill="#145c37" />
      <circle cx="16" cy="16" r="13" fill={fill} />
      <path d="M6 15c3.5-5 16.5-5 20 0-.7 4.4-3.6 6-6.8 5.3-1.6-.4-2.4-1.6-3.2-2.5-.8.9-1.6 2.1-3.2 2.5C9.6 21 6.7 19.4 6 15z" fill="#0b1a33" />
      <ellipse cx="11.6" cy="15.6" rx="2.3" ry="1.5" fill="#ffffff" />
      <ellipse cx="20.4" cy="15.6" rx="2.3" ry="1.5" fill="#ffffff" />
    </svg>
  );
}

/** A flower for the Pookkalam board. */
export function Flower() {
  return (
    <svg className="flower" viewBox="0 0 40 40" aria-hidden="true">
      <g transform="translate(0 1.5)" fill="#7a1418">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="20" cy="10" rx="4.4" ry="8" transform={`rotate(${i * 45} 20 20)`} />
        ))}
      </g>
      <g fill="#e23636">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="20" cy="10" rx="4.4" ry="8" transform={`rotate(${i * 45} 20 20)`} />
        ))}
      </g>
      <circle cx="20" cy="20" r="5.6" fill="#ffd23f" stroke="#b8901c" strokeWidth="1.6" />
      <ellipse cx="17" cy="9" rx="2" ry="3.4" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/** Sun piece for Pakal–Raavu. */
export function SunPiece() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <g stroke="#e58a00" strokeWidth="3.2" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M20 2.5v5" transform={`rotate(${i * 45} 20 20)`} />
        ))}
      </g>
      <circle cx="20" cy="21.5" r="10" fill="#c96f00" />
      <circle cx="20" cy="20" r="10" fill="#ffb627" />
      <ellipse cx="16.5" cy="15.5" rx="4" ry="2.2" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

/** Moon piece for Pakal–Raavu. */
export function MoonPiece() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M27 6.5a14 14 0 1 0 7.5 22A11 11 0 0 1 27 6.5z" fill="#06142b" transform="translate(0 1.5)" />
      <path d="M27 6.5a14 14 0 1 0 7.5 22A11 11 0 0 1 27 6.5z" fill="#1d4f9c" />
      <circle cx="15" cy="17" r="2" fill="#ffffff" opacity="0.35" />
      <circle cx="19" cy="26" r="1.4" fill="#ffffff" opacity="0.3" />
    </svg>
  );
}
