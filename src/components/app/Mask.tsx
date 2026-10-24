import { SAMPLE_NEIGHBOURS, type MaskStyle } from "@/lib/app/state";

/**
 * Original mask avatars. Everyone starts masked; some designs come from Kerala
 * art forms (Kathakali make-up, the Pulikali tiger dance).
 */
export function Mask({ color, size = 32, style = "classic" }: { color: string; size?: number; style?: MaskStyle }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false" style={{ flex: "none" }}>
      {style === "classic" && (
        <>
          <circle cx="20" cy="20" r="20" fill={color} />
          <path d="M6 19c5-7 23-7 28 0-1 6-5 8.5-9.5 7.5-2.2-.5-3.4-2.2-4.5-3.5-1.1 1.3-2.3 3-4.5 3.5C11 27.5 7 25 6 19z" fill="#0b1020" />
          <ellipse cx="14" cy="20" rx="3.2" ry="2.1" fill="#ffffff" />
          <ellipse cx="26" cy="20" rx="3.2" ry="2.1" fill="#ffffff" />
        </>
      )}
      {style === "web" && (
        <>
          <circle cx="20" cy="20" r="20" fill={color} />
          <path d="M5 18c5-8 25-8 30 0-1 7-6 10-11 8.5-2-.7-3-2.4-4-3.6-1 1.2-2 2.9-4 3.6C11 28 6 25 5 18z" fill="#0b1020" />
          <g stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.7" fill="none">
            <path d="M20 21L20 12M20 21L8 14M20 21L32 14M20 21L6 22M20 21L34 22" />
            <path d="M12 16.5Q20 13 28 16.5M9 19Q20 15.5 31 19" />
          </g>
          <path d="M10 19.5q4-3 7 0q-3 2.6-7 0z" fill="#9fe7ff" />
          <path d="M30 19.5q-4-3-7 0q3 2.6 7 0z" fill="#9fe7ff" />
        </>
      )}
      {style === "kathakali" && (
        <>
          <circle cx="20" cy="20" r="20" fill="#f2c14e" />
          <ellipse cx="20" cy="21" rx="13" ry="15" fill="#2e9e5b" />
          <path d="M7 22q1 14 13 15q12-1 13-15" fill="none" stroke="#ffffff" strokeWidth="3" />
          <path d="M10 18q4-4 8 0q-4 2.5-8 0z" fill="#ffffff" />
          <path d="M30 18q-4-4-8 0q4 2.5 8 0z" fill="#ffffff" />
          <circle cx="14" cy="18" r="1.4" fill="#111111" />
          <circle cx="26" cy="18" r="1.4" fill="#111111" />
          <path d="M9 14.5q5-3 9 0M31 14.5q-5-3-9 0" stroke="#111111" strokeWidth="1.4" fill="none" />
          <ellipse cx="20" cy="28" rx="4.2" ry="1.9" fill="#d7263d" />
          <path d="M18.5 8.5h3l-1.5 4z" fill="#d7263d" />
        </>
      )}
      {style === "pulikali" && (
        <>
          <circle cx="20" cy="20" r="20" fill="#f4a019" />
          <g fill="#1a1208">
            <path d="M14 4q2 5 0 9q3-4 2-9zM20 3q1.5 6 0 10q2.5-5 1-10zM26 4q-2 5 0 9q-3-4-2-9z" />
            <path d="M3 18q6 1 8 4q-5-1-8 1zM37 18q-6 1-8 4q5-1 8 1zM5 27q5-1 8 2q-5 0-8 2zM35 27q-5-1-8 2q5 0 8 2z" />
          </g>
          <ellipse cx="14" cy="18" rx="3.4" ry="2.6" fill="#ffffff" />
          <ellipse cx="26" cy="18" rx="3.4" ry="2.6" fill="#ffffff" />
          <circle cx="14" cy="18" r="1.4" fill="#1a1208" />
          <circle cx="26" cy="18" r="1.4" fill="#1a1208" />
          <path d="M17.5 23h5l-2.5 3z" fill="#1a1208" />
          <path d="M14 30q6 4 12 0" stroke="#1a1208" strokeWidth="1.5" fill="none" />
        </>
      )}
      {style === "owl" && (
        <>
          <circle cx="20" cy="20" r="20" fill={color} />
          <path d="M9 9l4 6M31 9l-4 6" stroke="#0b1020" strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="19" r="6" fill="#ffffff" />
          <circle cx="26" cy="19" r="6" fill="#ffffff" />
          <circle cx="14" cy="19" r="2.6" fill="#0b1020" />
          <circle cx="26" cy="19" r="2.6" fill="#0b1020" />
          <path d="M18 25h4l-2 4z" fill="#ffb833" />
        </>
      )}
    </svg>
  );
}

const NEIGHBOUR_STYLES: MaskStyle[] = ["classic", "kathakali", "owl", "pulikali", "web"];

/** Colour for a neighbour's mask; the user's own colour when it's them. */
export function maskColorFor(name: string, me: { maskName: string; maskColor: string }): string {
  if (name === me.maskName) return me.maskColor;
  return SAMPLE_NEIGHBOURS[name] ?? "#2e8c8c";
}

/** A stable mask design for each sample neighbour, and the user's own choice for them. */
export function maskStyleFor(name: string, me: { maskName: string; maskStyle?: MaskStyle }): MaskStyle {
  if (name === me.maskName) return me.maskStyle ?? "classic";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NEIGHBOUR_STYLES[h % NEIGHBOUR_STYLES.length];
}

/** Convenience: a neighbour's (or the user's) mask with the right colour and design. */
export function NeighbourMask({ name, me, size = 28 }: { name: string; me: { maskName: string; maskColor: string; maskStyle?: MaskStyle }; size?: number }) {
  return <Mask color={maskColorFor(name, me)} style={maskStyleFor(name, me)} size={size} />;
}
