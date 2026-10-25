# Kavala

> **Your friendly neighbourhood, trying to do better, one small step at a time.**

A digital daily game that turns nearby strangers into a small, trusted neighbourhood, so people who move to a new place find help, friends and belonging without giving up their privacy.

**Built at Devin Hack Kochi · Track 4: Make Room for Play**

[Event rules](RULES.md) · [Agent instructions](AGENTS.md) · [Changelog](CHANGELOG.md) · [AI usage](AI_USAGE.md) · [Submission](SUBMISSION.md)

---

## Why Kavala

Every Kerala town has a *kavala*, the junction where people bump into each other without planning to. That is where you hear when the waste collection comes, who fixes induction cookers fairly, and which mess serves the best meals.

People who move to a new city for work or study rarely get one. This is especially true for those renting independent houses or living in PGs, outside the apartment communities where a society group forms naturally. The local knowledge exists, but it lives in people's heads and in WhatsApp groups you only join if someone adds you. The result is a practical gap (no one to ask) and a social one (no one nearby to know).

Kavala rebuilds the kavala digitally: a small, playful daily habit that slowly turns the people around you into neighbours.

## How it works

Kavala runs on one simple loop:

1. **Play:** A short daily neighbourhood ritual, the same for everyone in your area. You finish it in a couple of minutes, and then the app says *see you tomorrow*.
2. **Help:** Neighbours ask questions and request small favours. When a neighbour finds your help useful, you receive **Thanks**, your standing in the neighbourhood.
3. **Meet:** When enough nearby people share an interest, such as a turf match, gym buddies or a game night, Kavala suggests a real plan in a public place.
4. **Graduate:** The group moves to WhatsApp or wherever it likes. Kavala complements the apps people already use; it doesn't compete with them.

The game also builds the neighbourhood's knowledge. Daily challenges and quests come from the area itself, so playing teaches newcomers where things are and who to ask, and every quest adds to what the neighbourhood knows.

## Trust, the way real neighbourhoods build it

In a real neighbourhood, strangers become trusted through repeated presence, someone vouching for them, and a reputation they want to keep. Kavala turns each of these into a feature.

| Level | What it means | What you can do |
|---|---|---|
| **Masked** | Pseudonym and avatar; approximate area only | Play, answer questions, receive Thanks, join public meetups |
| **Verified** | Phone verified | Start direct messages with mutual consent; reveal yourself to one person or group at a time |
| **Vouched** | An existing neighbour vouched for you through an in-person QR handshake | Host meetups |
| **Watch** | A high-trust neighbour | Review reports, welcome new members |

- **Privacy is a choice, not all or nothing.** You can stay masked and still be useful, and your Thanks carry over when you unmask.
- **Vouching has a cost.** If someone you vouched for is reported and the report is upheld, your own trust drops.
- **Neighbourhood Watch:** Reports are weighted by trust, flags are reviewed by a small jury of Watch members, and suspicious patterns are flagged automatically.
- **Local anchors** such as shopkeepers, PG owners and landlords are the first trusted members in a new area, as they often are offline.

## Design principles

- **Small by design, measured in people, not kilometres.** Each neighbourhood holds about 150 people at most, around the number of relationships a person can actually maintain. In dense parts of a city, the area shrinks so faces stay recognisable. In sparse towns and villages, it grows until there are enough people to be useful. There are no followers and no viral reach.
- **Inclusive by default.** Where shops and services are far away, a neighbourhood links to its nearest town junction, its *kavala*. Questions widen step by step from your neighbours to nearby areas to that town. The app is lightweight for older phones and weak connections, and Malayalam, Hindi and English are planned.
- **A healthy habit, not an addiction.** A fixed daily dose with a natural stopping point. Streaks forgive missed days, and stepping outside earns more than screen time.
- **Scales out, not up.** Kavala grows as many separate small neighbourhoods, never as one big network.
- **Success means less screen time.** We measure meetups, questions answered and strangers who became trusted neighbours, not daily active users or time spent.

## Scope

**Base version (this hackathon)**
- Adaptive neighbourhoods formed automatically from location (they grow in sparse areas and shrink in dense ones)
- Masked and verified profiles
- The daily neighbourhood ritual
- Ask and help, with Thanks

**Next**
- In-person vouching with QR handshakes
- Neighbourhood Watch moderation
- Interest matching that turns into meetup plans
- Neighbourhood-vs-neighbourhood challenges
- Translation, so newcomers who don't speak the local language can still ask and answer

The data model is designed from day one to support these later features.

## Technical highlights

- **Precise on the phone, private on the server:** the phone filters and smooths GPS, picks a hexagon size that matches its accuracy, and sends only H3 cell IDs; the API refuses raw coordinates
- **Adaptive neighbourhoods** on a hexagonal grid: cells merge in sparse areas and split in dense ones, so each neighbourhood has a workable number of people
- **A trust graph:** trust spreads through vouches, so rings of fake accounts that only vouch for each other stay at low trust
- **Proof of co-presence:** vouching requires an in-person handshake with matching location and time
- **Permissions by trust level:** what you can do depends on where you are on the trust ladder

---

## Project overview

- **Origin:** the application code in this repository was first built in [Sarvom/kavala-v1](https://github.com/Sarvom/kavala-v1) (by Claude, Anthropic) and ported here from commit `7086937a17915d6c8734d416cf77ea0cd1260a8e` by Devin. See [CHANGELOG.md](CHANGELOG.md) and [AI_USAGE.md](AI_USAGE.md) for the record.

- **Project name:** Kavala
- **Short description:** A digital daily game that turns nearby strangers into a small, trusted neighbourhood, so people who move to a new place find help, friends and belonging without giving up their privacy.
- **Team:** Govindaraman S (@Sarvom)
- **Working demo:** https://kavala-sigma.vercel.app (Vercel project for this repository; see "Deploy on Vercel" below if it shows 404)
- **Technology stack:** Next.js 16 (App Router) with React 19 and TypeScript, Supabase (Postgres and Auth with Google sign-in), h3-js, Leaflet with OpenStreetMap tiles, Vitest. Full specification in [docs/SPEC.md](docs/SPEC.md).

### Run the project

1. **Prerequisites:** Node.js 20 or newer (`node -v`) and Git.
2. **Install:** `npm install`
3. **Environment:** copy `.env.example` to `.env.local`. Everything runs without values: the beacon API then says nothing was stored, handshakes use a temporary local secret, and the Google button explains that sign-in isn't set up yet. Set `HANDSHAKE_SECRET` (32+ characters) before deploying, and the two `NEXT_PUBLIC_SUPABASE_*` values to turn on Google sign-in.
4. **Start:** `npm run dev`, then open http://localhost:3000
5. **Checks:** `npm test` (unit tests), `npm run typecheck`, `npm run build`
6. **Synthetic neighbourhoods:** `npm run synthetic -- 3000` prints how 3,000 fake residents around Kochi split into neighbourhoods.

Phones only share GPS with pages served over HTTPS (or localhost), so test the location page on a phone through the deployed Vercel link.

### Deploy on Vercel

`vercel.json` pins the framework to Next.js (`"framework": "nextjs"`, build `npm run build`, output `.next`). This matters because the Vercel project was imported while this repository held only the organisers' template documents, so Vercel guessed the "Other" preset and served the `public/` folder as a static site: every page, including `/`, answered **404 NOT_FOUND**. The pinned framework overrides that guess on the next deployment. If a 404 ever comes back, check in Vercel → Project → Settings → Build and Deployment that **Framework Preset** is Next.js, **Root Directory** is empty, the **Output Directory** override is off, and **Production Branch** (Settings → Environments) is `main`; then redeploy. Copy the environment variables from `.env.example` into Vercel → Settings → Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HANDSHAKE_SECRET`, `CRON_SECRET`, `DEMO_MODE`).

### Accounts and saved progress

With Supabase connected, progress (mask, hero name, home hexagon, neighbourhood, Thanks, streaks and each day's results) is saved to an account through `/api/me`. There are two kinds of account:

- **Masked (anonymous):** the app signs the phone in anonymously, with no name or email, so progress survives a cleared browser. This needs **Authentication → Sign In / Providers → Anonymous sign-ins** switched on in Supabase. If it is off, masked play keeps progress on the phone only and Me offers Google sign-in to save it.
- **Google:** counts as verified. "Continue with Google" links the anonymous account when **Authentication → Sign In / Providers → Allow manual linking** is on, so nothing is lost; otherwise it signs in afresh and copies this phone's progress into the new account.

Apply `supabase/migrations/0002_accounts.sql`, `0003_neighbourhoods.sql` and `0004_puzzles.sql` after `0001_init.sql` (Supabase → SQL editor, paste, run, one file at a time). Row-level security lets a person read and write only their own rows; the `my_neighbourhood_members()` function returns mask names only.

### Real neighbourhoods

With Supabase connected, the server assigns each joined person to a neighbourhood from their resolution-9 home cell (`src/lib/hood/server.ts`, using the same engine as `/debug/hoods`) and saves it in `neighbourhoods`. A nightly job, `/api/hoods/rebalance` (scheduled in `vercel.json` at 02:30 IST), regroups everyone so neighbourhoods stay sized by people. It needs `CRON_SECRET` set in Vercel; the same secret lets you run it on demand: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/hoods/rebalance`.

The Map, Play and Ask screens show real member counts, how many played today and the real leaderboard (masks only, through the `my_neighbourhood_stats` and `my_neighbourhood_board` database functions in `0003_neighbourhoods.sql`) once a neighbourhood has 5 players. Below that they show the labelled sample content, with a note of how many real players there are so far.

### Google sign-in setup

Google sign-in runs through Supabase Auth. Menu names may differ slightly between dashboard versions.

1. **Supabase:** open Authentication, then the Google provider, and enable it. Copy the callback URL it shows (`https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Google Cloud Console:** create a project and set up the OAuth consent screen (External, app name Kavala, your support email; add yourself as a test user while the app is in testing). Then create an OAuth client ID of type Web application with:
   - Authorized JavaScript origins: your Vercel URL and `http://localhost:3000`
   - Authorized redirect URI: the Supabase callback URL from step 1
3. **Supabase:** paste the Google client ID and secret into the Google provider and save. Under URL configuration, set the Site URL to your Vercel URL and add your Vercel URL and `http://localhost:3000` as redirect URLs.
4. **Vercel:** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy.

Signing in links a Google profile to the mask. Neighbours still see the mask name; the Google name is shown only to people the user chooses to reveal it to. The profile row in `users` stores the mask, home cell and progress, not the Google name or email (those stay in Supabase Auth).

### Try it on a phone

1. Open the Vercel link in Chrome (Android) or Safari (iPhone).
2. Add it to the home screen (Chrome: menu, then Add to Home screen; Safari: Share, then Add to Home Screen). It then opens full screen with the Kavala icon.
3. Tap Enter the kavala, go under a mask, choose Use my location (or the demo spot in Kochi), and play the three games.
4. To start again, open Me and tap Start over.

### Pages

| Page | What it shows |
| --- | --- |
| `/` | The game, in a Duolingo-style chunky 3D look with the Kavala logos (dark by default; switch to light in Me): a splash with the 3D emblem, then create a profile with Google or go under a mask (original masks, Marvel-inspired hero names), then **Today**, a path of four steps: **Web Weave** (draw one thread through every square, passing the numbered anchors in order), **Pookkalam** (one flower per row, column and colour patch, none touching), **Good Turn** (help a neighbour) and **Quest** (one small step outside). The puzzles are generated on the phone from the date, so everyone gets the same one each day. Below the path, four optional games: **Pakal–Raavu** (balance suns and moons), Lingo (a Malayalam word), Kochi Quiz and Hood Poll; they don't affect the streak. Games open full screen and end on a result sheet; unfinished puzzles keep your work. Then confetti and a share card (native share sheet on phones, or WhatsApp), the leaderboard by puzzle points, Ask with widening, your neighbourhood map and the trust ladder. Sample neighbours stand in for real ones until a neighbourhood has 5 players |
| `/api/places?cell=` | Named public places around a neighbourhood cell, from OpenStreetMap through three Overpass servers. Kept for the engine record; the app no longer calls it since Spot was retired |
| `/api/me` | A signed-in person's saved profile and today's results (`GET`), and saving them (`PUT`, which also assigns the neighbourhood). Needs a Supabase bearer token; refuses any body that contains coordinates |
| `/api/hoods/rebalance` | Nightly neighbourhood rebalance (Vercel cron, `CRON_SECRET` bearer); `POST` with the same header runs it now |
| `/engine` | Overview of the engine pages below |
| `/debug/location` | Live GPS accuracy, the chosen hexagon level, your cells on an OpenStreetMap map, and the exact request sent to the server |
| `/debug/hoods` | Synthetic residents grouped into neighbourhoods; small hexagons in the dense centre, large ones at the edges |
| `/debug/handshake` | Signed codes that expire in 30 seconds, work once and fail when the phones are far apart |

### Current status

- **Working features:** Duolingo-style 3D interface (depth buttons and cards, a path of round nodes, result sheets, confetti, Nunito type, Kavala logos), dark by default with a light theme in Me; three daily logic puzzles with unique answers (Web Weave, Pookkalam, Pakal–Raavu) scored by solve time; bonus games (Lingo, Kochi Quiz, Hood Poll) and a daily rotation of Good Turn questions and Quests; accounts and saved progress through Supabase (anonymous or Google) with puzzle points saved per day; real neighbourhood counts and board once a neighbourhood has 5 players; add to home screen with the Kavala app icon; location engine with accuracy gate, speed check, smoothing and adaptive resolution; beacon and `/api/me` refuse coordinates; neighbourhood rebalancing with split and pooling; handshake signing and verification with APIs; 6 AM day boundary; database schema with row-level security.
- **Known limitations:** accounts and saved progress need Supabase connected and migrations 0002 to 0004 applied (without them the app keeps progress in the browser; without 0004 puzzle points aren't saved to the account); questions and answers are still clearly labelled sample content, and so are counts and the leaderboard until a neighbourhood has 5 real players; a daily played on one phone shows as not played on a second phone (results, not boards, are saved); Thanks are still only earned from sample neighbours until Ask is live; **Spot** (find a real place on the map) was retired from the daily on 25 October 2026 because the public Overpass servers it relies on often refuse requests from the hosting provider, so it couldn't be demonstrated reliably; handshake nonces are kept in memory; the handshake page simulates phone positions; a pooled neighbourhood can exceed 150 by up to 30 people.
- **Libraries, APIs and data:** [Next.js](https://nextjs.org), [h3-js](https://github.com/uber/h3-js) (Uber H3, Apache 2.0), [Leaflet](https://leafletjs.com) (BSD 2-Clause), map tiles and data [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL), the [Overpass API](https://overpass-api.de) (engine route only), [Supabase JS](https://github.com/supabase/supabase-js) (Auth with Google), the [Nunito](https://fonts.google.com/specimen/Nunito) and [Noto Sans Malayalam](https://fonts.google.com/noto/specimen/Noto+Sans+Malayalam) (for the Lingo word game) fonts (SIL Open Font License), bundled with the app through [Fontsource](https://fontsource.org), [Vitest](https://vitest.dev). Logos from the Kavala brand pack (`public/brand/`, favicons and PWA icons). Puzzle mechanics are inspired by daily logic puzzles such as LinkedIn's games and the look by Duolingo; names, art and code are Kavala's own. Synthetic residents are generated locally and are not real people.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.

## Event clarification

Devin Hack Kochi has no major AI usage constraints. Participants may use Devin and other AI tools, models, and providers; this template does not require Codex or restrict AI usage to OpenAI. AI usage notes are project documentation, not an additional event eligibility requirement.

See [RULES.md](RULES.md) for the corrected event guidance.
