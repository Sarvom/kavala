"use client";

/**
 * Opening screen: a Kerala junction at night (palms, backwater, a houseboat,
 * a tea shop under a streetlamp) with a masked neighbourhood hero on the roof
 * and strings of lights linking the homes. All artwork is original.
 */

const STARS: [number, number, number][] = [
  [30, 40, 1.2], [70, 90, 0.9], [110, 30, 1.4], [150, 120, 0.8], [190, 60, 1.1], [230, 25, 0.9], [260, 150, 1.2],
  [340, 40, 1], [370, 110, 1.3], [20, 160, 0.8], [90, 200, 1], [140, 250, 0.7], [210, 210, 0.9], [300, 220, 0.8],
  [380, 260, 1.1], [50, 290, 0.8], [180, 300, 0.7], [250, 280, 1], [330, 320, 0.7], [120, 340, 0.9],
];

function Palm({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  const f = flip ? -1 : 1;
  return (
    <g className="palm" transform={`translate(${x} ${y}) scale(${f * s} ${s})`}>
      <path d="M0 0 C 6 -60, 4 -120, 18 -170" stroke="#04060f" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g fill="#04060f" transform="translate(18 -170)">
        <path d="M0 0 C -30 -14, -60 -6, -78 18 C -52 2, -26 2, 0 0z" />
        <path d="M0 0 C -24 -30, -54 -34, -70 -22 C -44 -24, -20 -16, 0 0z" />
        <path d="M0 0 C -2 -34, 14 -52, 30 -56 C 16 -40, 8 -22, 0 0z" />
        <path d="M0 0 C 26 -26, 56 -26, 74 -10 C 48 -16, 24 -10, 0 0z" />
        <path d="M0 0 C 30 -6, 58 8, 70 32 C 46 12, 22 6, 0 0z" />
        <path d="M0 0 C 12 18, 14 40, 6 60 C 4 36, 2 18, 0 0z" />
        <circle cx="0" cy="4" r="5" />
      </g>
    </g>
  );
}

export default function Splash({ returning, name, onEnter }: { returning: boolean; name?: string; onEnter: () => void }) {
  return (
    <div className="splash">
      <svg className="splash-art" viewBox="0 0 400 720" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#060918" />
            <stop offset="0.55" stopColor="#171b45" />
            <stop offset="1" stopColor="#3b2654" />
          </linearGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141a40" />
            <stop offset="1" stopColor="#05070f" />
          </linearGradient>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor="#ffd27a" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffb833" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="windowGlow">
            <stop offset="0" stopColor="#ffe3a3" />
            <stop offset="1" stopColor="#ff9d2e" />
          </radialGradient>
          <mask id="crescent">
            <circle cx="330" cy="52" r="20" fill="#fff" />
            <circle cx="340" cy="45" r="18" fill="#000" />
          </mask>
        </defs>

        <rect width="400" height="720" fill="url(#sky)" />
        {STARS.map(([cx, cy, r], i) => (
          <circle key={i} className="star" cx={cx} cy={cy} r={r} fill="#ffffff" style={{ animationDelay: `${(i % 7) * 0.6}s` }} />
        ))}
        <circle cx="330" cy="52" r="20" fill="#ffe9b0" mask="url(#crescent)" />

        {/* Far shore */}
        <path d="M0 470 C 60 455, 120 462, 180 452 S 320 448, 400 458 L400 480 L0 480z" fill="#0e1230" />

        {/* Backwater with reflections */}
        <rect y="476" width="400" height="244" fill="url(#water)" />
        <g stroke="#ffe9b0" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
          <path d="M288 500h24M282 516h34M292 532h16" />
        </g>
        <g stroke="#ffb833" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round">
          <path d="M194 500h14M188 518h26M196 536h10M190 554h20" />
        </g>

        {/* Houseboat */}
        <g transform="translate(40 470)">
          <path d="M0 22 C 20 34, 110 34, 132 20 L 128 28 C 100 42, 30 42, 4 30z" fill="#04060f" />
          <path d="M18 22 C 30 -4, 100 -4, 112 22z" fill="#0a0d20" />
          <rect x="40" y="10" width="7" height="6" fill="url(#windowGlow)" />
          <rect x="58" y="8" width="7" height="6" fill="url(#windowGlow)" />
          <rect x="76" y="10" width="7" height="6" fill="url(#windowGlow)" />
        </g>

        {/* The kavala: a bank with a junction, tea shop and lamp */}
        <path d="M150 470 C 200 462, 300 460, 400 466 L400 720 L150 720z" fill="#070a18" opacity="0" />
        <path d="M170 478 L400 470 L400 500 L160 500z" fill="#0a0d1f" />

        {/* Strings of lights: the threads between neighbours */}
        <g fill="none" stroke="#ffd27a" strokeOpacity="0.6" strokeWidth="1">
          <path d="M60 300 Q 130 350 200 352" />
          <path d="M200 352 Q 250 372 300 360" />
          <path d="M300 360 Q 350 330 392 318" />
        </g>
        <g fill="#ffd27a">
          {[[80, 318], [104, 332], [130, 343], [158, 350], [184, 352], [222, 362], [250, 368], [278, 364], [320, 350], [348, 337], [372, 326]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} className="bulb" cx={cx} cy={cy} r="2.2" />
          ))}
        </g>

        {/* Streetlamp */}
        <circle className="glow" cx="202" cy="356" r="78" fill="url(#lampGlow)" />
        <path d="M200 478 V 360 q 0 -10 10 -10 h 10" stroke="#04060f" strokeWidth="4" fill="none" />
        <path d="M212 348 h 18 l -4 8 h -10z" fill="#04060f" />
        <circle cx="221" cy="358" r="4" fill="#ffe3a3" />

        {/* Junction sign */}
        <g transform="translate(160 420)">
          <rect x="-2" y="0" width="3" height="58" fill="#04060f" />
          <rect x="-34" y="-2" width="66" height="22" rx="3" fill="#0f6b4f" stroke="#e8f5ee" strokeWidth="1.2" />
          <text x="-1" y="13.5" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="12" fill="#ffffff" letterSpacing="1">
            KAVALA
          </text>
        </g>

        {/* Tea shop */}
        <g transform="translate(244 386)">
          <rect x="0" y="22" width="120" height="70" fill="#120f22" />
          <path d="M-10 26 L 60 -6 L 130 26z" fill="#5a2a1c" />
          <path d="M-10 26 L 60 -6 L 130 26" stroke="#2c140d" strokeWidth="2" fill="none" />
          <rect x="10" y="46" width="44" height="30" fill="url(#windowGlow)" opacity="0.92" />
          <rect x="66" y="40" width="40" height="52" fill="#0a0814" />
          <rect x="14" y="28" width="92" height="15" rx="2" fill="#0b2b2e" stroke="#9fe7ff" strokeOpacity="0.5" />
          <text x="60" y="39.5" textAnchor="middle" fontFamily="'Noto Sans Malayalam', sans-serif" fontWeight="700" fontSize="10" fill="#ffffff">
            ചായക്കട
          </text>
          <rect x="6" y="84" width="54" height="5" fill="#04060f" />
          {/* Masked neighbourhood hero on the roof ridge */}
          <g className="hero" transform="translate(60 -6)">
            <path className="scarf" d="M2 -40 C 18 -44, 30 -38, 44 -44 C 34 -34, 20 -34, 4 -34z" fill="#3ddc97" />
            <circle cx="0" cy="-44" r="8" fill="#04060f" />
            <rect x="-7" y="-47" width="14" height="4" rx="2" fill="#ffb833" />
            <path d="M-8 -36 h16 l3 22 h-22z" fill="#04060f" />
            <path d="M-7 -14 l-3 14 h5 l3 -12 M7 -14 l3 14 h-5 l-3 -12" fill="#04060f" />
            <path d="M-8 -34 l-10 10 M8 -34 l10 10" stroke="#04060f" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>

        <Palm x={30} y={480} s={1.15} />
        <Palm x={372} y={478} s={1} flip />
        <Palm x={86} y={470} s={0.7} flip />

        {/* Foreground bank */}
        <path d="M0 640 C 100 620, 260 630, 400 612 L400 720 L0 720z" fill="#04060f" />
      </svg>

      <div className="splash-overlay">
        <div className="logo">
          <svg width="74" height="74" viewBox="0 0 64 64" aria-hidden="true">
            <polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="#0b1020" stroke="#ffb833" strokeWidth="3" />
            <path d="M14 30c5-7 31-7 36 0-1 7-6 9-11 8-3-.6-5-3-7-4.5-2 1.5-4 3.9-7 4.5-5 1-10-1-11-8z" fill="#ffb833" />
            <ellipse cx="24" cy="31" rx="3.6" ry="2.4" fill="#0b1020" />
            <ellipse cx="40" cy="31" rx="3.6" ry="2.4" fill="#0b1020" />
          </svg>
          <h1 className="logo-word">Kavala</h1>
          <p className="logo-tag">Your friendly neighbourhood</p>
        </div>
        <div className="splash-actions">
          {returning && name && <p className="welcome">Welcome back, {name}</p>}
          <button className="btn-hero" onClick={onEnter}>
            {returning ? "Continue" : "Enter the kavala"}
          </button>
        </div>
      </div>
    </div>
  );
}
