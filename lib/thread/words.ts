// The Thread pages' words for the people behind the reviews and for the score, per site. Padel and pickleball keep
// "players" and "player score"; SkinRecs says "people" and "user score" (its handoff README: never "users" or "players");
// DiscGolfRecs says "throwers" and "thrower score", SimRacingRecs "racers" and "racer score" (their handoff READMEs).
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
  // The v3 pages (lib/thread/sites.ts v3Site): the product word and the composer's question.
  /** One product, many products, as the v3 lists and headings say them. */ item: "racket", items: "rackets",
  /** The v3 composer's prompt. */ usedIt: "Played with it?",
  /** The home title. */ community: "The padel racket community",
};
type Words = typeof PADEL;
const SITES: Record<string, Words> = {
  skin: { person: "person", people: "people", People: "People", Person: "Person", score: "user score", Score: "User score", reviews: "reviews",
    Reviews: "Reviews", traitsTitle: "How does it work for you?", fitTitle: "Is it right for my skin?", opinions: "opinions", lovers: "People",
    triedIt: "Tried it?", played: "tried", item: "product", items: "products", usedIt: "Tried it?", community: "The skincare community" },
  discgolf: { person: "thrower", people: "throwers", People: "Throwers", Person: "Thrower", score: "thrower score", Score: "Thrower score",
    reviews: "thrower reviews", Reviews: "Thrower reviews", traitsTitle: "How does it fly?", fitTitle: "Is it right for me?",
    opinions: "thrower opinions", lovers: "Throwers", triedIt: "Thrown it?", played: "threw",
    item: "disc", items: "discs", usedIt: "Thrown it?", community: "The disc golf community" },
  // AudioRecs (its handoff README): "listeners", "listener score".
  audio: { person: "listener", people: "listeners", People: "Listeners", Person: "Listener", score: "listener score", Score: "Listener score",
    reviews: "listener reviews", Reviews: "Listener reviews", traitsTitle: "How does it sound?", fitTitle: "Is it right for me?",
    opinions: "listener opinions", lovers: "Listeners", triedIt: "Own a pair?", played: "listened to",
    item: "pair", items: "headphones", usedIt: "Own a pair?", community: "The headphone community" },
  simracing: { person: "racer", people: "racers", People: "Racers", Person: "Racer", score: "racer score", Score: "Racer score",
    reviews: "racer reviews", Reviews: "Racer reviews", traitsTitle: "How does it drive?", fitTitle: "Is it right for me?",
    opinions: "racer opinions", lovers: "Racers", triedIt: "Raced with it?", played: "raced with",
    item: "product", items: "products", usedIt: "Raced with it?", community: "The sim racing community" },
};
export const W: Readonly<Words> = SITES[niche.id] ?? PADEL;
