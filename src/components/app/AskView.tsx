"use client";

import { useState } from "react";
import type { AppState, Question } from "@/lib/app/state";
import { countsFor, type LiveHood } from "@/lib/app/live";
import { NeighbourMask } from "./Mask";

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  notify: (message: string) => void;
  live: LiveHood | null;
}

const CATEGORIES = ["Repairs", "Food", "Transport", "Waste", "Internet", "Other"];
const ASK_LIMIT = { masked: 3, verified: 10 } as const;

function timeAgo(ms: number): string {
  const minutes = Math.round((Date.now() - ms) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

export default function AskView({ state, update, notify, live }: Props) {
  const counts = countsFor(state, live);
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const todayStart = Date.now() - 24 * 3_600_000;
  const askedToday = state.questions.filter((q) => q.mine && q.askedAt > todayStart).length;
  const limit = ASK_LIMIT[state.level];

  function post() {
    const value = text.trim();
    if (!value) return;
    if (askedToday >= limit) {
      notify(`${state.level === "masked" ? "Masked" : "Verified"} members can ask ${limit} questions a day.`);
      return;
    }
    const q: Question = {
      id: `q-${Date.now()}`,
      by: state.maskName,
      text: value,
      category,
      askedAt: Date.now(),
      mine: true,
      reach: "own",
      widenOffered: false,
      answers: [],
    };
    update((s) => ({ ...s, questions: [q, ...s.questions] }));
    setText("");
    notify("Posted to your neighbourhood.");
  }

  function widen(id: string) {
    update((s) => ({
      ...s,
      questions: s.questions.map((q) => (q.id === id ? { ...q, reach: "adjacent", widenOffered: false, widenedAt: Date.now() } : q)),
    }));
    notify("Sent to the neighbouring areas too.");
  }

  function thank(questionId: string, answerId: string, who: string) {
    update((s) => ({
      ...s,
      questions: s.questions.map((q) =>
        q.id !== questionId ? q : { ...q, answers: q.answers.map((a) => (a.id === answerId ? { ...a, useful: true } : a)) },
      ),
    }));
    notify(`You thanked ${who}.`);
  }

  return (
    <>
      <div className="page-head">
        <span className="ml" lang="ml">ചോദിക്കൂ</span>
        <h1 className="flow-title">Ask your neighbours</h1>
      </div>
      <section className="card">
        <label className="field" htmlFor="ask-text">
          Your question
          <textarea id="ask-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Anyone know a plumber who comes on Sundays?" />
        </label>
        <label className="field" htmlFor="ask-cat">
          Topic
          <select id="ask-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <p className="muted">
          Seen only by your neighbourhood ({counts.sample ? `about ${counts.members} people, sample` : `${counts.members} people`}), as {state.maskName}. {askedToday} of {limit} questions
          used today.
        </p>
        <button className="btn" onClick={post} disabled={!text.trim()}>Post question</button>
      </section>

      <section className="card">
        <h2>Asked in your neighbourhood</h2>
        {state.questions.map((q) => (
          <article key={q.id} className="q">
            <div className="who">
              <NeighbourMask name={q.by} me={state} size={24} />
              <strong>{q.mine ? "You" : q.by}</strong>
              {!q.mine && <span className="tag">sample</span>}
              <span>{timeAgo(q.askedAt)}</span>
              <span className="cat">{q.category}</span>
              {q.reach === "adjacent" && <span className="cat">Next areas too</span>}
            </div>
            <p>{q.text}</p>
            {q.answers.map((a) => (
              <div key={a.id} className="answer">
                <div className="who">
                  <NeighbourMask name={a.by} me={state} size={22} />
                  <strong>{a.by === state.maskName ? "You" : a.by}</strong>
                  {a.sample && <span className="tag">sample</span>}
                  {a.area && <span>from {a.area}</span>}
                </div>
                <p>{a.text}</p>
                {a.useful ? (
                  <span className="useful">Marked useful</span>
                ) : q.mine && a.by !== state.maskName ? (
                  <div>
                    <button className="btn small" onClick={() => thank(q.id, a.id, a.by)}>Thank {a.by}</button>
                  </div>
                ) : null}
              </div>
            ))}
            {q.mine && q.widenOffered && (
              <div className="widen">
                <p>No answer yet from your neighbourhood. Ask the next areas too?</p>
                <button className="btn gold small" onClick={() => widen(q.id)}>Ask the neighbouring areas</button>
              </div>
            )}
            {q.mine && q.answers.length === 0 && !q.widenOffered && <p className="muted">Waiting for neighbours…</p>}
          </article>
        ))}
      </section>
    </>
  );
}
