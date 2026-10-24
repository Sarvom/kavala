"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { latLngToCell } from "h3-js";
import { useLocation } from "@/lib/geo/useLocation";
import { cellPolygon } from "@/lib/geo/cells";
import { assignNeighbourhood } from "@/lib/hood/assign";
import { KOCHI_CENTRE } from "@/lib/hood/synthetic";
import { MASK_COLORS, MASK_STYLES, maskStyleOf, randomMaskName, type AppState } from "@/lib/app/state";
import { googleIconPaths, type GoogleAccount } from "@/lib/app/useGoogleAccount";
import type { MapShape } from "@/components/HexMap";
import { Mask } from "./Mask";

const HexMap = dynamic(() => import("@/components/HexMap"), { ssr: false });

type Step = "choose" | "mask" | "place";

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  notify: (message: string) => void;
  google: GoogleAccount;
}

const USES_COLOR = new Set(["classic", "web", "owl"]);

export default function Onboarding({ state, update, notify, google }: Props) {
  const signedIn = state.account?.provider === "google";
  const [step, setStep] = useState<Step>(signedIn ? "mask" : "choose");
  const loc = useLocation();
  const [home, setHome] = useState<{ cell: string; fromGps: boolean } | null>(null);
  const style = maskStyleOf(state);
  const styleIndex = MASK_STYLES.findIndex((m) => m.id === style);

  useEffect(() => {
    if (signedIn && step === "choose") setStep("mask");
  }, [signedIn, step]);

  useEffect(() => {
    if (step === "place" && loc.cells && !home) {
      setHome({ cell: loc.cells.cellR9, fromGps: true });
      loc.stop();
    }
  }, [step, loc, home]);

  const hood = useMemo(() => (home ? assignNeighbourhood(home.cell, []).hood : null), [home]);
  const shapes = useMemo<MapShape[]>(() => {
    if (!hood || !home) return [];
    return [
      { points: cellPolygon(hood.cells[0]), className: "hex-fine", tooltip: "Your neighbourhood" },
      { points: cellPolygon(home.cell), className: "hex-home", tooltip: "Your home area (about 0.1 sq km)" },
    ];
  }, [hood, home]);

  function cycle(delta: number) {
    const next = MASK_STYLES[(styleIndex + delta + MASK_STYLES.length) % MASK_STYLES.length];
    update((s) => ({ ...s, maskStyle: next.id }));
  }

  function enter() {
    if (!home || !hood) return;
    update((s) => ({
      ...s,
      joined: true,
      homeCell: home.cell,
      homeFromGps: home.fromGps,
      hood: { id: hood.id, cells: hood.cells, resolution: hood.resolution },
    }));
    notify(`${state.maskName} has entered the kavala.`);
  }

  const dots = (["choose", "mask", "place"] as Step[]).map((s) => (
    <i key={s} className={s === step ? "on" : ""} />
  ));

  if (step === "choose") {
    return (
      <section className="onboard">
        <div className="onboard-dots">{dots}</div>
        <h1 className="onboard-title">Who are you tonight?</h1>
        <button className="path-card profile" onClick={google.available ? google.signIn : undefined} disabled={!google.available || google.busy}>
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
            {googleIconPaths().map((p) => (
              <path key={p.fill} d={p.d} fill={p.fill} />
            ))}
          </svg>
          <span className="path-name">Create a profile</span>
          <span className="path-sub">{google.available ? "Sign in with Google. Neighbours still see your mask." : "Google sign-in isn't switched on for this demo yet."}</span>
        </button>
        <button className="path-card mask" onClick={() => setStep("mask")}>
          <Mask color={state.maskColor} style={style} size={44} />
          <span className="path-name">Go under a mask</span>
          <span className="path-sub">{google.local ? "Pick a mask and a hero name. No sign-up; progress stays on this phone." : "Pick a mask and a hero name. No sign-up; progress is saved without your name."}</span>
        </button>
        {google.error && <p className="muted">{google.error}</p>}
      </section>
    );
  }

  if (step === "mask") {
    return (
      <section className="onboard">
        <div className="onboard-dots">{dots}</div>
        <h1 className="onboard-title">Choose your mask</h1>
        <div className="mask-stage">
          <button className="arrow" aria-label="Previous mask" onClick={() => cycle(-1)}>‹</button>
          <div className="mask-hero">
            <Mask color={state.maskColor} style={style} size={150} />
            <span className="mask-label">{MASK_STYLES[styleIndex]?.label}</span>
          </div>
          <button className="arrow" aria-label="Next mask" onClick={() => cycle(1)}>›</button>
        </div>
        {USES_COLOR.has(style) && (
          <div className="swatches" role="group" aria-label="Mask colour">
            {MASK_COLORS.map((c, i) => (
              <button
                key={c}
                className="swatch-btn"
                style={{ background: c }}
                aria-label={`Colour ${i + 1}`}
                aria-pressed={c === state.maskColor}
                onClick={() => update((s) => ({ ...s, maskColor: c }))}
              />
            ))}
          </div>
        )}
        <div className="hero-name">
          <span className="hero-name-text">{state.maskName}</span>
          <button className="dice" onClick={() => update((s) => ({ ...s, maskName: randomMaskName(Math.random, s.maskName) }))}>
            Roll a name
          </button>
        </div>
        {signedIn && <p className="muted center">Signed in as {state.account?.name}. Only people you choose will see that name.</p>}
        <button className="btn-hero" onClick={() => setStep("place")}>This is me</button>
        {!signedIn && (
          <button className="linkish center" onClick={() => setStep("choose")}>Back</button>
        )}
      </section>
    );
  }

  const asking = loc.status === "asking" || loc.status === "watching";
  return (
    <section className="onboard">
      <div className="onboard-dots">{dots}</div>
      <h1 className="onboard-title">Drop into your neighbourhood</h1>
      {home && hood ? (
        <>
          <HexMap center={[KOCHI_CENTRE.lat, KOCHI_CENTRE.lng]} zoom={13} shapes={shapes} fit height={260} />
          <p className="muted center">
            {home.fromGps ? "Found from your phone." : "Demo location in Kochi."} Kavala keeps only your hexagon, never your exact position.
          </p>
          <button className="btn-hero" onClick={enter}>Enter Kavala</button>
        </>
      ) : (
        <>
          <div className="drop-pin" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="96" height="96">
              <polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="none" stroke="#3ddc97" strokeWidth="2.5" />
              <path d="M32 16c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#ffb833" />
              <circle cx="32" cy="28" r="4.5" fill="#0b1020" />
            </svg>
          </div>
          <button className="btn-hero" onClick={loc.start} disabled={asking}>
            {asking ? "Finding you…" : "Use my location"}
          </button>
          <button className="btn ghost" onClick={() => { loc.stop(); setHome({ cell: latLngToCell(KOCHI_CENTRE.lat, KOCHI_CENTRE.lng, 9), fromGps: false }); }}>
            Try a demo spot in Kochi
          </button>
          {loc.message && <p className="muted center">{loc.message}</p>}
          {loc.lastRejection && <p className="muted center">{loc.lastRejection}</p>}
        </>
      )}
    </section>
  );
}
