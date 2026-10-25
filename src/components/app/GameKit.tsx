"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckGlyph, CloseGlyph } from "./Icons";

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

/** The frame every game shares: close button, title (with its Malayalam name) and a clock. */
export function GameFrame({
  title,
  ml,
  accent,
  accentDeep,
  elapsed,
  onClose,
  children,
}: {
  title: string;
  ml?: string;
  accent: string;
  accentDeep: string;
  elapsed?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="game" style={{ "--accent": accent, "--accent-deep": accentDeep } as React.CSSProperties}>
      <header className="game-bar">
        <button className="game-close" onClick={onClose} aria-label="Back to today">
          <CloseGlyph />
        </button>
        <span className="game-title">
          {title}
          {ml && <span className="ml" lang="ml">{ml}</span>}
        </span>
        {elapsed !== undefined && (
          <span className="game-clock" aria-label="Time">
            {formatTime(elapsed)}
          </span>
        )}
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

/**
 * The end-of-game sheet that slides up from the bottom, like the end of a
 * lesson: green for a win, amber for a near miss, blue for a calm finish.
 */
export function ResultSheet({
  tone,
  title,
  sub,
  stats,
  action = "Continue",
  onAction,
  children,
}: {
  tone: "good" | "close" | "calm";
  title: string;
  sub?: string;
  stats?: { label: string; value: string }[];
  action?: string;
  onAction: () => void;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="sheet-space" aria-hidden="true" />
      <div className={`sheet ${tone}`} role="status" aria-live="polite">
        <div className="sheet-head">
          <span className="sheet-badge" aria-hidden="true">
            {tone === "good" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            ) : tone === "close" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 7v6M12 17h.01" /><circle cx="12" cy="12" r="9.5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></svg>
            )}
          </span>
          <div>
            <div className="sheet-title">{title}</div>
            {sub && <div className="sheet-sub">{sub}</div>}
          </div>
        </div>
        {children}
        {stats && stats.length > 0 && (
          <div className="result-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        <button className={`btn-hero ${tone === "good" ? "green" : tone === "close" ? "amber" : "blue"}`} onClick={onAction} autoFocus>
          {action}
        </button>
      </div>
    </>
  );
}

const CONFETTI_COLORS = ["#e23636", "#0d63d6", "#d4af37", "#2bb673", "#ffffff", "#f08c1e"];

/** A short burst of confetti for "Daily complete!". Pure CSS; hidden when motion is reduced. */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        l: `${(i * 37) % 100}%`,
        c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        r: `${(i * 53) % 360}deg`,
        d: `${(i % 9) * 0.05}s`,
      })),
    [],
  );
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{ "--l": p.l, "--c": p.c, "--r": p.r, "--d": p.d } as React.CSSProperties} />
      ))}
    </div>
  );
}

/** Small green tick badge for a finished node or tile. */
export function DoneMark() {
  return (
    <span className="node-check" aria-hidden="true">
      <CheckGlyph />
    </span>
  );
}
