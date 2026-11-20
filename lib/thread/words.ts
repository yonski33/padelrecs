// The Thread pages' words for the people behind the reviews and for the score, per site. Padel and pickleball keep
// "players" and "player score"; SkinRecs says "people" and "user score" (its handoff README: never "users" or "players");
// DiscGolfRecs says "throwers" and "thrower score" (its handoff README).
import { niche } from "../niche";

const PADEL = {
  person: "player", people: "players", People: "Players", Person: "Player",
  /** The badge label and "By … score". */ score: "player score", Score: "Player score",
  /** "From 120 player reviews and votes" / "From 120 reviews and votes". */ reviews: "player reviews", Reviews: "Player reviews",
  /** The vote grid's heading (skin mock: "How does it work for you?"). */ traitsTitle: "How does it play?",
  /** The fit box's heading. */ fitTitle: "Is it right for me?",
  /** The product page byline: "168 player opinions analysed" / "168 opinions analysed". */ opinions: "player opinions",
  /** "People who loved this also loved" and the like. */ lovers: "Players",
  /** The review composer's prompt. */ triedIt: "Played it?",
  /** "people who played the rackets" / "people who tried the products". */ played: "played",
};
type Words = typeof PADEL;
const SITES: Record<string, Words> = {
  skin: { person: "person", people: "people", People: "People", Person: "Person", score: "user score", Score: "User score", reviews: "reviews",
    Reviews: "Reviews", traitsTitle: "How does it work for you?", fitTitle: "Is it right for my skin?", opinions: "opinions", lovers: "People",
    triedIt: "Tried it?", played: "tried" },
  discgolf: { person: "thrower", people: "throwers", People: "Throwers", Person: "Thrower", score: "thrower score", Score: "Thrower score",
    reviews: "thrower reviews", Reviews: "Thrower reviews", traitsTitle: "How does it fly?", fitTitle: "Is it right for me?",
    opinions: "thrower opinions", lovers: "Throwers", triedIt: "Thrown it?", played: "thrown" },
};
export const W: Readonly<Words> = SITES[niche.id] ?? PADEL;
