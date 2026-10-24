"use client";

import { googleIconPaths, type GoogleAccount } from "@/lib/app/useGoogleAccount";

/** "Continue with Google", or an honest note when sign-in isn't configured yet. */
export default function GoogleButton({ google, label = "Continue with Google" }: { google: GoogleAccount; label?: string }) {
  if (!google.available) {
    return (
      <p className="muted">
        Google sign-in turns on once Supabase is connected and Google is switched on in it. Setup steps are in the README.
      </p>
    );
  }
  return (
    <>
      <button className="google-btn" onClick={google.signIn} disabled={google.busy}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          {googleIconPaths().map((p) => (
            <path key={p.fill} d={p.d} fill={p.fill} />
          ))}
        </svg>
        {google.busy ? "Opening Google…" : label}
      </button>
      {google.error && <p className="muted">{google.error}</p>}
    </>
  );
}
