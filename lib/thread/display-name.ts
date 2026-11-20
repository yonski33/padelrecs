// Reviewer and commenter names on Thread (owner 2026-11-19): no generated nicknames. New reviews and comments need a name
// (2 to 24 characters, like Fragrantica). An old row without one: the reviewer's own answers ("Intermediate player",
// "Left-side player", "Beginner, right side"), else "Player". Never "Anonymous". Old rows keep their stored alias, and a generated one ("SharpBandeja197",
// lib/nickname.ts) is ignored here, at display time. Pure, for tests.
import { NICK_A, DEFAULT_NICKNAMES } from "../nickname";
import { niche } from "../niche";
import { sideWord } from "../byline";

/** The longest name the Thread forms accept. */
export const NAME_MAX = 24, NAME_MIN = 2;
/** The name an old row with nothing else to go on gets. */
export const NO_NAME = "Player";
const FIRST = [...new Set([...NICK_A, ...(niche.form.quickVote?.nickFirst ?? [])])];
const SECOND = [...new Set([...DEFAULT_NICKNAMES, ...(niche.form.quickVote?.nicknames ?? [])])];
const GENERATED = new RegExp(`^(${FIRST.join("|")})(${SECOND.join("|")})\\d{3}$`);
/** A nickname lib/nickname.ts made up (first half, second half, 3 digits), not one a person typed. */
export const isGeneratedNickname = (alias: string) => GENERATED.test(alias.trim());
/** Placeholders older code stored for "no name". */
const PLACEHOLDER = /^(a |an )?\S+ player$|^anonymous$|^player$|^\[removed\]$/i;

/** The name a person typed, or null when the stored alias is empty, generated or a placeholder. */
export function typedName(alias: string | null | undefined): string | null {
  const a = (alias ?? "").trim();
  if (!a || isGeneratedNickname(a) || (PLACEHOLDER.test(a) && a !== "[removed]")) return null;
  return a;
}

const SIDE: Record<string, string> = { left: "left side", right: "right side", both: "both sides" };
/** A site whose "side" is a format with its own words (PickleballRecs: "mostly doubles", lib/byline.ts), else null. */
const formatWord = (side: string) => { const own = (niche.profile.playingSide?.options ?? []).find(o => o.value.toLowerCase() === side.toLowerCase()) as { display?: string } | undefined;
  return own?.display ? sideWord(side) : null; };
/** A review's name: the typed name, else built from the level and side the reviewer gave, else "Anonymous". */
export function reviewerName(r: { alias?: string | null; level?: string | null; side?: string | null }): string {
  const typed = typedName(r.alias);
  if (typed) return typed;
  const level = r.level?.trim() ? r.level.trim()[0].toUpperCase() + r.level.trim().slice(1).toLowerCase() : null;
  const format = r.side?.trim() ? formatWord(r.side.trim()) : null;
  if (format) return level ? `${level}, ${format}` : `Plays ${format}`; // "Intermediate, mostly doubles"
  const side = r.side?.trim() ? SIDE[r.side.trim().toLowerCase()] ?? null : null;
  if (level && side) return `${level}, ${side}`;
  if (level) return `${level} player`;
  if (side) return side === "both sides" ? "Plays both sides" : `${side[0].toUpperCase()}${side.slice(1).replace(" side", "-side")} player`;
  return NO_NAME;
}
/** A comment's name: the typed name, else "Player" (comments ask no level). "[removed]" stays as it is. */
export const commenterName = (alias: string | null | undefined) => (alias ?? "").trim() === "[removed]" ? "[removed]" : typedName(alias) ?? NO_NAME;
/** What's wrong with a typed name, or null: required, 2 to NAME_MAX characters, no links (owner 2026-11-19). */
export const nameProblem = (name: string) => { const n = name.trim();
  return !n ? "Add a name to post." : n.length < NAME_MIN ? `A name needs at least ${NAME_MIN} characters.` : n.length > NAME_MAX ? `Keep the name to ${NAME_MAX} characters.`
    : /https?:|www\.|\.[a-z]{2,}\//i.test(n) ? "No links in the name, please." : null; };
/** A member's level and side as one line ("Intermediate, left side", "Left-side player"), or null when neither is set. */
export function profileLine(level: string | null | undefined, side: string | null | undefined): string | null {
  return level?.trim() || side?.trim() ? reviewerName({ alias: null, level, side }) : null;
}
