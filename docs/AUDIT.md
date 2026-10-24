# Audit of the ported prototype (kavala-v1 @ 7086937)

Written 2026-10-25 after the port in PR #2, before any behaviour change. The app was played end to end at **390×844** and **360×640** (mobile emulation in Chromium, touch, device scale 2 and 3) against `npm run dev` with no Supabase keys set, plus the engine and debug pages at 390×844. A 59-second recording and screenshots are attached to PR #2 and the audit PR.

Environment limits, so you can read the results honestly:

- This machine cannot reach any of the three Overpass servers (OpenStreetMap place search), only the map tiles. Live Spot was checked up to the error screen; full Spot rounds used a stand-in `/api/places` response named "Audit cafe (test fixture)".
- The machine has no emoji font, so emoji (share squares, game icons) show as boxes in the screenshots. Phones have emoji fonts; this is not an app bug, but it is noted below because the share card depends on emoji.
- Not a real phone: no Safari, no Android Chrome, no native share sheet, no real GPS.

## What works

| Screen | Result at both sizes |
| --- | --- |
| Splash | Night scene renders; "Enter the kavala" works. |
| Onboarding | Google path honestly says sign-in "isn't switched on" without keys. Mask path: all five masks (Night watch, Web weaver, Kathakali, Pulikali tiger, Night owl), "Roll a name", demo Kochi spot, and a GPS fix (geolocation override at Kochi) showed "Found from your phone." Only the H3 hexagon is kept. |
| Games hub | Three tiles, countdown to the next daily, leaderboard and "played today" both labelled sample. The player's Spot score joins the leaderboard. |
| Spot (error path) | When Overpass fails, the screen lists the reason per server with "Try again" and "Skip today". |
| Spot (play, with fixture) | Map taps, lock-in, Hot/Warm/Cold hint with distance and compass, three tries, closing and reopening keeps the guesses and clock, result burst and points (715 for 168 m closest; 996 for 2 m). |
| Good Turn | Picking a tip reveals the poll (labelled sample). Writing your own tip gets a "+1 Thanks" from the sample asker after about 4 s. |
| Quest | Check-in without GPS gives a clear permission message; with GPS 6.5 km away it says how far you are; "Done" and "Skip today" both complete the step. |
| Daily complete | Share card with squares, streak 1, Copy (clipboard fallback "Result copied") and WhatsApp buttons, next-daily countdown. A skipped Quest shows as a dash. |
| Ask | Three questions allowed, fourth blocked (masked limit). After about 20 s the app offers to widen; after widening a sample neighbour answers in about 4 s; "Thank" marks it useful. |
| Map | OpenStreetMap tiles and hexagons render; neighbour count labelled sample. |
| Me | Trust ladder, best streak, Google explanation, reveal toggles, "Start over" returns to the splash with fresh state. |
| Engine pages | `/engine`, `/debug/location`, `/debug/hoods`, `/debug/handshake` render without horizontal scroll. Beacon returns 200 with `stored: false` and says no database is connected. Handshake code verifies once, then "This code has already been used." |
| PWA | `/manifest.webmanifest` is valid JSON; `/icon-192.png` and `/icon-512.png` return 200. |

No horizontal page overflow was measured on any screen at either size.

## What is broken or weak

1. **Live Spot places are unverified.** Overpass could not be reached from here. Needs checking on the Vercel deployment; Phase 1 item 6 (cache places per neighbourhood in Supabase) removes the dependency on public servers during the demo.
2. **Tap targets under 44 px:** mask colour dots 30×30, onboarding Back ~32×35, game close button 40×40, Leaflet zoom buttons 30×30, Quest "Skip today" link ~35 high, Ask topic select 43 high, Ask widen and Thank buttons 35 high, Me demo-verify/reset/confirm ~35–38 high, engine page nav links ~23 high. To fix in the Phase 2 restyle.
3. **No Report button** on questions or answers in Ask (Phase 1 item 4).
4. **"Verify phone (demo)"** in Me flips the trust level to Verified with one tap and no verification. It is labelled demo, but it must be replaced by real sign-in (Phase 1 item 1).
5. **Handshake nonces live in memory**, so a replay would pass on another server instance, and `/debug/handshake` simulates both phones; no QR or camera yet (Phase 1 item 5).
6. **Emoji dependence:** squares and game icons in the share text are emoji; fine on phones, boxes where no emoji font exists.
7. Minor: "Start over" clears progress but the `kavala-app-v1` key is written again immediately with a fresh state (by design: state is saved on every change). Not harmful.

## What is sample-only

Everything social is sample content, labelled "sample" in the UI, because the database is not connected and all progress lives in `localStorage` (`kavala-app-v1`):

- Neighbours (Wanda Warrier, Tony Thomas, …), the 112-member count and the 38–39 "played today".
- Leaderboard scores (seeded per day) apart from the player's own Spot score.
- Good Turn questions, tips, poll percentages and the "+1 Thanks" reply.
- Quest "newest neighbour".
- Ask: the four seeded questions and their answers, the widening reply, and the sample reveal recipients in Me.
- `/debug/hoods` residents are synthetic and say so.

Google sign-in exists in code but was not exercised (no keys here). Nothing is stored on the server: the beacon API validates and returns `stored: false`.

## Baseline

`npm test` 66 passed (5 files), `npm run typecheck` passed, `npm run build` passed, Node 22.12.0.
