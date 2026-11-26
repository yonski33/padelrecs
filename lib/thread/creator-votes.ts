// The creator page's "Played it? Vote and rate it" section (owner OK 2026-11-22, PR #649): the "Would you buy it again?" poll
// and the vote groups the site's own ranking lists are built from (lib/category-rating.ts), so a vote here feeds the same
// lists. Config-driven per site: another site's creator page asks its own ranking categories, and a site can list its own
// keys in CREATOR_VOTE_KEYS instead. Padel-only groups (court side) never show because padel's rankings don't use them.
import { rankingTraits } from "../category-rating";
import { traitGroupsFor, type TraitGroup } from "./traits";

/** A site's own choice of groups, when it wants other than its ranking categories (none yet). */
export const CREATOR_VOTE_KEYS: Record<string, string[]> = {
  // Paddle page v3 (owner handoff 2026-11-26) asked for four boxes; owner 2026-11-26 after seeing it: back to six. Spin is
  // one of pickleball's ranking lists (its votes come from here), and six boxes sit level with the Reddit box beside them.
  pickleball: ["plays_like", "level", "sweet_spot", "arm", "spin", "feel"],
  // SkinRecs (owner "Yes, Skin next" 2026-11-23): six of its own nine groups (lib/thread/traits.ts SKIN_TRAIT_GROUPS); the
  // would-you-buy-it-again poll above them covers repurchase.
  skin: ["skin_type", "texture", "finish", "irritation", "makeup", "value"],
  // LaptopRecs (owner 2026-11-24): six of its nine (lib/thread/traits.ts LAPTOP_TRAIT_GROUPS), the parts reviewers rate.
  laptop: ["performance", "battery", "thermals", "screen", "keyboard", "build"],
  // PadelRecs (owner 2026-11-24: "add 3 more how does it play boxs on padel ... best on(sides), Sweet spot and Trampoline"):
  // its three ranking groups first, then court side, sweet spot and trampoline. All six are padel's stored keys
  // (lib/thread/traits.ts PADEL_TRAIT_GROUPS), so votes save to trait_votes as on the other racket pages; no new keys.
  padel: ["plays_like", "arm", "level", "side", "sweet_spot", "trampoline"],
  // DiscGolfRecs (owner bug 2026-11-24: the box showed only the poll): six of its nine "How does it fly?" groups
  // (lib/thread/traits.ts DISCGOLF_TRAIT_GROUPS), the flight traits plus plastic durability, all prefilled from reviews in
  // db/thread/discgolf-traits.json; votes save to trait_votes as on the disc pages.
  discgolf: ["stability", "glide", "arm_speed", "wind", "grip", "durability"],
};
/** The box titles the creator page uses where they differ from the site's own (paddle page v3 mockup, PickleballRecs). The
 *  stored keys and options stay the same; other pages keep their titles. */
export const CREATOR_VOTE_TITLES: Record<string, Record<string, string>> = {
  pickleball: { plays_like: "Control or power", level: "Level", sweet_spot: "Sweet spot size", arm: "Arm comfort" },
};
/** The groups the creator page asks, in ranking order; only keys the site's vote API accepts. */
export function creatorVoteGroups(nicheId: string): TraitGroup[] {
  const all = traitGroupsFor(nicheId), titles = CREATOR_VOTE_TITLES[nicheId] ?? {};
  return (CREATOR_VOTE_KEYS[nicheId] ?? rankingTraits(nicheId)).map(k => all.find(g => g.key === k)).filter((g): g is TraitGroup => !!g)
    .map(g => titles[g.key] ? { ...g, title: titles[g.key]! } : g);
}
export { voteCountLine } from "./vote-count";
