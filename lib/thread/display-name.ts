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
  // SkinRecs: the skin type in its own words ("Dry skin", lib/niche/skin.ts profile); other sites: the level as given.
  const levelOwn = niche.id === "skin" && r.level?.trim() ? (niche.profile.playerLevel?.options ?? []).find(o => o.value.toLowerCase() === r.level!.trim().toLowerCase()) as { display?: string } | undefined : undefined;
  const level = levelOwn?.display ? levelOwn.display[0].toUpperCase() + levelOwn.display.slice(1)
    : r.level?.trim() ? r.level.trim()[0].toUpperCase() + r.level.trim().slice(1).toLowerCase() : null;
  const format = r.side?.trim() ? formatWord(r.side.trim()) : null;
  if (format) return level ? `${level}, ${format}` : niche.id === "skin" || niche.id === "discgolf" ? `${format[0].toUpperCase()}${format.slice(1)}` : `Plays ${format}`; // "Intermediate, mostly doubles"
  const side = r.side?.trim() ? SIDE[r.side.trim().toLowerCase()] ?? null : null;
  if (level && side) return `${level}, ${side}`;
  if (level) return levelOwn?.display ? level : `${level} player`;
  if (side) return side === "both sides" ? "Plays both sides" : `${side[0].toUpperCase()}${side.slice(1).replace(" side", "-side")} player`;
  return NO_NAME;
}
/** A review's reviewer info when it has no typed name (owner 2026-11-21): the level and side as a small grey tag
 *  ("Intermediate · right side", "Dry skin · acne", "Intermediate · mostly doubles"), never a name. Null when neither is set. */
export function reviewerInfo(r: { level?: string | null; side?: string | null }): string | null {
  const lv = r.level?.trim(), sd = r.side?.trim();
  const levelOwn = niche.id === "skin" && lv ? (niche.profile.playerLevel?.options ?? []).find(o => o.value.toLowerCase() === lv.toLowerCase()) as { display?: string } | undefined : undefined;
  const level = levelOwn?.display ?? (lv ? lv.toLowerCase() : null);
  const side = sd ? formatWord(sd) ?? SIDE[sd.toLowerCase()] ?? null : null;
  const out = [level, side].filter(Boolean).join(" · ");
  return out ? out[0].toUpperCase() + out.slice(1) : null;
}
/** A comment's name: the typed name, else "Player" (comments ask no level). "[removed]" stays as it is. */
export const commenterName = (alias: string | null | undefined) => (alias ?? "").trim() === "[removed]" ? "[removed]" : typedName(alias) ?? NO_NAME;
/** The site's own level and side words (padel: beginner … left, right, both; PickleballRecs: doubles; SkinRecs: dry, acne …). */
const opts = (f?: { options?: readonly { value: string; display?: string }[] }) => (f?.options ?? []).flatMap(o => [o.value, o.display ?? ""]);
const words = (t: string) => t.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const PROFILE_WORDS = new Set(words([...opts(niche.profile.playerLevel as never), ...opts(niche.profile.playingSide as never)].join(" ")));
const FILLER = new Set(["side", "sides", "player", "players", "level", "plays", "mostly", "and", "skin", "the", "a"]);
/** A typed name that is only a level and side description ("intermediate right side", "beginner left"): it would read as
 *  reviewer info, and the level and side already show on their own (owner 2026-11-21). */
export const isProfileOnlyName = (name: string) => { const w = words(name);
  return w.length > 0 && w.some(x => PROFILE_WORDS.has(x)) && w.every(x => PROFILE_WORDS.has(x) || FILLER.has(x)); };
export const PROFILE_NAME = "Pick a name, your level and side show on their own.";
/** What's wrong with a typed name, or null: required, 2 to NAME_MAX characters, no links (owner 2026-11-19), not just a
 *  level and side (owner 2026-11-21). */
export const nameProblem = (name: string) => { const n = name.trim();
  return !n ? "Add a name to post." : n.length < NAME_MIN ? `A name needs at least ${NAME_MIN} characters.` : n.length > NAME_MAX ? `Keep the name to ${NAME_MAX} characters.`
    : /https?:|www\.|\.[a-z]{2,}\//i.test(n) ? "No links in the name, please." : isProfileOnlyName(n) ? PROFILE_NAME : null; };
/** A member's level and side as one line, the same words as reviewerInfo ("Intermediate · left side"), or null. */
export function profileLine(level: string | null | undefined, side: string | null | undefined): string | null {
  return reviewerInfo({ level, side });
}
