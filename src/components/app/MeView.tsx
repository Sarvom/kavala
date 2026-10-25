"use client";

import { useState } from "react";
import { MASK_STYLES, maskStyleOf, randomMaskName, type AppState } from "@/lib/app/state";
import type { GoogleAccount } from "@/lib/app/useGoogleAccount";
import type { SaveStatus } from "@/lib/app/useCloudSave";
import { Mask, NeighbourMask } from "./Mask";
import GoogleButton from "./GoogleButton";
import { Coin, Flame } from "./Icons";
import { useTheme } from "@/lib/app/theme";

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  notify: (message: string) => void;
  onReset: () => void;
  google: GoogleAccount;
  saveStatus: SaveStatus;
}

const SAVE_TEXT: Record<SaveStatus, string> = {
  off: "",
  loading: "Loading your saved progress…",
  saving: "Saving to your account…",
  saved: "Progress saved to your account.",
  error: "Couldn't reach your account just now. Progress is kept on this phone and saved when the connection is back.",
};

const REGULARS = ["Carol Chacko", "Tony Thomas", "Wanda Warrier"];

export default function MeView({ state, update, notify, onReset, google, saveStatus }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [theme, setTheme] = useTheme();
  const verified = state.level === "verified";
  const signedInWithGoogle = state.account?.provider === "google";

  function toggleReveal(name: string, on: boolean) {
    update((s) => ({ ...s, revealedTo: on ? [...s.revealedTo, name] : s.revealedTo.filter((n) => n !== name) }));
    notify(on ? `${name} can now see your real name.` : `${name} sees ${state.maskName} again.`);
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Your profile</span>
        <h1 className="flow-title">Me</h1>
      </div>
      <div className="card center-card">
        <span className="mask-plate"><Mask color={state.maskColor} style={maskStyleOf(state)} size={96} /></span>
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
        <button className="btn ghost small" onClick={() => update((s) => ({ ...s, maskName: randomMaskName(Math.random, s.maskName) }))}>🎲 Roll a new name</button>
        <span className="chip blue">{signedInWithGoogle ? "Verified with Google" : verified ? "Verified" : "Masked"}</span>
      </div>

      <section className="card">
        <h2>Your profile</h2>
        {state.account && signedInWithGoogle ? (
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
            {saveStatus !== "off" && <p className="muted">{SAVE_TEXT[saveStatus]}</p>}
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
            <p className="muted">
              {state.account?.provider === "anonymous"
                ? "You're playing masked. Your progress is saved to an account with no name on it. Sign in with Google to keep it when you change phones; neighbours will still see your mask."
                : google.configured
                  ? "You're playing masked and your progress is saved only on this phone. Sign in with Google to save it to an account; neighbours will still see your mask."
                  : "Create a profile with your Google account. It counts as verified and keeps your mask."}
            </p>
            {saveStatus !== "off" && <p className="muted">{SAVE_TEXT[saveStatus]}</p>}
            <GoogleButton google={google} label={state.account ? "Continue with Google" : "Create profile with Google"} />
          </>
        )}
      </section>
      <div className="stats">
        <div className="stat"><b style={{ display: "flex", alignItems: "center", gap: 4 }}><Coin size={22} />{state.thanks}</b><span>Thanks</span></div>
        <div className="stat"><b style={{ display: "flex", alignItems: "center", gap: 4 }}><Flame size={22} lit={state.streak > 0} />{state.streak}</b><span>Day streak</span></div>
        <div className="stat"><b>{Math.max(state.bestStreak ?? 0, state.streak)}</b><span>Best streak</span></div>
      </div>
      <p className="muted center">Miss a day and your streak waits for you. Miss two and it starts again.</p>

      <section className="card">
        <h2>Appearance</h2>
        <div className="two-col" role="group" aria-label="Theme">
          <button className={`btn ${theme === "dark" ? "blue" : "ghost"}`} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
          <button className={`btn ${theme === "light" ? "blue" : "ghost"}`} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
        </div>
        <p className="muted">Saved on this phone.</p>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Trust ladder</h2>
          <span className="section-ml">Unlock more as neighbours trust you</span>
        </div>
        <ol className="ladder">
          <li className={verified ? "done" : "current"}>
            <span className="badge" aria-label="Step 1"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 11c3-4.5 17-4.5 20 0-.6 4-3.5 5.6-6.4 5-1.6-.4-2.5-1.6-3.6-2.6-1.1 1-2 2.2-3.6 2.6C5.5 16.6 2.6 15 2 11z" /></svg></span>
            <div>
              <h3>Masked</h3>
              <p>Play, ask (3 a day), answer, receive Thanks, join public meetups.</p>
            </div>
          </li>
          <li className={verified ? "current" : ""}>
            <span className="badge" aria-label="Step 2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
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
            <span className="badge" aria-label="Step 3"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9h5l3-3 3 3h5v3l-4 3v4H8v-4l-4-3z" /></svg></span>
            <div>
              <h3>Vouched</h3>
              <p>
                A neighbour vouches for you by exchanging a signed code in person. Lets you host meetups.{" "}
                <a href="/debug/handshake">Try the handshake</a>
              </p>
            </div>
          </li>
          <li>
            <span className="badge" aria-label="Step 4"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /></svg></span>
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
          {state.homeFromGps ? ", from your phone's location" : ", a demo location"}). No coordinates are stored.{" "}
          {google.local
            ? "Everything is saved only in this browser."
            : "Your mask, hexagon, streak, Thanks and each day's results are saved to your account; today's map guesses stay on this phone."}
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
      <div className="brand-foot">
        <img className="logo-on-light" src="/brand/trying-to-do-better-light.webp" alt="Trying to Do Better" width={68} height={56} />
        <img className="logo-on-dark" src="/brand/trying-to-do-better-dark.webp" alt="Trying to Do Better" width={68} height={56} />
        <span className="fine">Kavala is a Trying to Do Better project.</span>
      </div>
    </>
  );
}
