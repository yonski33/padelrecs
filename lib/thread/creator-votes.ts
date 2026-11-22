// The creator page's "Played it? Vote and rate it" section (owner OK 2026-11-22, PR #649): the "Would you buy it again?" poll
// and the vote groups the site's own ranking lists are built from (lib/category-rating.ts), so a vote here feeds the same
// lists. Config-driven per site: another site's creator page asks its own ranking categories, and a site can list its own
// keys in CREATOR_VOTE_KEYS instead. Padel-only groups (court side) never show because padel's rankings don't use them.
import { rankingTraits } from "../category-rating";
import { traitGroupsFor, type TraitGroup } from "./traits";

/** A site's own choice of groups, when it wants other than its ranking categories (none yet). */
export const CREATOR_VOTE_KEYS: Record<string, string[]> = {};
/** The groups the creator page asks, in ranking order; only keys the site's vote API accepts. */
export function creatorVoteGroups(nicheId: string): TraitGroup[] {
  const all = traitGroupsFor(nicheId);
  return (CREATOR_VOTE_KEYS[nicheId] ?? rankingTraits(nicheId)).map(k => all.find(g => g.key === k)).filter((g): g is TraitGroup => !!g);
}
export { voteCountLine } from "./vote-count";
