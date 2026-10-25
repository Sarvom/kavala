"use client";

/**
 * Opening screen: the Kavala 3D emblem over a night-blue sky with a fine web
 * in the corner, the name in English and Malayalam, and one big button.
 */
export default function Splash({ returning, name, onEnter }: { returning: boolean; name?: string; onEnter: () => void }) {
  return (
    <div className="splash">
      <div className="splash-overlay">
        <div className="splash-hero">
          <img className="splash-emblem" src="/brand/kavala-emblem-3d.webp" alt="Kavala emblem" width={260} height={260} />
          <h1 className="splash-word">KAVALA</h1>
          <p className="splash-tag">Your friendly neighbourhood, trying to do better, one small step at a time.</p>
        </div>
        <div className="splash-actions">
          {returning && name && <p className="welcome">Welcome back, {name}</p>}
          <button className="btn-hero" onClick={onEnter}>
            {returning ? "Continue" : "Get started"}
          </button>
          {!returning && (
            <button className="btn-hero ghost" onClick={onEnter}>
              I already play
            </button>
          )}
          <div className="splash-by">
            <span>by</span>
            <img src="/brand/trying-to-do-better-mark-dark.webp" alt="" width={30} height={30} />
            <span>Trying to Do Better</span>
          </div>
        </div>
      </div>
    </div>
  );
}
