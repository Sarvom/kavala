"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dailyKey } from "@/lib/daily/score";
import { advance, clearState, initialState, linkAccount, loadState, maskStyleOf, rollDay, saveState, type AppState } from "@/lib/app/state";
import { useGoogleAccount } from "@/lib/app/useGoogleAccount";
import { useCloudSave } from "@/lib/app/useCloudSave";
import { useLiveHood } from "@/lib/app/useLiveHood";
import Splash from "./Splash";
import Onboarding from "./Onboarding";
import GameHub, { type Game } from "./GameHub";
import AskView from "./AskView";
import HoodView from "./HoodView";
import MeView from "./MeView";
import { Mask } from "./Mask";
import { Coin, Flame, TabIcon } from "./Icons";

type Tab = "play" | "map" | "ask" | "me";

const TABS: { id: Tab; label: string }[] = [
  { id: "play", label: "Today" },
  { id: "map", label: "Map" },
  { id: "ask", label: "Ask" },
  { id: "me", label: "Me" },
];

/**
 * Kavala: splash, onboarding (profile or mask), then the daily games hub.
 * Progress is saved in this browser and, when Supabase is connected, in the
 * person's account (Google or anonymous). Sample neighbours stand in for real
 * ones until neighbourhoods are live.
 */
export default function KavalaApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>("play");
  const [game, setGame] = useState<Game | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const google = useGoogleAccount();
  const saveStatus = useCloudSave(state, setState, google.profile, google.ready);
  const live = useLiveHood(google.profile?.userId ?? null, state?.daily.key, saveStatus);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  useEffect(() => {
    const key = dailyKey();
    setState(rollDay(loadState() ?? initialState(key), key));
    // Coming back from Google sign-in skips the splash.
    if (window.location.search.includes("code=")) setEntered(true);
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (state) saveState(state);
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      if (!current) return;
      const { state: next, events } = advance(rollDay(current, dailyKey()), Date.now());
      if (next !== current) setState(next);
      if (events.length > 0) notify(events[events.length - 1].message);
    }, 2000);
    return () => clearInterval(timer);
  }, [notify]);

  const loaded = state !== null;
  useEffect(() => {
    if (!loaded || !google.available || !google.ready) return;
    setState((s) => (s ? linkAccount(s, google.profile) : s));
  }, [loaded, google.available, google.ready, google.profile]);

  function reset() {
    clearState();
    setTab("play");
    setGame(null);
    setEntered(false);
    setState(initialState(dailyKey()));
  }

  if (!state) return <div className="game-app" />;

  if (!entered) {
    return <Splash returning={state.joined} name={state.maskName} onEnter={() => setEntered(true)} />;
  }

  const playing = state.joined && tab === "play" && game !== null;

  return (
    <div className={`game-app ${playing ? "playing" : ""}`}>
      {!state.joined ? (
        <Onboarding state={state} update={update} notify={notify} google={google} />
      ) : (
        <>
          {!playing && (
            <header className="app-top">
              <span className="app-brand">
                <img className="logo-on-light" src="/brand/kavala-mark-light.webp" alt="" width={36} height={36} />
                <img className="logo-on-dark" src="/brand/kavala-mark-dark.webp" alt="" width={36} height={31} />
                Kavala
              </span>
              <span className="stat-pill streak" aria-label={`${state.streak} day streak`} title="Day streak">
                <Flame size={24} lit={state.streak > 0} />
                {state.streak}
              </span>
              <span className="stat-pill thanks" aria-label={`${state.thanks} Thanks`} title="Thanks from neighbours">
                <Coin size={24} />
                {state.thanks}
              </span>
              <button className="avatar-btn" onClick={() => { setTab("me"); window.scrollTo(0, 0); }} aria-label={`${state.maskName}, open Me`}>
                <Mask color={state.maskColor} style={maskStyleOf(state)} size={36} />
              </button>
            </header>
          )}
          <main className="app-main">
            {tab === "play" && <GameHub state={state} update={update} notify={notify} game={game} setGame={setGame} live={live} />}
            {tab === "ask" && <AskView state={state} update={update} notify={notify} live={live} />}
            {tab === "map" && <HoodView state={state} live={live} />}
            {tab === "me" && <MeView state={state} update={update} notify={notify} onReset={reset} google={google} saveStatus={saveStatus} />}
          </main>
          {!playing && (
            <nav className="tabs" aria-label="App sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className="tab"
                  aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => {
                    setTab(t.id);
                    window.scrollTo(0, 0);
                  }}
                >
                  <TabIcon tab={t.id} />
                  {t.label}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
