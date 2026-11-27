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
  /** The v3 home's line under the title (owner 2026-11-22, from the v3 mock), in the site's own words. */
  tagline: "Real player opinions, votes, and comments on the top padel rackets.",
};
/** `owner`: the word that takes "owner" in outside summaries (lib/thread/web-sources.ts playersWord); `person` when absent. */
type Words = typeof PADEL & { owner?: string };
const SITES: Record<string, Words> = {
  // PickleballRecs on v3 (wave 2, 2026-11-21): padel's words ("players"), its paddles.
  pickleball: { ...PADEL, item: "paddle", items: "paddles", community: "The pickleball paddle community",
    tagline: "Real player opinions, votes, and comments on the top pickleball paddles." },
  // SkinRecs on the v3 pages (2026-11-21): "community" where they say "player" before a noun ("community opinions", "Based on
  // community votes", "No community reviews yet"), "reviewer" for an outside summary's "owner". Its old pages never read these.
  skin: { person: "community", people: "people", People: "People", Person: "Community", owner: "reviewer", score: "user score", Score: "User score", reviews: "reviews",
    Reviews: "Reviews", traitsTitle: "How does it work for you?", fitTitle: "Is it right for my skin?", opinions: "opinions", lovers: "People",
    triedIt: "Tried it?", played: "tried", item: "product", items: "products", usedIt: "Tried it?", community: "The skincare community",
    tagline: "Real people's opinions, votes, and comments on the skincare they use." },
  // DiscGolfRecs on the v3 pages (V3-ROLLOUT-BRIEF wave 2, owner 2026-11-21): "players", like padel; no score.
  discgolf: { person: "player", people: "players", People: "Players", Person: "Player", score: "player score", Score: "Player score",
    reviews: "player reviews", Reviews: "Player reviews", traitsTitle: "How does it fly?", fitTitle: "Is it right for me?",
    opinions: "player opinions", lovers: "Players", triedIt: "Thrown it?", played: "threw",
    item: "disc", items: "discs", usedIt: "Thrown it?", community: "The disc golf community",
    tagline: "Real player opinions, votes, and comments on the top disc golf discs." },
  // AudioRecs (its handoff README): "listeners", "listener score".
  audio: { person: "listener", people: "listeners", People: "Listeners", Person: "Listener", score: "listener score", Score: "Listener score",
    reviews: "listener reviews", Reviews: "Listener reviews", traitsTitle: "How does it sound?", fitTitle: "Is it right for me?",
    opinions: "listener opinions", lovers: "Listeners", triedIt: "Own a pair?", played: "listened to",
    item: "pair", items: "headphones", usedIt: "Own a pair?", community: "The headphone community",
    tagline: "Real listener opinions, votes, and comments on the top headphones." },
  simracing: { person: "racer", people: "racers", People: "Racers", Person: "Racer", score: "racer score", Score: "Racer score",
    reviews: "racer reviews", Reviews: "Racer reviews", traitsTitle: "How does it drive?", fitTitle: "Is it right for me?",
    opinions: "racer opinions", lovers: "Racers", triedIt: "Raced with it?", played: "raced with",
    item: "product", items: "products", usedIt: "Raced with it?", community: "The sim racing community",
    tagline: "Real racer opinions, votes, and comments on the top sim racing gear." },
  // TennisRecs: padel's words ("players", "Played with it?"), its own community line.
  tennis: { ...PADEL, community: "The tennis racket community", tagline: "Real player opinions, votes, and comments on the top tennis rackets." },
  // LaptopRecs on the v3 pages (owner 2026-11-24, PickleballRecs as the template): "owners", its own reviewer word since
  // 2026-11-12 (lib/niche/laptop.ts people), so stored lines that say "owners" stay as they are.
  laptop: { person: "owner", people: "owners", People: "Owners", Person: "Owner", score: "owner score", Score: "Owner score",
    reviews: "owner reviews", Reviews: "Owner reviews", traitsTitle: "How does it hold up?", fitTitle: "Is it right for me?", opinions: "owner opinions",
    lovers: "Owners", triedIt: "Own one?", played: "used", item: "laptop", items: "laptops", usedIt: "Own one?", community: "The laptop community",
    tagline: "Real opinions, votes, and comments on popular laptops." },
  // CoffeeRecs on the v3 pages (2026-11-28): "owners", as LaptopRecs ("Loved by 12 owners", "Own one?").
  coffee: { person: "owner", people: "owners", People: "Owners", Person: "Owner", score: "owner score", Score: "Owner score",
    reviews: "owner reviews", Reviews: "Owner reviews", traitsTitle: "How does it work for you?", fitTitle: "Is it right for me?", opinions: "owner opinions",
    lovers: "Owners", triedIt: "Own one?", played: "used", item: "product", items: "products", usedIt: "Own one?", community: "The coffee community",
    tagline: "Real opinions, votes, and comments on popular coffee gear." },
};
export const W: Readonly<Words> = SITES[niche.id] ?? PADEL;
