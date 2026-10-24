"use client";

import { useState } from "react";
import { MASK_STYLES, maskStyleOf, randomMaskName, type AppState } from "@/lib/app/state";
import type { GoogleAccount } from "@/lib/app/useGoogleAccount";
import { Mask, NeighbourMask } from "./Mask";
import GoogleButton from "./GoogleButton";

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  notify: (message: string) => void;
  onReset: () => void;
  google: GoogleAccount;
}

const REGULARS = ["Carol Chacko", "Tony Thomas", "Wanda Warrier"];

export default function MeView({ state, update, notify, onReset, google }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const verified = state.level === "verified";

  function toggleReveal(name: string, on: boolean) {
    update((s) => ({ ...s, revealedTo: on ? [...s.revealedTo, name] : s.revealedTo.filter((n) => n !== name) }));
    notify(on ? `${name} can now see your real name.` : `${name} sees ${state.maskName} again.`);
  }

  return (
    <>
      <div className="card center-card">
        <Mask color={state.maskColor} style={maskStyleOf(state)} size={96} />
        <div className="mask-name">{state.maskName}</div>
        <div className="row" style={{ justifyContent: "center" }}>
          {MASK_STYLES.map((m) => (
            <button
              key={m.id}
              className={`mask-choice ${maskStyleOf(state) === m.id ? "on" : ""}`}
              aria-label={m.label}
              aria-pressed={maskStyleOf(state) === m.id}
              onClick={() => update((s) => ({ ...s, maskStyle: m.id }))}
            >
              <Mask color={state.maskColor} style={m.id} size={34} />
            </button>
          ))}
        </div>
        <button className="dice" onClick={() => update((s) => ({ ...s, maskName: randomMaskName(Math.random, s.maskName) }))}>Roll a new name</button>
        <span className="chip">{state.account ? "Verified with Google" : verified ? "Verified" : "Masked"}</span>
      </div>

      <section className="card">
        <h2>Your profile</h2>
        {state.account ? (
          <>
            <div className="row">
              {state.account.avatarUrl && <img className="avatar" src={state.account.avatarUrl} alt="" referrerPolicy="no-referrer" />}
              <div style={{ minWidth: 0 }}>
                <strong>{state.account.name}</strong>
                <p className="muted">{state.account.email}</p>
              </div>
            </div>
            <p className="muted">
              Signed in with Google. Neighbours see {state.maskName}; your name appears only to people you choose below.
            </p>
            <button
              className="btn ghost small"
              onClick={async () => {
                await google.signOut();
                notify("Signed out. You're masked again.");
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="muted">Create a profile with your Google account. It counts as verified and keeps your mask.</p>
            <GoogleButton google={google} label="Create profile with Google" />
          </>
        )}
      </section>
      <div className="stats">
        <div className="stat"><b>{state.thanks}</b><span>Thanks</span></div>
        <div className="stat"><b>{state.streak}</b><span>Day streak</span></div>
        <div className="stat"><b>{Math.max(state.bestStreak ?? 0, state.streak)}</b><span>Best streak</span></div>
      </div>
      <p className="muted center">Miss a day and your streak waits for you. Miss two and it starts again.</p>

      <section className="card">
        <h2>Trust ladder</h2>
        <ol className="ladder">
          <li className={verified ? "done" : "current"}>
            <span className="badge">1</span>
            <div>
              <h3>Masked</h3>
              <p>Play, ask (3 a day), answer, receive Thanks, join public meetups.</p>
            </div>
          </li>
          <li className={verified ? "current" : ""}>
            <span className="badge">2</span>
            <div>
              <h3>Verified</h3>
              <p>Message neighbours with mutual consent, ask 10 a day, and reveal your name to people you choose.</p>
              {!verified && !google.available && (
                <button
                  className="btn small"
                  onClick={() => {
                    update((s) => ({ ...s, level: "verified" }));
                    notify("Phone verified (demo). You can now reveal your name to people you choose.");
                  }}
                >
                  Verify phone (demo)
                </button>
              )}
            </div>
          </li>
          <li>
            <span className="badge">3</span>
            <div>
              <h3>Vouched</h3>
              <p>
                A neighbour vouches for you by exchanging a signed code in person. Lets you host meetups.{" "}
                <a href="/debug/handshake">Try the handshake</a>
              </p>
            </div>
          </li>
          <li>
            <span className="badge">4</span>
            <div>
              <h3>Watch</h3>
              <p>Trusted neighbours who review reports and welcome newcomers. Coming next.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Reveal your name</h2>
        {verified ? (
          <>
            {REGULARS.map((n, i) => (
              <label key={n} className="check" htmlFor={`reveal-${i}`}>
                <input
                  type="checkbox"
                  id={`reveal-${i}`}
                  checked={state.revealedTo.includes(n)}
                  onChange={(e) => toggleReveal(n, e.target.checked)}
                />
                <NeighbourMask name={n} me={state} size={24} />
                {n} <span className="tag">sample</span>
              </label>
            ))}
            <p className="muted">Everyone else still sees {state.maskName}.</p>
          </>
        ) : (
          <p className="muted">Verify your phone to reveal your real name to people you choose. Until then everyone sees {state.maskName}.</p>
        )}
      </section>

      <section className="card">
        <h2>What Kavala keeps about you</h2>
        <p className="muted">
          Home area: <span className="mono">{state.homeCell}</span> (an H3 hexagon of about 0.1 sq km
          {state.homeFromGps ? ", from your phone's location" : ", a demo location"}). No coordinates are stored. In this demo,
          everything is saved only in this browser.
        </p>
        <p className="muted">
          See how it works: <a href="/engine">the engine behind Kavala</a>.
        </p>
        {confirmReset ? (
          <div className="row">
            <span className="muted">Start over and clear everything on this phone?</span>
            <button className="btn small danger" onClick={onReset}>Yes, start over</button>
            <button className="btn ghost small" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn ghost small" onClick={() => setConfirmReset(true)}>Start over</button>
        )}
      </section>
    </>
  );
}
