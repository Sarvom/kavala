"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cellToLatLng, gridDisk } from "h3-js";
import { cellPolygon } from "@/lib/geo/cells";
import { leaderboard, SAMPLE_MEMBERS, SAMPLE_PLAYED_TODAY, type AppState } from "@/lib/app/state";
import type { MapShape } from "@/components/HexMap";
import { NeighbourMask } from "./Mask";

const HexMap = dynamic(() => import("@/components/HexMap"), { ssr: false });

const AREA: Record<number, string> = { 6: "about 36 sq km", 7: "about 5 sq km", 8: "about 0.7 sq km", 9: "about 0.1 sq km" };

export default function HoodView({ state }: { state: AppState }) {
  const hood = state.hood;

  const shapes = useMemo<MapShape[]>(() => {
    if (!hood) return [];
    const main = hood.cells[0];
    const around = gridDisk(main, 1).filter((c) => !hood.cells.includes(c));
    return [
      ...around.map((c) => ({ points: cellPolygon(c), className: "hex-ring", tooltip: "Neighbouring area" })),
      ...hood.cells.map((c) => ({ points: cellPolygon(c), className: "hex-fine", tooltip: "Your neighbourhood" })),
    ];
  }, [hood]);

  if (!hood) return null;
  const center = cellToLatLng(hood.cells[0]) as [number, number];
  const board = leaderboard(state);

  return (
    <>
      <div>
        <p className="eyebrow">Neighbourhood</p>
        <h1 className="flow-title">Your kavala</h1>
        <p className="muted">
          H3 resolution {hood.resolution}, {AREA[hood.resolution] ?? "a small area"}. It shrinks where homes are dense and grows where they
          are spread out, so it stays between 30 and 150 people.
        </p>
      </div>
      <HexMap center={center} zoom={13} shapes={shapes} fit height={360} />
      <p className="muted">Only the outline is shown, never anyone&apos;s home. Maps &copy; OpenStreetMap contributors.</p>
      <div className="stats">
        <div className="stat"><b>{SAMPLE_MEMBERS}</b><span>Neighbours*</span></div>
        <div className="stat"><b>{SAMPLE_PLAYED_TODAY + (state.daily.done ? 1 : 0)}</b><span>Played today*</span></div>
        <div className="stat"><b>{state.thanks}</b><span>Your Thanks</span></div>
      </div>
      <section className="card">
        <h2>Today&apos;s leaderboard <span className="tag">sample</span></h2>
        <ol className="board">
          {board.map((r, i) => (
            <li key={r.name} className={r.me ? "me" : ""}>
              <span className="rank">{i + 1}</span>
              <NeighbourMask name={r.name} me={state} size={26} />
              <span>{r.me ? `${r.name} (you)` : r.name}</span>
              <span className="pts">{r.points}</span>
            </li>
          ))}
        </ol>
        {!state.daily.spot && <p className="muted">Play today&apos;s Spot to join the leaderboard.</p>}
      </section>
      <p className="muted">* Sample numbers until accounts and the database arrive.</p>
    </>
  );
}
