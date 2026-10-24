"use client";

import { useEffect, useMemo, useState } from "react";
import { latLngToCell } from "h3-js";

const BASE = { lat: 9.9816, lng: 76.2999 };
const PLACES = {
  same: { label: "Standing together", north: 10 },
  near: { label: "500 m away", north: 500 },
  far: { label: "5 km away", north: 5000 },
} as const;
type PlaceKey = keyof typeof PLACES;

function cellAt(northMetres: number) {
  return latLngToCell(BASE.lat + northMetres / 111_320, BASE.lng, 11);
}

interface Outcome {
  ok: boolean;
  text: string;
}

export default function HandshakeDebug() {
  const aCell = useMemo(() => cellAt(0), []);
  const [code, setCode] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [place, setPlace] = useState<PlaceKey>("same");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = code ? Math.max(0, 30 - Math.floor((now - issuedAt) / 1000)) : 0;

  async function issue() {
    setOutcome(null);
    const res = await fetch("/api/handshake/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "phone-a", cellFine: aCell }),
    });
    const data = await res.json();
    if (!data.ok) {
      setNote(data.error);
      return;
    }
    setCode(data.code);
    setIssuedAt(Date.now());
    setNote(data.temporarySecret ? "Using a temporary signing secret because HANDSHAKE_SECRET is not set (fine for local testing)." : null);
  }

  async function verify(codeToSend: string) {
    const res = await fetch("/api/handshake/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeToSend, userId: "phone-b", cellFine: cellAt(PLACES[place].north) }),
    });
    const data = await res.json();
    setOutcome({ ok: !!data.ok, text: data.message ?? data.error ?? "No reply" });
  }

  function tampered(c: string) {
    const [body, sig] = c.split(".");
    const last = body.slice(-1) === "A" ? "B" : "A";
    return `${body.slice(0, -1)}${last}.${sig}`;
  }

  return (
    <>
      <section style={{ display: "grid", gap: 8 }}>
        <p className="eyebrow">In-person handshake</p>
        <h1>Trust that can&apos;t be faked from afar</h1>
        <p className="lede">
          Phone A shows a signed code. Phone B scans it and sends its own location cell. The server accepts it only if the
          signature is genuine, the code is under 30 seconds old and unused, and both phones are in the same place.
        </p>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Phone A</h2>
          <p className="muted">Shows a code that expires in 30 seconds.</p>
          <button className="btn" onClick={issue}>Show a fresh code</button>
          {code && (
            <>
              <div className="mono">{code}</div>
              <p className="muted">
                {secondsLeft > 0 ? `Valid for ${secondsLeft} more seconds` : "Expired: scanning it now should fail"}
              </p>
            </>
          )}
        </section>

        <section className="card">
          <h2>Phone B</h2>
          <p className="muted">Where is phone B?</p>
          <div className="row" role="group" aria-label="Phone B position">
            {(Object.keys(PLACES) as PlaceKey[]).map((k) => (
              <button key={k} className={`btn ${place === k ? "" : "ghost"}`} aria-pressed={place === k} onClick={() => setPlace(k)}>
                {PLACES[k].label}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn" disabled={!code} onClick={() => code && verify(code)}>Scan code</button>
            <button className="btn ghost" disabled={!code} onClick={() => code && verify(tampered(code))}>Scan a tampered copy</button>
          </div>
          {outcome && (
            <p>
              <span className={`pill ${outcome.ok ? "ok" : "no"}`}>{outcome.ok ? "Accepted" : "Rejected"}</span>{" "}
              {outcome.text}
            </p>
          )}
        </section>
      </div>

      {note && <p className="muted">{note}</p>}
      <p className="muted">
        Try it: scan once while standing together (accepted), scan the same code again (already used), wait 30 seconds
        (expired), pick 5 km away (not in the same place), or scan a tampered copy (signature not genuine). On real phones,
        phone B&apos;s cell comes from its own GPS; this page simulates the positions.
      </p>
    </>
  );
}
