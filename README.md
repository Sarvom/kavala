# Kavala

> **Your friendly neighbourhood, trying to do better, one small step at a time.**

A digital daily game that turns strangers within 5 km into a small, trusted neighbourhood, so people who move to a new city find help, friends and belonging without giving up their privacy.

**Built at Devin Hacks Kochi · Track 4: Make Room for Play**

---

## Why Kavala

Every Kerala town has a *kavala*, the junction where people bump into each other without planning to. That is where you hear when the waste collection comes, who fixes induction cookers fairly, and which mess serves the best meals.

People who move to a new city for work or study rarely get one. This is especially true for those renting independent houses or living in PGs, outside the apartment communities where a society group forms naturally. The local knowledge exists, but it lives in people's heads and in WhatsApp groups you only join if someone adds you. The result is a practical gap (no one to ask) and a social one (no one nearby to know).

Kavala rebuilds the kavala digitally: a small, playful daily habit that slowly turns the people around you into neighbours.

## How it works

Kavala runs on one simple loop:

1. **Play:** A short daily neighbourhood ritual, the same for everyone in your area. You finish it in a couple of minutes, and then the app says *see you tomorrow*.
2. **Help:** Neighbours ask questions and request small favours. Helping earns **karma**, your standing in the neighbourhood.
3. **Meet:** When enough nearby people share an interest, such as a turf match, gym buddies or a game night, Kavala suggests a real plan in a public place.
4. **Graduate:** The group moves to WhatsApp or wherever it likes. Kavala complements the apps people already use; it doesn't compete with them.

The game also builds the neighbourhood's knowledge. Daily challenges and quests come from the area itself, so playing teaches newcomers where things are and who to ask, and every quest adds to what the neighbourhood knows.

## Trust, the way real neighbourhoods build it

In a real neighbourhood, strangers become trusted through repeated presence, someone vouching for them, and a reputation they want to keep. Kavala turns each of these into a feature.

| Level | What it means | What you can do |
|---|---|---|
| **Masked** | Pseudonym and avatar; approximate area only | Play, answer questions, earn karma, join public meetups |
| **Verified** | Phone verified | Start direct messages with mutual consent; reveal yourself to one person or group at a time |
| **Vouched** | An existing neighbour vouched for you through an in-person QR handshake | Host meetups |
| **Watch** | A high-trust neighbour | Review reports, welcome new members |

- **Privacy is a choice, not all or nothing.** You can stay masked and still be useful, and karma carries over when you unmask.
- **Vouching has a cost.** If someone you vouched for is reported and the report is upheld, your own trust drops.
- **Neighbourhood Watch:** Reports are weighted by trust, flags are reviewed by a small jury of Watch members, and suspicious patterns are flagged automatically.
- **Local anchors** such as shopkeepers, PG owners and landlords are the first trusted members in a new area, as they often are offline.

## Design principles

- **Small by design.** Each neighbourhood is capped at about 150 people, around the number of relationships a person can actually maintain. In dense parts of a city, the area shrinks so faces stay recognisable. There are no followers and no viral reach.
- **A healthy habit, not an addiction.** A fixed daily dose with a natural stopping point. Streaks forgive missed days, and stepping outside earns more than screen time.
- **Scales out, not up.** Kavala grows as many separate small neighbourhoods, never as one big network.
- **Success means less screen time.** We measure meetups, questions answered and strangers who became trusted neighbours, not daily active users or time spent.

## Scope

**Base version (this hackathon)**
- Neighbourhoods formed automatically from location, with a size cap
- Masked and verified profiles
- The daily neighbourhood ritual
- Ask and help, with karma

**Next**
- In-person vouching with QR handshakes
- Neighbourhood Watch moderation
- Interest matching that turns into meetup plans
- Neighbourhood-vs-neighbourhood challenges
- Translation, so newcomers who don't speak the local language can still ask and answer

The data model is designed from day one to support these later features.

## Technical highlights

- **Location-based neighbourhoods** on a hexagonal grid, formed automatically by location and capped by population
- **A trust graph:** trust spreads through vouches, so rings of fake accounts that only vouch for each other stay at low trust
- **Proof of co-presence:** vouching requires an in-person handshake with matching location and time
- **Permissions by trust level:** what you can do depends on where you are on the trust ladder

---

## Project overview

- **Project name:** Kavala
- **Short description:** A digital daily game that turns strangers within 5 km into a small, trusted neighbourhood, so people who move to a new city find help, friends and belonging without giving up their privacy.
- **Team:** Govindaraman S (@Sarvom)
- **Working demo:** TODO: link or local demo instructions
- **Technology stack:** TODO: to be finalised with the prototype structure

### Run the project

Replace these placeholders with commands that work:

1. Prerequisites and versions: TODO
2. Dependency installation: TODO
3. Environment setup: TODO. List required variable names and provide a sanitized `.env.example`.
4. Start the project: TODO
5. Run checks or tests: TODO

### Current status

- Working features: TODO
- Known limitations: TODO
- Libraries, APIs and public datasets used: TODO. Include source links and attribution.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.

## Event clarification

Devin Hack Kochi has no major AI usage constraints. Participants may use Devin and other AI tools, models, and providers; this template does not require Codex or restrict AI usage to OpenAI. AI usage notes are project documentation, not an additional event eligibility requirement.

See [RULES.md](RULES.md) for the corrected event guidance.
