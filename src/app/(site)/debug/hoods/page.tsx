"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { rebalance } from "@/lib/hood/rebalance";
import { KOCHI_CENTRE, syntheticResidents } from "@/lib/hood/synthetic";
import { cellPolygon } from "@/lib/geo/cells";
import type { MapShape } from "@/components/HexMap";

const HexMap = dynamic(() => import("@/components/HexMap"), { ssr: false });

const SIZES = [200, 600, 1500, 3000];
const AREA_LABEL: Record<number, string> = { 6: "about 36 sq km", 7: "about 5 sq km", 8: "about 0.7 sq km", 9: "about 0.1 sq km" };

export default function HoodsDebug() {
  const [count, setCount] = useState(600);
  const [seed, setSeed] = useState(42);

  const { hoods, shapes, byRes } = useMemo(() => {
    const residents = syntheticResidents(count, seed);
    const hoods = rebalance(residents);
    const shapes: MapShape[] = hoods.flatMap((h) =>
      h.cells.map((c) => ({
        points: cellPolygon(c),
        className: `hex-r${h.resolution}`,
        tooltip: `${h.members.length} people · resolution ${h.resolution}${h.cells.length > 1 ? ` · ${h.cells.length} cells pooled` : ""}`,
      })),
    );
    const byRes = new Map<number, { hoods: number; people: number }>();
    for (const h of hoods) {
      const r = byRes.get(h.resolution) ?? { hoods: 0, people: 0 };
      r.hoods += 1;
      r.people += h.members.length;
      byRes.set(h.resolution, r);
    }
    return { hoods, shapes, byRes: [...byRes.entries()].sort((a, b) => a[0] - b[0]) };
  }, [count, seed]);

  return (
    <>
      <section style={{ display: "grid", gap: 8 }}>
        <p className="eyebrow">Neighbourhoods · synthetic data</p>
        <h1>Sized by people, not kilometres</h1>
        <p className="lede">
          These are fake residents around Kochi, generated for testing. Each neighbourhood holds roughly 30 to 150 people:
          crowded areas split into small hexagons and quiet areas stay in large ones.
        </p>
      </section>

      <section className="card">
        <div className="row">
          <span className="muted">Residents:</span>
          {SIZES.map((n) => (
            <button key={n} className={`btn ${n === count ? "" : "ghost"}`} onClick={() => setCount(n)} aria-pressed={n === count}>
              {n.toLocaleString("en-IN")}
            </button>
          ))}
          <button className="btn ghost" onClick={() => setSeed((s) => s + 1)}>Shuffle</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Resolution</th><th>Hexagon area</th><th>Neighbourhoods</th><th>People</th><th>Average size</th></tr>
            </thead>
            <tbody>
              {byRes.map(([res, r]) => (
                <tr key={res}>
                  <td><span className="swatch" style={{ background: `var(--r${res})` }} />{res}</td>
                  <td>{AREA_LABEL[res]}</td>
                  <td>{r.hoods}</td>
                  <td>{r.people}</td>
                  <td>{Math.round(r.people / r.hoods)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">{hoods.length} neighbourhoods for {count.toLocaleString("en-IN")} residents. Hover a hexagon for its size.</p>
      </section>

      <HexMap center={[KOCHI_CENTRE.lat, KOCHI_CENTRE.lng]} zoom={11} shapes={shapes} fit height={460} />
    </>
  );
}
