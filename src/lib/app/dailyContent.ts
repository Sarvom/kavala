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

/** Bonus games: quick one-tap rounds that don't count toward the daily or the streak. */
export type BonusKind = "lingo" | "quiz" | "poll";

export interface Choice {
  id: string;
  text: string;
  /** Poll only: share of sample neighbours who picked this, in percent. */
  picked?: number;
}

export interface ChoiceRound {
  id: string;
  prompt: string;
  /** Shown under the prompt, such as a word's pronunciation. */
  detail?: string;
  choices: Choice[];
  /** The right choice; polls have none. */
  answer?: string;
  /** Shown after answering. */
  note?: string;
}

/** Malayalam words heard every day around a kavala. */
export const LINGO: ChoiceRound[] = [
  { id: "kavala", prompt: "കവല", detail: "kavala", answer: "b", note: "The town junction this app is named after.",
    choices: [{ id: "a", text: "Market" }, { id: "b", text: "Junction" }, { id: "c", text: "Bus stop" }] },
  { id: "chaaya", prompt: "ചായ", detail: "chaaya", answer: "a", note: "A tea shop is a ചായക്കട (chaayakkada).",
    choices: [{ id: "a", text: "Tea" }, { id: "b", text: "Rice" }, { id: "c", text: "Shade" }] },
  { id: "nanni", prompt: "നന്ദി", detail: "nanni", answer: "c", note: "Say it to whoever helped you today.",
    choices: [{ id: "a", text: "Hello" }, { id: "b", text: "Sorry" }, { id: "c", text: "Thank you" }] },
  { id: "chettan", prompt: "ചേട്ടൻ", detail: "chettan", answer: "b", note: "Also a polite way to address an older man, like the auto driver.",
    choices: [{ id: "a", text: "Uncle" }, { id: "b", text: "Elder brother" }, { id: "c", text: "Friend" }] },
  { id: "chechi", prompt: "ചേച്ചി", detail: "chechi", answer: "a", note: "Also a polite way to address an older woman.",
    choices: [{ id: "a", text: "Elder sister" }, { id: "b", text: "Mother" }, { id: "c", text: "Teacher" }] },
  { id: "kada", prompt: "കട", detail: "kada", answer: "c", note: "A small shop, often the heart of a lane.",
    choices: [{ id: "a", text: "Road" }, { id: "b", text: "Door" }, { id: "c", text: "Shop" }] },
  { id: "mazha", prompt: "മഴ", detail: "mazha", answer: "b", note: "Kerala's monsoon arrives around June.",
    choices: [{ id: "a", text: "Wind" }, { id: "b", text: "Rain" }, { id: "c", text: "River" }] },
  { id: "ethra", prompt: "എത്ര?", detail: "ethra?", answer: "a", note: "Handy at any shop counter.",
    choices: [{ id: "a", text: "How much?" }, { id: "b", text: "Where?" }, { id: "c", text: "When?" }] },
  { id: "naale", prompt: "നാളെ", detail: "naale", answer: "c", note: "Today is ഇന്ന് (innu).",
    choices: [{ id: "a", text: "Yesterday" }, { id: "b", text: "Now" }, { id: "c", text: "Tomorrow" }] },
  { id: "vellam", prompt: "വെള്ളം", detail: "vellam", answer: "b", note: "Ask for chooduvellam for warm drinking water.",
    choices: [{ id: "a", text: "Milk" }, { id: "b", text: "Water" }, { id: "c", text: "White" }] },
];

/** Facts about Kochi, the demo city. */
export const QUIZ: ChoiceRound[] = [
  { id: "metro", prompt: "In which year did Kochi Metro open its first line?", answer: "b", note: "The first stretch opened in June 2017.",
    choices: [{ id: "a", text: "2012" }, { id: "b", text: "2017" }, { id: "c", text: "2021" }] },
  { id: "airport", prompt: "Kochi's airport was the world's first fully powered by…", answer: "c", note: "Cochin International Airport went fully solar in 2015.",
    choices: [{ id: "a", text: "Wind" }, { id: "b", text: "Tidal power" }, { id: "c", text: "Solar power" }] },
  { id: "nets", prompt: "Where are Kochi's famous Chinese fishing nets?", answer: "a", note: "They line the shore at Fort Kochi.",
    choices: [{ id: "a", text: "Fort Kochi" }, { id: "b", text: "Kakkanad" }, { id: "c", text: "Edappally" }] },
  { id: "dutch-palace", prompt: "Mattancherry Palace is also known as the…", answer: "b", note: "Built by the Portuguese, later renovated by the Dutch.",
    choices: [{ id: "a", text: "Hill Palace" }, { id: "b", text: "Dutch Palace" }, { id: "c", text: "Bolgatty Palace" }] },
  { id: "water-metro", prompt: "Kochi Water Metro started carrying passengers in…", answer: "c", note: "Its electric boats began service in April 2023.",
    choices: [{ id: "a", text: "2015" }, { id: "b", text: "2019" }, { id: "c", text: "2023" }] },
  { id: "biennale", prompt: "The first Kochi-Muziris Biennale was held in…", answer: "a", note: "It opened in December 2012.",
    choices: [{ id: "a", text: "2012" }, { id: "b", text: "2002" }, { id: "c", text: "2020" }] },
  { id: "synagogue", prompt: "The Paradesi Synagogue is in which part of Kochi?", answer: "b", note: "It stands in Jew Town, Mattancherry, built in 1568.",
    choices: [{ id: "a", text: "Vyttila" }, { id: "b", text: "Mattancherry" }, { id: "c", text: "Kaloor" }] },
  { id: "vasco", prompt: "Vasco da Gama was first buried in which Fort Kochi church?", answer: "c", note: "His remains were later taken to Portugal.",
    choices: [{ id: "a", text: "Santa Cruz Basilica" }, { id: "b", text: "Vallarpadam Basilica" }, { id: "c", text: "St. Francis Church" }] },
];

/** Light questions for the neighbourhood. Shares are sample numbers until real votes arrive. */
export const POLLS: ChoiceRound[] = [
  { id: "chai-time", prompt: "Best time for a chai at the kavala?",
    choices: [{ id: "a", text: "Early morning", picked: 34 }, { id: "b", text: "4 PM", picked: 48 }, { id: "c", text: "After dinner", picked: 18 }] },
  { id: "commute", prompt: "How do you usually get to the city?",
    choices: [{ id: "a", text: "Bus", picked: 37 }, { id: "b", text: "Metro", picked: 22 }, { id: "c", text: "Auto", picked: 14 }, { id: "d", text: "Own vehicle", picked: 27 }] },
  { id: "puttu", prompt: "Puttu goes best with…",
    choices: [{ id: "a", text: "Kadala curry", picked: 52 }, { id: "b", text: "Banana", picked: 29 }, { id: "c", text: "Pappadam", picked: 19 }] },
  { id: "fix-first", prompt: "What should our neighbourhood fix first?",
    choices: [{ id: "a", text: "Street lights", picked: 41 }, { id: "b", text: "Potholes", picked: 35 }, { id: "c", text: "Waste pickup", picked: 24 }] },
  { id: "rain-plan", prompt: "Rainy Sunday plan?",
    choices: [{ id: "a", text: "Sleep in", picked: 39 }, { id: "b", text: "Pazham pori and tea", picked: 44 }, { id: "c", text: "Movie", picked: 17 }] },
  { id: "meetup", prompt: "Would you come to a neighbourhood meetup?",
    choices: [{ id: "a", text: "Yes, this week", picked: 28 }, { id: "b", text: "Maybe on a weekend", picked: 53 }, { id: "c", text: "Not yet", picked: 19 }] },
];

const BONUS_ROUNDS: Record<BonusKind, ChoiceRound[]> = { lingo: LINGO, quiz: QUIZ, poll: POLLS };

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

/** Today's round of a bonus game; the same for every player on the same day. */
export function bonusFor(kind: BonusKind, dailyKey: string): ChoiceRound {
  const rounds = BONUS_ROUNDS[kind];
  return rounds[hash(`${kind}|${dailyKey}`) % rounds.length];
}

const BOARD_NAMES =["Tony Thomas", "Carol Chacko", "Bruce Varghese", "Wanda Warrier", "Natasha Nair", "Steve Sebastian"];

/** Sample leaderboard that changes each day, so the demo doesn't look frozen. */
export function sampleBoard(dailyKey: string): { name: string; points: number }[] {
  return BOARD_NAMES.map((name) => ({ name, points: 300 + (hash(`${name}|${dailyKey}`) % 680) }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
}
