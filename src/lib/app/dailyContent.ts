/**
 * Rotating sample content for Kavala Daily: one Good Turn question and one
 * Quest per day, the same for everyone on that day. Every neighbour named here
 * is a labelled sample until real neighbours arrive with accounts.
 */

export interface Tip {
  id: string;
  by: string;
  text: string;
  /** Share of sample neighbours who picked this tip, in percent. */
  picked: number;
}

export interface GoodTurn {
  id: string;
  asker: string;
  question: string;
  tips: Tip[];
}

export interface Quest {
  id: string;
  title: string;
  detail: string;
  /** Sample neighbour shown on the card, if the quest involves one. */
  neighbour?: string;
}

export const GOOD_TURNS: GoodTurn[] = [
  {
    id: "induction",
    asker: "Wanda Warrier",
    question: "My induction cooker stopped heating this morning. Anyone know a repair person who comes home?",
    tips: [
      { id: "a", by: "Bruce Varghese", text: "The electronics shop near the bus stop repairs them, but you have to carry it there.", picked: 31 },
      { id: "b", by: "Carol Chacko", text: "Check the fuse in the plug first. Mine was just that. If not, the service centre on Market Road sends someone after 4 PM.", picked: 69 },
    ],
  },
  {
    id: "waste",
    asker: "Clint Kurian",
    question: "Just moved in. Which days does the waste collection come to our lane?",
    tips: [
      { id: "a", by: "Carol Chacko", text: "Tuesdays and Fridays around 8 AM. Plastic only if it's washed and dry.", picked: 74 },
      { id: "b", by: "Tony Thomas", text: "Ask your house owner, it changes every few months.", picked: 26 },
    ],
  },
  {
    id: "lunch",
    asker: "Stephen Sankar",
    question: "Cheap and good lunch meals near the library?",
    tips: [
      { id: "a", by: "Natasha Nair", text: "The mess opposite the station does a full meal for about ₹70. Go before 1 PM, the fish fry runs out.", picked: 58 },
      { id: "b", by: "Steve Sebastian", text: "The hotel next to the library is fine but a little costly.", picked: 17 },
      { id: "c", by: "Bruce Varghese", text: "The church canteen behind the library does meals on weekdays, ₹60.", picked: 25 },
    ],
  },
  {
    id: "wifi",
    asker: "Scott Mathew",
    question: "Which internet connection actually works in the rain here?",
    tips: [
      { id: "a", by: "Tony Thomas", text: "Fibre from the local cable operator. Mine didn't drop once last monsoon. Their office is above the pharmacy.", picked: 63 },
      { id: "b", by: "Wanda Warrier", text: "Just use your phone hotspot.", picked: 12 },
      { id: "c", by: "Clint Kurian", text: "The big brand broadband is okay but takes a week to install.", picked: 25 },
    ],
  },
  {
    id: "gas",
    asker: "Natasha Nair",
    question: "How do I get a cooking gas connection when I'm renting?",
    tips: [
      { id: "a", by: "Stephen Sankar", text: "Take your rent agreement and ID to the gas agency near the junction. They gave me one in two days.", picked: 71 },
      { id: "b", by: "Carol Chacko", text: "Borrow a cylinder from your house owner for now.", picked: 29 },
    ],
  },
  {
    id: "doctor",
    asker: "Steve Sebastian",
    question: "Any clinic nearby that's open on Sunday evenings?",
    tips: [
      { id: "a", by: "Wanda Warrier", text: "The family clinic near the temple opens 5 to 8 PM on Sundays. Get a token early.", picked: 66 },
      { id: "b", by: "Bruce Varghese", text: "Go to the big hospital casualty, they're always open.", picked: 34 },
    ],
  },
  {
    id: "cycle",
    asker: "Carol Chacko",
    question: "Where can I get my cycle serviced without waiting a week?",
    tips: [
      { id: "a", by: "Clint Kurian", text: "The small shop behind the mosque does it the same day if you drop it before 10.", picked: 55 },
      { id: "b", by: "Natasha Nair", text: "The showroom on the main road, but book online first.", picked: 45 },
    ],
  },
];

export const QUESTS: Quest[] = [
  { id: "hi-newest", title: "Say hi to Scott Mathew", detail: "The newest neighbour (sample) moved in yesterday.", neighbour: "Scott Mathew" },
  { id: "shop-name", title: "Learn one shopkeeper's name", detail: "Buy something small nearby and ask their name." },
  { id: "waste-day", title: "Find out your waste collection day", detail: "Ask a neighbour or your house owner." },
  { id: "save-number", title: "Save one useful local number", detail: "An auto stand, a gas agency or an electrician." },
  { id: "new-street", title: "Walk a street you've never taken", detail: "Ten minutes is enough. Notice one new shop." },
  { id: "tea-shop", title: "Try a tea shop you haven't been to", detail: "Say hello to whoever is at the counter." },
  { id: "thank-helper", title: "Thank someone who helped you this week", detail: "A guard, a shopkeeper, a neighbour. In person counts most." },
];

/** Small, stable string hash (FNV-1a). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Today's Good Turn question; the same for every player on the same day. */
export function goodTurnFor(dailyKey: string): GoodTurn {
  return GOOD_TURNS[hash(`turn|${dailyKey}`) % GOOD_TURNS.length];
}

/** Today's Quest; the same for every player on the same day. */
export function questFor(dailyKey: string): Quest {
  return QUESTS[hash(`quest|${dailyKey}`) % QUESTS.length];
}

const BOARD_NAMES = ["Tony Thomas", "Carol Chacko", "Bruce Varghese", "Wanda Warrier", "Natasha Nair", "Steve Sebastian"];

/** Sample leaderboard that changes each day, so the demo doesn't look frozen. */
export function sampleBoard(dailyKey: string): { name: string; points: number }[] {
  return BOARD_NAMES.map((name) => ({ name, points: 300 + (hash(`${name}|${dailyKey}`) % 680) }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
}
