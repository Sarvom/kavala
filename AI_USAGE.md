# AI usage record

If maintaining this record, briefly document the actual contributions of whichever AI tools you use at Devin Hack Kochi. Add a row after each meaningful task or milestone. Keep summaries concise and omit secrets, private data, and full chat transcripts.

## Event build log

Mark human review as pending until someone has reviewed the contribution. Rows marked "in Sarvom/kavala-v1" were recorded in that repository while the prototype was built there and are carried over unchanged by the port.

| Date and time with timezone | Tool / model, if known | Task | Assistance and affected files | Human review / corrections | Validation and result |
| --- | --- | --- | --- | --- | --- |
| 2026-10-25T05:46:24+05:30 | Claude (Anthropic), Claude Opus 5.5 | Daily puzzle engine; Spot retired from the path | Wrote `src/lib/puzzles/*` (generators, validators, scoring, tests), puzzle state and points in `state.ts`/`live.ts`/`sync.ts`, `supabase/migrations/0004_puzzles.sql`, `/api/me` fallback and `src/lib/supabase/errors.ts`; updated tests | Pending review by Govindaraman S | 115 tests and typecheck passed; 365-day uniqueness sweep passed |
| 2026-10-25T05:28:10+05:30 | Claude (Anthropic), Claude Opus 5.5 | Fix the Vercel 404 and bring over kavala-v1's bonus games | Diagnosed the 404, wrote the `vercel.json` framework pin and `src/lib/deploy/vercel.test.ts`; applied kavala-v1 `7086937..f2bdc6a` (bonus games Lingo, Kochi Quiz, Hood Poll; tab order) as a three-way patch and resolved the `GameHub.tsx` import conflict; README, SPEC and CHANGELOG updates | Pending review by Govindaraman S | 90 tests, typecheck and build passed; headless phone-size walk through the hub and a bonus game; live Vercel deployment not reachable from the build machine |
| 2026-10-25T04:56:29+05:30 | Devin (Cognition) | Real neighbourhoods (Phase 1 item 3) | Wrote `src/lib/hood/server.ts`, `src/app/api/hoods/rebalance/route.ts`, `vercel.json`, `supabase/migrations/0003_neighbourhoods.sql`, `src/lib/app/live.ts`, `useLiveHood.ts`, server-side assignment in `/api/me`, hood take-over in `useCloudSave.ts`, real-or-sample UI in `GameHub.tsx`/`HoodView.tsx`/`AskView.tsx`, tests `server.test.ts` and `live.test.ts`, README/SPEC/CHANGELOG/.env.example updates | Pending review by Govindaraman S | 84 tests, typecheck and build passed; not yet run against a live Supabase project |
| 2026-10-25T04:46:53+05:30 | Devin (Cognition) | Accounts and saved progress (Phase 1 items 1, 2, 7) | Wrote `src/lib/privacy/coordinates.ts`, `src/lib/app/sync.ts`, `useCloudSave.ts`, `src/lib/supabase/auth.ts`, `src/app/api/me/route.ts`, `supabase/migrations/0002_accounts.sql`, the anonymous sign-in and Google linking in `useGoogleAccount.ts`, `linkAccount` in `state.ts`, UI copy in `MeView.tsx`/`Onboarding.tsx`, tests `sync.test.ts` and `privacy.test.ts`, README/SPEC/CHANGELOG/.env.example updates | Pending review by Govindaraman S | 79 tests, typecheck and build passed; not yet run against a live Supabase project |
| 2026-10-25T04:38:08+05:30 | Devin (Cognition) | Audit of the ported prototype | Played the app at phone size (390×844, 360×640) and the debug pages; wrote `docs/AUDIT.md` and this record. No application code changed | Pending review by Govindaraman S | Play-through completed at both sizes with a stand-in places response; baseline 66 tests, typecheck and build unchanged |
| 2026-10-25T04:18:07+05:30 | Devin (Cognition) | Port the Kavala prototype from Sarvom/kavala-v1 @ 7086937 into this repository | Copied `src/`, `public/`, `scripts/`, `supabase/`, `docs/` and the config files unchanged; merged `README.md` (organiser sections kept); added this row and the carried-over rows below; added a `CHANGELOG.md` entry; `.gitignore` gained `*.tsbuildinfo`. No application code written in this step | Pending review by Govindaraman S | `npm ci`, `npm test` (66 tests passed), `npm run typecheck` and `npm run build` passed in this repository |
| 2026-10-25T02:35:29+05:30 | Claude (Anthropic), Claude Opus 5.5, in Sarvom/kavala-v1 | Demo polish for phones | Played through the app at phone size, then wrote full-screen games, saved Spot progress, daily Good Turn and Quest rotation, bundled fonts, manifest and icons, share sheet, Google provider check, fixes for daily numbering, squares and burst text, tests and doc updates | Pending review by Govindaraman S | 66 unit tests, type check, production build and dependency audit passed; headless phone-size play-through passed; live Spot and real phone not yet checked |
| 2026-10-25T02:12:30+05:30 | Claude (Anthropic), Claude Opus 5.5, in Sarvom/kavala-v1 | Game experience, original masks, Spot fix | Wrote the splash, onboarding, games hub and games, mask designs, Spot hints, the places server route with fallbacks, tests and doc updates; removed the 3D view | Pending review by Govindaraman S | 59 unit tests, type check and production build passed; screenshots checked locally; live Spot round not yet checked on the deployment |
| 2026-10-25T01:43:07+05:30 | Claude (Anthropic), Claude Opus 5.5, in Sarvom/kavala-v1 | 3D neighbourhood, night theme, Google sign-in, Next.js 16 upgrade | Wrote the 3D scene and geometry helpers, theme, Google sign-in flow, account linking and tests; upgraded Next.js and React; updated README, SPEC, CHANGELOG | Pending review by Govindaraman S | 57 unit tests, type check, production build and production dependency audit passed; local smoke tests passed; Google sign-in and 3D view not yet tested on a real device |
| 2026-10-25T01:27:59+05:30 | Claude (Anthropic), Claude Opus 5.5, in Sarvom/kavala-v1 | App experience with a sample daily | Wrote the app UI (`src/components/app/`), app state and Spot place logic (`src/lib/app/`, `src/lib/daily/spotPlace.ts`), tests, styles, README, SPEC and CHANGELOG updates | Pending review by Govindaraman S | 51 unit tests, type check and production build passed; local page smoke test passed; not yet tested on a real phone |
| 2026-10-25T00:31:07+05:30 | Claude (Anthropic), Claude Opus 5.5, in Sarvom/kavala-v1 | Product brainstorm, specification and base version | Wrote all application code, tests, schema and docs in this commit: `src/`, `scripts/`, `supabase/`, `docs/SPEC.md`, `README.md`, config files | Pending review by Govindaraman S | 41 unit tests, type check and production build passed; local API smoke tests passed; not yet tested on a real phone |

## Template preparation

This historical preparation note refers to the older template. It does not define Devin Hack Kochi's event rules or AI tool requirements.

On 10 October 2026, Codex prepared this documentation template from the organizer's supplied rules and checked the linked Luma page for the event name and dates. This covered `README.md`, `RULES.md`, `AGENTS.md`, `CHANGELOG.md`, `AI_USAGE.md`, `SUBMISSION.md`, `.gitignore`, and the pull request checklist. Agent validation covered local links, event consistency, required documents, and diff whitespace; organizer review is pending.

This preparation is separate from participant project implementation and participant AI usage during the event.

## Event documentation correction — 2026-10-24T21:53:05+05:30

- Tool: Codex.
- Task: correct the organizer-shared template to Devin Hack Kochi and clarify
  that the event has no major AI usage constraints.
- Affected files: `.github/pull_request_template.md`, `AGENTS.md`, `AI_USAGE.md`, `CHANGELOG.md`, `README.md`, `RULES.md`, `SUBMISSION.md`.
- Human review: pending maintainer review of this pull request.
- Validation: documentation diff, whitespace, and local Markdown link checks;
  no application code changed and no runtime checks were needed.
