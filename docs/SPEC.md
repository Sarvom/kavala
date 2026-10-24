# Kavala specification

This file is the single reference for anyone building Kavala, human or AI. Read it together with `AGENTS.md`. When code and this file disagree, raise it rather than guessing.

## Product in one line

A digital daily game that turns nearby strangers into a small, trusted neighbourhood, so people who move to a new place find help, friends and belonging without giving up their privacy.

Tagline: *Your friendly neighbourhood, trying to do better, one small step at a time.*

## Principles

1. **Small by design.** About 150 people per neighbourhood at most, measured in people, not kilometres.
2. **A healthy habit.** One short daily ritual with a natural stopping point. Streaks forgive missed days.
3. **Privacy is a choice.** Users start masked (pseudonym and avatar) and reveal themselves one person at a time.
4. **Complement, don't compete.** Groups graduate to WhatsApp; Kavala links out to existing local tools.
5. **Inclusive by default.** Neighbourhoods grow in sparse areas; the app stays light on old phones and weak data.
6. **Scales out, not up.** Many separate small neighbourhoods, never one big network.

## Location architecture (implemented: `src/lib/geo`)

The phone reads GPS precisely; the server only ever receives H3 cell IDs.

1. **Read** with `watchPosition`, `enableHighAccuracy: true`, `maximumAge: 0`, `timeout: 15000` (`useLocation.ts`).
2. **Filter** (`filter.ts`): reject invalid fixes, fixes worse than about 100 m, and jumps faster than 50 m/s after allowing for both fixes' accuracy. Smooth accepted fixes with a small Kalman filter.
3. **Pick precision** (`resolution.ts`): the finest H3 resolution whose average edge is at least twice the raw fix's accuracy. Thresholds are computed from h3-js, not hard-coded:

| Raw GPS accuracy | Resolution | Average edge |
| --- | --- | --- |
| up to about 14 m | 11 | about 29 m |
| up to about 38 m | 10 | about 76 m |
| up to about 100 m | 9 | about 201 m |
| worse | rejected | ask the user to move or pin manually |

4. **Convert** (`cells.ts`): fine cell plus its resolution-9 parent.
5. **Send** (`beacon.ts`, `/api/beacon`): `{deviceId, cellFine, resolution, cellR9, accuracyM, at}`. Requests containing `lat`, `lng`, `latitude`, `longitude`, `coords` or similar keys are refused. Beacons older than 60 seconds are refused.

Honest limit: a browser cannot reliably detect fake-location apps. The speed check, accuracy check and in-person handshake make faking costly, not impossible.

## Neighbourhood engine (implemented: `src/lib/hood`)

- A resident's home is a resolution-9 cell (about 0.1 sq km), never an address.
- `rebalance()` groups residents top-down from resolution 6 (about 36 sq km). A cell with more than 150 residents splits into its children, down to resolution 9. Cells with fewer than 30 are pooled with touching cells. A neighbourhood is a set of same-resolution cells.
- `assignNeighbourhood()` returns the neighbourhood containing a home cell, or creates the coarsest new cell (resolution 7, then 8, then 9) that overlaps no existing neighbourhood.
- Known limits: a pool can exceed 150 by up to 30 people; an isolated sparse area under 30 stays small.

## In-person handshake (implemented: `src/lib/trust`)

- Phone A gets a code `{userId, nonce, issuedAt, cellFine}` signed with HMAC-SHA256 using `HANDSHAKE_SECRET`.
- Phone B sends the code plus its own cell. It passes only if the signature is genuine, the code is under 30 seconds old, the nonce is unused, the users differ, and the cells are the same or touching (compared at the coarser resolution).
- Base version keeps used nonces in memory; Phase 4 stores them in the `vouches` table (unique nonce).

## Kavala Daily (implemented: `src/lib/daily`, `src/components/app/Games.tsx`)

- One ritual per neighbourhood per day; the day starts at 6:00 AM IST (`dailyKey`).
- Played like a daily puzzle: a hub with three game tiles, a clock in each game, a comic burst on a win, and a share card with coloured squares once all three are done.
- **Spot:** find a named local place on the map in up to 3 tries. Within 120 m solves it; otherwise a hint gives warmth (Hot to 300 m, Warm to 700 m, Cold to 1.5 km, then Freezing), the distance and a compass direction. Score uses the closest try. Points `round(1000 * exp(-d / 500))`, d in metres. Squares: green when found (to 120 m), yellow to 500 m, orange to 2 km, grey beyond.
- **Good Turn:** a neighbour's question in a speech bubble; mark the answer you'd trust or write a better one.
- **Quest:** a small real-world action (say hi to the newest neighbour, or visit today's Spot place). A check-in at a place is accepted only when the phone's cell is the place's cell or touches it (`verifyCheckin`).
- Then a result card and "See you tomorrow". Nothing more to scroll.
- **Bonus games** (`ChoiceGame` in `Games.tsx`, content in `src/lib/app/dailyContent.ts`): three optional one-tap rounds below the daily, the same for everyone each day. **Lingo**: what a common Malayalam word means. **Kochi Quiz**: one fact about Kochi. **Hood Poll**: a light question, then the vote split (sample numbers until real votes are stored). They show on the share card when played but don't count toward the daily being complete or the streak.

Spot places (implemented: `src/lib/daily/spotPlace.ts`): named public places (cafes, libraries, places of worship, bakeries and similar) fetched from OpenStreetMap through the Overpass API around the neighbourhood's centre, then picked by a hash of the neighbourhood ID and daily key, so the whole neighbourhood gets the same place. Places are fetched by the server route `/api/places?cell=<H3 cell>` (`src/app/api/places/route.ts`, `src/lib/daily/fetchPlaces.ts`), which takes only the neighbourhood cell, tries three public Overpass servers with a 12-second timeout each, doubles the radius once if nothing is found, and is cached for a day at the edge. If the server route fails, the browser asks Overpass directly with the neighbourhood centre (never the person's location). Every failure is shown with the reason, with retry and skip. The Spot map is capped at zoom 16 so place names aren't printed on the tiles.

## Trust levels and Thanks

| Action | Masked | Verified | Vouched | Watch |
| --- | --- | --- | --- | --- |
| Play, ask, answer, receive Thanks | Yes | Yes | Yes | Yes |
| Asks per day | 3 | 10 | 10 | 10 |
| Direct messages (mutual consent) | No | Yes | Yes | Yes |
| Reveal real name to chosen people | No | Yes | Yes | Yes |
| Host a meetup, vouch for someone | No | No | Yes | Yes |
| Review reports | No | No | No | Yes |

Thanks: +1 to an answer's author when the asker marks it useful. Game points never add to Thanks.

## Look and identity

- **Theme:** a friendly neighbourhood at night: navy streets, amber streetlights, teal for neighbours, comic-panel depth and a generic web motif for the threads between people. No Spider-Man names, logos, suits or characters: the nod stays in the tagline and the mask.
- **Splash** (`Splash.tsx`): an original night scene of a Kerala junction: backwaters and a houseboat, coconut palms, a tea shop (ചായക്കട), a green KAVALA road sign, festival lights, and an original masked hero on the roof. Then the Kavala logo and "Enter the kavala".
- **Profile or mask** (`Onboarding.tsx`): create a profile with Google, or go under a mask. Masks are original designs: Night watch, Web weaver, Kathakali, Pulikali tiger and Night owl (`Mask.tsx`). Hero names are Marvel-inspired with Kerala surnames (Peter Bhaskaran, Miles Mohan, Gwen George and others), with "Roll a name".
- **Neighbourhood map:** a flat OpenStreetMap map of the neighbourhood's hexagons. The earlier 3D view was removed.
- **Google sign-in** (`useGoogleAccount.ts`): optional, through Supabase Auth (PKCE). Counts as verified identity; the mask stays the public face and the real name is revealed only by choice.

## Data model

See `supabase/migrations/0001_init.sql`, `0002_accounts.sql` and `0003_neighbourhoods.sql`. No table stores a person's coordinates (`src/lib/privacy/privacy.test.ts` checks every migration), and every API that accepts JSON from a phone refuses bodies with coordinate keys at any depth (`src/lib/privacy/coordinates.ts`). Row-level security is on for every table with no public policies; the server uses the service-role key.

## Stack

Next.js 16 (App Router) with React 19 and TypeScript, plain CSS with theme tokens, Supabase (Postgres, Auth with Google sign-in), h3-js, Leaflet with OpenStreetMap tiles (attribution always shown), Vitest. Hosting on Vercel.

## Build status

| Area | Status |
| --- | --- |
| Location engine, beacon API, debug page | Done in base version |
| Neighbourhood rebalance, assignment, synthetic data, debug map | Done in base version |
| Handshake signing and verification, APIs, debug page | Done in base version |
| Daily scoring, day boundary, check-in rule | Done |
| App experience at `/`: join, Kavala Daily (Spot on real OpenStreetMap places, Help, Small step with verified check-in), result card, Ask with widening, Thanks, neighbourhood map, trust ladder | Done with sample neighbours; progress saved in the browser |
| Google sign-in (Supabase Auth) | Done; needs Supabase and Google OAuth setup |
| Accounts (anonymous or Google) and saved progress in `users` and `daily_plays` through `/api/me`, RLS, `my_neighbourhood_members()` | Done; needs Supabase and migration 0002 |
| Game experience: splash, profile or mask, games hub with Spot, Good Turn and Quest | Done |
| Night theme and neighbourhood map | Done (3D view removed) |
| Real neighbourhoods on the server: assignment in `/api/me`, nightly rebalance at `/api/hoods/rebalance`, real counts and board through `my_neighbourhood_stats/board` with sample fallback under 5 players | Done; needs Supabase, migration 0003 and `CRON_SECRET` |
| Real Ask and Thanks, Good Turn from real questions, QR handshake with stored nonces, Spot place cache | Next |
| Real QR scanning, vouches table, live room | Next (Phase 4) |
| Daily, Ask and Thanks saved in the database with real neighbours | Next (Phase 5) |
