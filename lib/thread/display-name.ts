// Reviewer and commenter names on Thread (owner 2026-11-19): no generated nicknames. A name the person typed (or the owner set
// in admin) shows as written; otherwise the name comes from their own answers ("Intermediate player", "Left-side player",
// "Beginner, right side"); with none, "Anonymous". Old rows keep their stored alias, and a generated one ("SharpBandeja197",
// lib/nickname.ts) is ignored here, at display time. Pure, for tests.
import { NICK_A, DEFAULT_NICKNAMES } from "../nickname";
import { niche } from "../niche";

/** The longest name the Thread forms accept. */
export const NAME_MAX = 24;
export const ANONYMOUS = "Anonymous";
const FIRST = [...new Set([...NICK_A, ...(niche.form.quickVote?.nickFirst ?? [])])];
const SECOND = [...new Set([...DEFAULT_NICKNAMES, ...(niche.form.quickVote?.nicknames ?? [])])];
const GENERATED = new RegExp(`^(${FIRST.join("|")})(${SECOND.join("|")})\\d{3}$`);
/** A nickname lib/nickname.ts made up (first half, second half, 3 digits), not one a person typed. */
export const isGeneratedNickname = (alias: string) => GENERATED.test(alias.trim());
/** Placeholders older code stored for "no name". */
const PLACEHOLDER = /^(a |an )?\S+ player$|^anonymous$|^\[removed\]$/i;

/** The name a person typed, or null when the stored alias is empty, generated or a placeholder. */
export function typedName(alias: string | null | undefined): string | null {
  const a = (alias ?? "").trim();
  if (!a || isGeneratedNickname(a) || (PLACEHOLDER.test(a) && a !== "[removed]")) return null;
  return a;
}

const SIDE: Record<string, string> = { left: "left side", right: "right side", both: "both sides" };
/** A review's name: the typed name, else built from the level and side the reviewer gave, else "Anonymous". */
export function reviewerName(r: { alias?: string | null; level?: string | null; side?: string | null }): string {
  const typed = typedName(r.alias);
  if (typed) return typed;
  const level = r.level?.trim() ? r.level.trim()[0].toUpperCase() + r.level.trim().slice(1).toLowerCase() : null;
  const side = r.side?.trim() ? SIDE[r.side.trim().toLowerCase()] ?? null : null;
  if (level && side) return `${level}, ${side}`;
  if (level) return `${level} player`;
  if (side) return side === "both sides" ? "Plays both sides" : `${side[0].toUpperCase()}${side.slice(1).replace(" side", "-side")} player`;
  return ANONYMOUS;
}
/** A comment's name: the typed name or "Anonymous" (comments ask no level). "[removed]" stays as it is. */
export const commenterName = (alias: string | null | undefined) => (alias ?? "").trim() === "[removed]" ? "[removed]" : typedName(alias) ?? ANONYMOUS;
/** A name a person may type: up to NAME_MAX characters, no links. Empty is fine (the name is optional). */
export const nameProblem = (name: string) => name.trim().length > NAME_MAX ? `Keep the name to ${NAME_MAX} characters.`
  : /https?:|www\.|\.[a-z]{2,}\//i.test(name) ? "No links in the name, please." : null;
