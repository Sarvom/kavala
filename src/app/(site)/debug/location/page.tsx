"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useLocation } from "@/lib/geo/useLocation";
import { cellPolygon } from "@/lib/geo/cells";
import { edgeMetres } from "@/lib/geo/resolution";
import type { MapShape } from "@/components/HexMap";

const HexMap = dynamic(() => import("@/components/HexMap"), { ssr: false });

const KOCHI: [number, number] = [9.9816, 76.2999];

function deviceId(): string {
  try {
    const saved = localStorage.getItem("kavala-device-id");
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem("kavala-device-id", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function LocationDebug() {
  const loc = useLocation();
  const [sent, setSent] = useState<{ request: unknown; status: number; response: unknown } | null>(null);
  const [busy, setBusy] = useState(false);

  const shapes = useMemo<MapShape[]>(() => {
    if (!loc.cells) return [];
    const out: MapShape[] = [
      { points: cellPolygon(loc.cells.cellR9), className: "hex-home", tooltip: "Resolution-9 area (about 0.1 sq km)" },
    ];
    if (loc.cells.resolution !== 9) {
      out.push({ points: cellPolygon(loc.cells.cellFine), className: "hex-fine", tooltip: `Resolution ${loc.cells.resolution}` });
    }
    return out;
  }, [loc.cells]);

  async function send(withCoordinates: boolean) {
    if (!loc.cells || loc.rawAccuracy === null) return;
    setBusy(true);
    const request: Record<string, unknown> = {
      deviceId: deviceId(),
      cellFine: loc.cells.cellFine,
      resolution: loc.cells.resolution,
      cellR9: loc.cells.cellR9,
      accuracyM: Math.round(loc.rawAccuracy),
      at: Date.now(),
    };
    if (withCoordinates && loc.position) {
      request.lat = loc.position.lat;
      request.lng = loc.position.lng;
    }
    try {
      const res = await fetch("/api/beacon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      setSent({ request, status: res.status, response: await res.json() });
    } catch {
      setSent({ request, status: 0, response: { error: "Could not reach the server." } });
    } finally {
      setBusy(false);
    }
  }

  const watching = loc.status === "watching" || loc.status === "asking";

  return (
    <>
      <section style={{ display: "grid", gap: 8 }}>
        <p className="eyebrow">Location engine</p>
        <h1>Precise on the phone, private on the server</h1>
        <p className="lede">
          Your exact position is drawn only on this screen. The server receives hexagon IDs, sized to how accurate your
          GPS is right now.
        </p>
      </section>

      <section className="card">
        <div className="row">
          {!watching ? (
            <button className="btn" onClick={loc.start}>Start reading my location</button>
          ) : (
            <button className="btn ghost" onClick={loc.stop}>Stop</button>
          )}
          <span className="muted">{loc.message ?? (loc.status === "watching" ? "Watching your location live." : "")}</span>
        </div>
        <div className="grid">
          <div className="stat"><b>{loc.rawAccuracy !== null ? `${Math.round(loc.rawAccuracy)} m` : "–"}</b><span>GPS accuracy</span></div>
          <div className="stat">
            <b>{loc.cells ? `Res ${loc.cells.resolution}` : "–"}</b>
            <span>{loc.cells ? `Hexagon edge about ${Math.round(edgeMetres(loc.cells.resolution))} m` : "Hexagon level"}</span>
          </div>
          <div className="stat"><b>{loc.accepted}</b><span>Fixes accepted</span></div>
          <div className="stat"><b>{loc.rejected}</b><span>Fixes rejected</span></div>
        </div>
        {loc.lastRejection && <p className="muted">Last rejected fix: {loc.lastRejection}</p>}
      </section>

      <HexMap
        center={loc.position ? [loc.position.lat, loc.position.lng] : KOCHI}
        zoom={loc.position ? 17 : 12}
        shapes={shapes}
        dot={loc.position ? [loc.position.lat, loc.position.lng] : null}
        fit={shapes.length > 0}
      />
      <p className="muted">
        <span className="swatch" style={{ background: "var(--leaf)" }} />Your fine hexagon
        <span className="swatch" style={{ background: "var(--turmeric)", marginLeft: 14 }} />Your resolution-9 area
        <span className="swatch" style={{ background: "var(--bad)", marginLeft: 14 }} />Your position (this screen only)
      </p>

      <section className="card">
        <h2>What the server receives</h2>
        {loc.cells ? (
          <>
            <div className="mono">cellFine: {loc.cells.cellFine}</div>
            <div className="mono">cellR9: {loc.cells.cellR9}</div>
            <div className="row">
              <button className="btn" disabled={busy} onClick={() => send(false)}>Send beacon</button>
              <button className="btn ghost" disabled={busy} onClick={() => send(true)}>Try sending coordinates too</button>
            </div>
          </>
        ) : (
          <p className="muted">Start reading your location to see the cell IDs.</p>
        )}
        {sent && (
          <>
            <p className="muted">Request sent:</p>
            <pre className="mono">{JSON.stringify(sent.request, null, 2)}</pre>
            <p className="muted">
              Server answered <span className={`pill ${sent.status >= 200 && sent.status < 300 ? "ok" : "no"}`}>{sent.status || "no reply"}</span>
            </p>
            <pre className="mono">{JSON.stringify(sent.response, null, 2)}</pre>
          </>
        )}
      </section>
    </>
  );
}
