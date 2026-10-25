"use client";

import { useState } from "react";
import { completeDaily, type AppState } from "@/lib/app/state";
import { bonusFor, goodTurnFor, questFor, type BonusKind } from "@/lib/app/dailyContent";
import { GameFrame, ResultSheet, buzz, formatTime, useElapsed } from "./GameKit";
import { GAME_COLORS, GameGlyph } from "./Icons";
import { NeighbourMask } from "./Mask";

type Update = (fn: (s: AppState) => AppState) => void;

const firstName = (name: string) => name.split(" ")[0];

export function GoodTurnGame({ state, update, onClose }: { state: AppState; update: Update; onClose: () => void }) {
  const turn = goodTurnFor(state.daily.key);
  const done = state.daily.help;
  const elapsed = useElapsed(!done);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const top = turn.tips.reduce((a, b) => (b.picked > a.picked ? b : a));
  const pick = state.daily.helpPick;
  const colors = GAME_COLORS.help;

  function finish(kind: "marked" | "answered", tipId: string, tipText?: string) {
    buzz(kind === "marked" && tipId === top.id ? [30, 40, 60] : 20);
    update((s) =>
      completeDaily({
        ...s,
        daily: {
          ...s.daily,
          help: kind,
          helpPick: tipId,
          helpText: tipText,
          helpAnsweredAt: kind === "answered" ? Date.now() : undefined,
          times: { ...s.daily.times, help: elapsed },
        },
      }),
    );
  }

  return (
    <GameFrame title="Good Turn" accent={colors.face} accentDeep={colors.deep} elapsed={state.daily.times?.help ?? elapsed} onClose={onClose}>
      <div className="speech">
        <NeighbourMask name={turn.asker} me={state} size={52} />
        <div className="bubble">
          <span className="bubble-name">{turn.asker} <span className="tag">sample</span></span>
          <p>{turn.question}</p>
        </div>
      </div>
      {done ? (
        <>
          {pick === "mine" ? (
            <div className="answer-card mine">
              <span className="answer-by">Your tip</span>
              <span>{state.daily.helpText}</span>
            </div>
          ) : (
            <div className="poll" aria-label="What neighbours picked (sample)">
              {turn.tips.map((t) => (
                <div key={t.id} className={`poll-row ${t.id === pick ? "mine" : ""}`} style={{ "--pct": `${t.picked}%` } as React.CSSProperties}>
                  <span className="poll-name">{t.id === pick ? `${firstName(t.by)} (your pick)` : firstName(t.by)}</span>
                  <span className="poll-pct">{t.picked}%</span>
                </div>
              ))}
              <span className="muted">What neighbours picked <span className="tag">sample</span></span>
            </div>
          )}
          <ResultSheet
            tone={pick === "mine" || pick === top.id ? "good" : "calm"}
            title={pick === "mine" ? "Tip sent!" : pick === top.id ? "Great call!" : "Good turn!"}
            sub={
              pick === "mine"
                ? state.daily.helpThanked
                  ? `${firstName(turn.asker)} found it useful. +1 Thanks`
                  : `You'll earn a Thanks if it helps ${firstName(turn.asker)}.`
                : pick === top.id
                  ? "Most neighbours trusted the same tip."
                  : `Most trusted ${firstName(top.by)}'s tip. Both can help.`
            }
            stats={[
              { label: "time", value: formatTime(state.daily.times?.help ?? 0) },
              { label: "helped", value: firstName(turn.asker) },
            ]}
            onAction={onClose}
          />
        </>
      ) : (
        <>
          <p className="game-note">Which tip would you trust? Tap it, or add your own.</p>
          <div className="answer-cards">
            {turn.tips.map((t) => (
              <button key={t.id} className="answer-card" onClick={() => finish("marked", t.id)}>
                <span className="answer-by">
                  <NeighbourMask name={t.by} me={state} size={24} /> {t.by} <span className="tag">sample</span>
                </span>
                <span>{t.text}</span>
              </button>
            ))}
            {writing ? (
              <div className="answer-card writing">
                <label className="field" htmlFor="good-turn-text">
                  Your tip
                  <textarea id="good-turn-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="A name, a place, a time or a price" maxLength={280} autoFocus />
                </label>
                <button className="btn gold" disabled={!text.trim()} onClick={() => finish("answered", "mine", text.trim())}>Send tip</button>
              </div>
            ) : (
              <button className="answer-card add" onClick={() => setWriting(true)}>＋ I know a better one</button>
            )}
          </div>
        </>
      )}
    </GameFrame>
  );
}

export function QuestGame({ state, update, onClose }: { state: AppState; update: Update; onClose: () => void }) {
  const done = state.daily.step;
  const elapsed = useElapsed(!done);
  const quest = questFor(state.daily.key);
  const colors = GAME_COLORS.quest;

  function finish(step: "done" | "later") {
    if (step !== "later") buzz([30, 40, 60]);
    update((s) => completeDaily({ ...s, daily: { ...s.daily, step, times: { ...s.daily.times, step: elapsed } } }));
  }

  return (
    <GameFrame title="Quest" accent={colors.face} accentDeep={colors.deep} elapsed={state.daily.times?.step ?? elapsed} onClose={onClose}>
      <p className="game-note">One small step in the real world today.</p>
      <div className="card quest-card">
        {quest.neighbour ? (
          <NeighbourMask name={quest.neighbour} me={state} size={56} />
        ) : (
          <span className="quest-icon"><GameGlyph kind="quest" /></span>
        )}
        <div>
          <span className="quest-title">{quest.title}</span>
          <span className="muted">{quest.detail}</span>
        </div>
      </div>
      {done ? (
        <ResultSheet
          tone={done === "later" ? "calm" : "good"}
          title={done === "later" ? "See you tomorrow" : "Quest done!"}
          sub={done === "later" ? "A new step comes at 6 AM." : "Small steps make a neighbourhood."}
          onAction={onClose}
        />
      ) : (
        <>
          <button className="btn-hero green" onClick={() => finish("done")}>I did it</button>
          <button className="linkish center" onClick={() => finish("later")}>Skip today</button>
        </>
      )}
    </GameFrame>
  );
}

/** Names and win words for the bonus games. */
export const BONUS_GAMES: Record<BonusKind, { name: string; tagline: string; ask: string; win: string; emoji: string }> = {
  lingo: { name: "Lingo", tagline: "One Malayalam word a day", ask: "What does this word mean?", win: "Sharp!", emoji: "🔤" },
  quiz: { name: "Kochi Quiz", tagline: "One question about the city", ask: "Pick one answer.", win: "Correct!", emoji: "❓" },
  poll: { name: "Hood Poll", tagline: "Say what you think", ask: "Tap your answer to see how neighbours voted.", win: "Voted!", emoji: "📊" },
};

/** Lingo, Kochi Quiz and Hood Poll: one tap, then the answer or the poll result. */
export function ChoiceGame({ kind, state, update, onClose }: { kind: BonusKind; state: AppState; update: Update; onClose: () => void }) {
  const meta = BONUS_GAMES[kind];
  const round = bonusFor(kind, state.daily.key);
  const result = state.daily.bonus?.[kind];
  const elapsed = useElapsed(!result);
  const right = round.answer ? result?.pick === round.answer : true;
  const colors = GAME_COLORS[kind];

  function pick(id: string) {
    if (result) return;
    buzz(!round.answer || id === round.answer ? [30, 40, 60] : 20);
    update((s) => ({ ...s, daily: { ...s.daily, bonus: { ...s.daily.bonus, [kind]: { pick: id, timeMs: elapsed } } } }));
  }

  return (
    <GameFrame title={meta.name} accent={colors.face} accentDeep={colors.deep} elapsed={result?.timeMs ?? elapsed} onClose={onClose}>
      <div className="clue-card">
        <span className="clue-label">{kind === "poll" ? "Today's poll" : kind === "lingo" ? "Today's word" : "Today's question"}</span>
        <span className={`clue-name ${kind === "lingo" ? "ml" : "long"}`} lang={kind === "lingo" ? "ml" : undefined}>{round.prompt}</span>
        {round.detail && <span className="clue-kind">{round.detail}</span>}
      </div>
      {result && round.answer === undefined ? (
        <div className="poll" aria-label="How neighbours voted (sample)">
          {round.choices.map((c) => (
            <div key={c.id} className={`poll-row ${c.id === result.pick ? "mine" : ""}`} style={{ "--pct": `${c.picked ?? 0}%` } as React.CSSProperties}>
              <span className="poll-name">{c.id === result.pick ? `${c.text} (you)` : c.text}</span>
              <span className="poll-pct">{c.picked ?? 0}%</span>
            </div>
          ))}
          <span className="muted">How neighbours voted <span className="tag">sample</span></span>
        </div>
      ) : (
        <>
          {!result && <p className="game-note">{meta.ask}</p>}
          <div className="answer-cards">
            {round.choices.map((c) => {
              const mark = !result ? "" : c.id === round.answer ? "right" : c.id === result.pick ? "wrong" : "";
              return (
                <button key={c.id} className={`answer-card choice ${mark}`} disabled={!!result} onClick={() => pick(c.id)}>
                  {c.text}
                  {mark === "right" && <span aria-label="right answer">✓</span>}
                  {mark === "wrong" && <span aria-label="your answer">✗</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
      {result && (
        <ResultSheet
          tone={kind === "poll" ? "calm" : right ? "good" : "close"}
          title={right ? meta.win : "Nice try!"}
          sub={round.note}
          stats={[{ label: "time", value: formatTime(result.timeMs) }]}
          onAction={onClose}
        />
      )}
    </GameFrame>
  );
}
