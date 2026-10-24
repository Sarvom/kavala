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

type Tab = "play" | "ask" | "map" | "me";

const TABS: { id: Tab; label: string; icon: React.JSX.Element }[] = [
  { id: "play", label: "Play", icon: <><rect x="3" y="6" width="18" height="12" rx="4" /><path d="M8 10v4M6 12h4" /><circle cx="16" cy="11" r="1" /><circle cx="18" cy="13" r="1" /></> },
  { id: "ask", label: "Ask", icon: <><path d="M5 5h14v10H9l-4 4z" /><path d="M12 8.5v2.5" /><path d="M12 13h.01" /></> },
  { id: "map", label: "Map", icon: <><polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" /><circle cx="12" cy="12" r="2.5" /></> },
  { id: "me", label: "Me", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
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
              <span className="app-logo">Kavala</span>
              <span className="me-chip">
                <Mask color={state.maskColor} style={maskStyleOf(state)} size={26} />
                {state.maskName}
              </span>
              <span className="chip gold">{state.thanks} Thanks</span>
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
                  <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
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
