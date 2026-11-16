// The match box's one reason line (owner 2026-11-16): "why this score, for you" in 1–2 sentences, instead of bullets that
// repeated Why yes, why not. Built from what the page already has: the top "matters for you" Why yes item, the top Why not
// item, and the fit check's level reason. Pure, so the browser reruns it on every tap.
import type { QuickChoice } from "./quick-match";
import { pickTags, plainReason, reasonTag } from "./fit-card";

/** One side's candidate lines: the item's sentence and its short title, with who it matters for. */
export type ReasonItem = { title: string; t: string; for?: string[] };
export type ReasonKind = "good" | "maybe" | "no";

const MAX = 105;
// A sore arm outranks the style, the style outranks the level (as lib/fit-card.ts and the "matters for you" tags).
const W: Record<string, number> = { arm: 4, control: 3, balance: 3, power: 3, beginner: 2, intermediate: 2, advanced: 2 };

/** The item that matters most for the picks; the author's first item when none is tagged for them. */
function top(items: ReasonItem[], picks: string[]): { it: ReasonItem; tagged: boolean } | null {
  if (!items.length) return null;
  const scored = items.map((it, i) => ({ it, i, s: (it.for ?? []).reduce((a, t) => a + (picks.includes(t) ? W[t] ?? 1 : 0), 0) }));
  const best = scored.filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i)[0];
  return best ? { it: best.it, tagged: true } : { it: items[0], tagged: false };
}

/** "The sweet spot covers…" → "the sweet spot covers…", without the == marks or the end stop. Acronyms (AT10) keep their case. */
export function clause(t: string) {
  // "players", never "owners" (owner rule), also in older fit-card lines.
  const s = t.replace(/==/g, "").trim().replace(/[.!]$/, "").replace(/\b([Oo])wners\b/g, (_, o) => o === "O" ? "Players" : "players").replace(/\b([Oo])wner\b/g, (_, o) => o === "O" ? "Player" : "player");
  return /^[A-Z][A-Z0-9]/.test(s) ? s : s.replace(/^./, c => c.toLowerCase());
}
/** "<lead> <clause>." when it fits on one line, else "<lead> <title>." */
const sentence = (lead: string, it: ReasonItem) => { const full = `${lead} ${clause(it.t)}.`; return full.length <= MAX ? full : `${lead} ${clause(it.title)}.`; };

/** The level reason among the fit check's conflicts ("Not aimed at intermediates."), level bookkeeping dropped. */
export function levelReason(conflicts: string[] | undefined, c: Pick<QuickChoice, "style" | "level" | "arm">) {
  const r = (conflicts ?? []).find(x => { const t = reasonTag(x, c); return t === "beginner" || t === "intermediate" || t === "advanced"; });
  const p = r ? plainReason(r) : null;
  return p && p.length <= MAX ? p : null;
}

/** A level reason after "But": "Not aimed at X" → "it isn't aimed at X", "A pro line, …" → "it's a pro line, …". */
export function butLevel(r: string) {
  const c = clause(r);
  return c.replace(/^not aimed /, "it isn't aimed ").replace(/^not clearly /, "it's not clearly ").replace(/^a /, "it's a ");
}

/** The reason line for a verdict. Strong fit: what it was built for, then the one thing to know. Mid: what suits you, then the
 *  catch. Weak: what it has going for you, then why it falls short, with the level reason when the catch doesn't speak to
 *  the picks. Null when there is nothing to say. */
export function fitReason(kind: ReasonKind, yes: ReasonItem[], no: ReasonItem[], c: Pick<QuickChoice, "style" | "level" | "arm">, conflicts?: string[]): string | null {
  const picks = pickTags(c), y = top(yes, picks), n = top(no, picks), lvl = kind === "good" ? null : levelReason(conflicts, c);
  // A weak fit's deal-breaker is the fit check's first conflict: when that is the level, the level reason is the "But".
  const levelFirst = !!lvl && !!conflicts?.[0] && levelReason(conflicts.slice(0, 1), c) === lvl;
  const butLvl = (l: string) => `But ${butLevel(l)}.`.length <= MAX ? `But ${butLevel(l)}.` : l;
  // A strength that isn't about the picks is only "its strength", not something that suits the visitor.
  const lead = kind === "good" ? "Built for what you picked:" : !y?.tagged ? "Its strength:" : kind === "maybe" ? "What suits your game:" : "It has one thing going for you:";
  const out: string[] = [];
  if (y) out.push(sentence(lead, y.it));
  if (kind === "good") { if (n) out.push(sentence("One thing to know:", n.it)); }
  // One "But" only (1–2 sentences): the level when it decides a weak fit or no catch speaks to the picks, else the catch.
  else if (lvl && (kind === "no" ? levelFirst || !n?.tagged : !n?.tagged)) out.push(butLvl(lvl));
  else if (n) out.push(sentence("But", n.it));
  return out.length ? out.join(" ") : null;
}
