// The Thread pages' words for the people behind the reviews and for the score, per site. Padel and pickleball keep
// "players" and "player score"; SkinRecs says "people" and "user score" (its handoff README: never "users" or "players").
import { niche } from "../niche";

const SKIN = niche.id === "skin";
export const W = {
  person: SKIN ? "person" : "player", people: SKIN ? "people" : "players", People: SKIN ? "People" : "Players",
  Person: SKIN ? "Person" : "Player",
  /** The badge label and "By … score". */ score: SKIN ? "user score" : "player score", Score: SKIN ? "User score" : "Player score",
  /** "From 120 player reviews and votes" / "From 120 reviews and votes". */ reviews: SKIN ? "reviews" : "player reviews",
  Reviews: SKIN ? "Reviews" : "Player reviews",
  /** The vote grid's heading (skin mock: "How does it work for you?"). */ traitsTitle: SKIN ? "How does it work for you?" : "How does it play?",
  /** The fit box's heading. */ fitTitle: SKIN ? "Is it right for my skin?" : "Is it right for me?",
  /** The product page byline: "168 player opinions analysed" / "168 opinions analysed". */ opinions: SKIN ? "opinions" : "player opinions",
  /** "People who loved this also loved" and the like. */ lovers: SKIN ? "People" : "Players",
  /** The review composer's prompt. */ triedIt: SKIN ? "Tried it?" : "Played it?",
  /** "people who played the rackets" / "people who tried the products". */ played: SKIN ? "tried" : "played",
} as const;
