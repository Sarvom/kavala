"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cellToLatLng, gridDisk } from "h3-js";
import { cellPolygon } from "@/lib/geo/cells";
import type { AppState } from "@/lib/app/state";
import { boardFor, countsFor, MIN_REAL_PLAYERS, type LiveHood } from "@/lib/app/live";
import type { MapShape } from "@/components/HexMap";
import { Mask, NeighbourMask } from "./Mask";

const HexMap = dynamic(() => import("@/components/HexMap"), { ssr: false });

const AREA: Record<number, string> = { 6: "about 36 sq km", 7: "about 5 sq km", 8: "about 0.7 sq km", 9: "about 0.1 sq km" };

export default function HoodView({ state, live }: { state: AppState; live: LiveHood | null }) {
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
  const board = boardFor(state, live);
  const counts = countsFor(state, live);

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
        <div className="stat"><b>{counts.members}</b><span>Neighbours{counts.sample ? "*" : ""}</span></div>
        <div className="stat"><b>{counts.played}</b><span>Played today{counts.sample ? "*" : ""}</span></div>
        <div className="stat"><b>{state.thanks}</b><span>Your Thanks</span></div>
      </div>
      <section className="card">
        <h2>Today&apos;s leaderboard {board.sample && <span className="tag">sample</span>}</h2>
        <ol className="board">
          {board.rows.map((r, i) => (
            <li key={r.name} className={r.me ? "me" : ""}>
              <span className="rank">{i + 1}</span>
              {r.color && r.style ? <Mask color={r.color} style={r.style} size={26} /> : <NeighbourMask name={r.name} me={state} size={26} />}
              <span>{r.me ? `${r.name} (you)` : r.name}</span>
              <span className="pts">{r.points}</span>
            </li>
          ))}
        </ol>
        {!state.daily.spot && <p className="muted">Play today&apos;s Spot to join the leaderboard.</p>}
      </section>
      {counts.sample ? (
        <p className="muted">
          * Sample numbers. Real counts and the real board appear once your neighbourhood has {MIN_REAL_PLAYERS} players
          {live ? ` (it has ${live.members} so far)` : ""}.
        </p>
      ) : (
        <p className="muted">Real neighbours, shown by mask only. Counts refresh about once a minute.</p>
      )}
    </>
  );
}
