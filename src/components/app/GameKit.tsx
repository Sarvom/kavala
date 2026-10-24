"use client";

import { useEffect, useRef, useState } from "react";

/** mm:ss for a duration in milliseconds. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Milliseconds since the game started (or since it opened, when no start time
 * is given), frozen once `running` turns false.
 */
export function useElapsed(running: boolean, startedAt?: number): number {
  const opened = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);
  return Math.max(0, now - (startedAt ?? opened.current));
}

/** The frame every game shares: close button, title and a running clock. */
export function GameFrame({
  title,
  accent,
  elapsed,
  onClose,
  children,
}: {
  title: string;
  accent: string;
  elapsed: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="game" style={{ "--accent": accent } as React.CSSProperties}>
      <header className="game-bar">
        <button className="game-close" onClick={onClose} aria-label="Back to games">
          ✕
        </button>
        <span className="game-title">{title}</span>
        <span className="game-clock" aria-label="Time">
          {formatTime(elapsed)}
        </span>
      </header>
      {children}
    </section>
  );
}

/** A short vibration on phones that support it; silently does nothing elsewhere. */
export function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is optional.
  }
}

/** A comic starburst with a word in it, for wins. */
export function Burst({ word, color = "#ffb833" }: { word: string; color?: string }) {
  const points: string[] = [];
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 96 : 70;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(`${(120 + r * Math.cos(a)).toFixed(1)},${(105 + r * Math.sin(a) * 0.82).toFixed(1)}`);
  }
  return (
    <svg className="burst" viewBox="0 0 240 210" role="img" aria-label={word}>
      <polygon points={points.join(" ")} fill="#050812" transform="translate(6 6)" />
      <polygon points={points.join(" ")} fill={color} stroke="#050812" strokeWidth="4" strokeLinejoin="round" />
      {/* textLength keeps the word inside the burst whatever font the phone ends up using. */}
      <text x="120" y="118" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="38" fill="#0b1020" letterSpacing="1"
        textLength={Math.min(136, word.length * 17)} lengthAdjust="spacingAndGlyphs">
        {word}
      </text>
    </svg>
  );
}

/** Small game icons for the hub tiles. */
export function GameIcon({ kind }: { kind: "spot" | "help" | "quest" | "lingo" | "quiz" | "poll" }) {
  if (kind === "lingo") {
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <rect x="5" y="8" width="38" height="28" rx="6" fill="#0b1020" />
        <path d="M14 42l4-6h8z" fill="#0b1020" />
        <text x="24" y="29" textAnchor="middle" fontFamily="'Noto Sans Malayalam', sans-serif" fontWeight="700" fontSize="16" fill="#ffffff">അ</text>
      </svg>
    );
  }
  if (kind === "quiz") {
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <circle cx="24" cy="24" r="19" fill="#0b1020" />
        <path d="M18 19a6 6 0 1 1 9 5c-2 1-3 2-3 5" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="24" cy="35" r="2.2" fill="#ffffff" />
      </svg>
    );
  }
  if (kind === "poll") {
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <rect x="7" y="24" width="9" height="16" rx="2" fill="#0b1020" />
        <rect x="20" y="10" width="9" height="30" rx="2" fill="#0b1020" />
        <rect x="33" y="18" width="9" height="22" rx="2" fill="#0b1020" />
      </svg>
    );
  }
  if (kind === "spot") {
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <polygon points="24,3 43,14 43,34 24,45 5,34 5,14" fill="none" stroke="#0b1020" strokeWidth="3" />
        <path d="M24 12c-5 0-9 4-9 9 0 7 9 15 9 15s9-8 9-15c0-5-4-9-9-9z" fill="#0b1020" />
        <circle cx="24" cy="21" r="3.5" fill="#ffffff" />
      </svg>
    );
  }
  if (kind === "help") {
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <path d="M6 10h26v18H16l-8 7v-7H6z" fill="#0b1020" />
        <path d="M24 22c3-4 10-3 10 2 0 4-5 7-10 11-5-4-10-7-10-11 0-5 7-6 10-2z" transform="translate(8 2)" fill="#ffffff" stroke="#0b1020" strokeWidth="2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
      <path d="M12 42V8" stroke="#0b1020" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M12 9h22l-5 7 5 7H12z" fill="#0b1020" />
      <circle cx="30" cy="38" r="3" fill="#0b1020" />
      <circle cx="22" cy="31" r="2.4" fill="#0b1020" />
    </svg>
  );
}
