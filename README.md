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
- **Working demo:** TODO: Vercel link for this repository (the earlier prototype deployment points at `Sarvom/kavala-v1`; a Vercel project for `Sarvom/kavala` is being set up)
- **Technology stack:** Next.js 16 (App Router) with React 19 and TypeScript, Supabase (Postgres and Auth with Google sign-in), h3-js, Leaflet with OpenStreetMap tiles, Vitest. Full specification in [docs/SPEC.md](docs/SPEC.md).

### Run the project

1. **Prerequisites:** Node.js 20 or newer (`node -v`) and Git.
2. **Install:** `npm install`
3. **Environment:** copy `.env.example` to `.env.local`. Everything runs without values: the beacon API then says nothing was stored, handshakes use a temporary local secret, and the Google button explains that sign-in isn't set up yet. Set `HANDSHAKE_SECRET` (32+ characters) before deploying, and the two `NEXT_PUBLIC_SUPABASE_*` values to turn on Google sign-in.
4. **Start:** `npm run dev`, then open http://localhost:3000
5. **Checks:** `npm test` (unit tests), `npm run typecheck`, `npm run build`
6. **Synthetic neighbourhoods:** `npm run synthetic -- 3000` prints how 3,000 fake residents around Kochi split into neighbourhoods.

Phones only share GPS with pages served over HTTPS (or localhost), so test the location page on a phone through the deployed Vercel link.

### Accounts and saved progress

With Supabase connected, progress (mask, hero name, home hexagon, neighbourhood, Thanks, streaks and each day's results) is saved to an account through `/api/me`. There are two kinds of account:

- **Masked (anonymous):** the app signs the phone in anonymously, with no name or email, so progress survives a cleared browser. This needs **Authentication → Sign In / Providers → Anonymous sign-ins** switched on in Supabase. If it is off, masked play keeps progress on the phone only and Me offers Google sign-in to save it.
- **Google:** counts as verified. "Continue with Google" links the anonymous account when **Authentication → Sign In / Providers → Allow manual linking** is on, so nothing is lost; otherwise it signs in afresh and copies this phone's progress into the new account.

Apply `supabase/migrations/0002_accounts.sql` after `0001_init.sql` (Supabase → SQL editor, paste, run). Row-level security lets a person read and write only their own rows; the `my_neighbourhood_members()` function returns mask names only.

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
| `/` | The game: a Kerala night splash, then create a profile with Google or go under a mask (original masks, Marvel-inspired hero names), then Kavala Daily with three games: Spot (find a real OpenStreetMap place in 3 tries with hot-and-cold hints), Good Turn (help a neighbour) and Quest (one small step outside, with a location-verified check-in). Games open full screen; Spot keeps your guesses if you close it; Good Turn and Quest change every day. Then a share card (native share sheet on phones, or WhatsApp), the leaderboard, Ask with widening, your neighbourhood map and the trust ladder. Sample neighbours stand in for real ones; progress is saved in your browser only |
| `/api/places?cell=` | Named public places around a neighbourhood cell for Spot, from OpenStreetMap through three Overpass servers |
| `/api/me` | A signed-in person's saved profile and today's results (`GET`), and saving them (`PUT`). Needs a Supabase bearer token; refuses any body that contains coordinates |
| `/engine` | Overview of the engine pages below |
| `/debug/location` | Live GPS accuracy, the chosen hexagon level, your cells on an OpenStreetMap map, and the exact request sent to the server |
| `/debug/hoods` | Synthetic residents grouped into neighbourhoods; small hexagons in the dense centre, large ones at the edges |
| `/debug/handshake` | Signed codes that expire in 30 seconds, work once and fail when the phones are far apart |

### Current status

- **Working features:** game experience (splash, profile or mask, full-screen games with timers, comic win bursts and a share card); Spot guesses and clock saved so closing the game can't reset the tries; a daily rotation of Good Turn questions (with a reveal of which tip sample neighbours trusted) and Quests; Spot place lists cached on the phone for a week as a fallback when OpenStreetMap is busy; add to home screen with an app icon; Google sign-in offered only when Supabase reports the Google provider is on; Spot places through a server route with three Overpass servers and a browser fallback; optional Google sign-in through Supabase Auth; app experience at `/` (join, Kavala Daily with real OpenStreetMap places, verified check-in, result card and WhatsApp share, Ask with widening, Thanks, neighbourhood map, trust ladder, reveal controls); location engine with accuracy gate, speed check, smoothing and adaptive resolution; beacon API that refuses coordinates; neighbourhood rebalancing with split and pooling; neighbourhood assignment; handshake signing and verification with APIs; daily scoring, 6 AM day boundary and check-in rule; database schema with row-level security.
- **Known limitations:** accounts and saved progress need Supabase connected and migration 0002 applied (without them the app keeps progress in the browser); neighbours, questions, counts and the leaderboard are still clearly labelled sample content; a daily played on one phone shows as not played on a second phone (results, not the map, are saved); Thanks are still only earned from sample neighbours until Ask is live; Spot places come from the public Overpass API, which can be slow or unavailable (Spot shows the reason and offers retry or skip); handshake nonces are kept in memory, so they reset on restart and are not shared between server instances; the handshake page simulates phone positions; a pooled neighbourhood can exceed 150 by up to 30 people.
- **Libraries, APIs and data:** [Next.js](https://nextjs.org), [h3-js](https://github.com/uber/h3-js) (Uber H3, Apache 2.0), [Leaflet](https://leafletjs.com) (BSD 2-Clause), map tiles and data [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL), Spot places from the [Overpass API](https://overpass-api.de), [Supabase JS](https://github.com/supabase/supabase-js) (Auth with Google), the [Bangers](https://fonts.google.com/specimen/Bangers), [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) and [Noto Sans Malayalam](https://fonts.google.com/noto/specimen/Noto+Sans+Malayalam) fonts (SIL Open Font License), bundled with the app through [Fontsource](https://fontsource.org), [Vitest](https://vitest.dev). Synthetic residents are generated locally and are not real people.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.

## Event clarification

Devin Hack Kochi has no major AI usage constraints. Participants may use Devin and other AI tools, models, and providers; this template does not require Codex or restrict AI usage to OpenAI. AI usage notes are project documentation, not an additional event eligibility requirement.

See [RULES.md](RULES.md) for the corrected event guidance.
