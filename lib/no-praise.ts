// "Praise" out of site copy (owner 2026-11-28, "lets run it": it sounds AI-written and fights the casual voice). One
// script-only swap, no LLM calls, used by scripts/no-praise.mts on stored text and by the copy guard (tests).
//   "praise a/an X"       → "call it a/an X" when X is the product, else "love a/an X"
//   "praise the/its X"    → "love the/its X"
//   "praised for X"       → "loved for X"
//   "praise for X" (noun) → "love for X"
//   "<subject> praise X"  → "<subject> love X" (extra pattern, shown to the owner separately before any write)
// Anything else is left alone and flagged for a manual look: a field with any flagged use is not changed at all.

export const PRAISE_RE = /\bprais(e|es|ed|ing)\b/i;

const VERB: Record<string, { call: string; love: string }> = {
  praise: { call: "call it", love: "love" }, praises: { call: "calls it", love: "loves" },
  praised: { call: "called it", love: "loved" }, praising: { call: "calling it", love: "loving" } };
/** Words before "praise" that make it a noun ("the most common praise", "earns praise"). */
const NOUN_BEFORE = /\b(the|a|most|more|common|main|top|biggest|high|much|wide|strong|consistent|universal|broad|some|no|little|real|warm|frequent|repeated|heavy|similar|same|of|with|and|earn|earns|earned|earning|get|gets|got|getting|draw|draws|drew|drawing|win|wins|won|receive|receives|received|attract|attracts|its|their|lots of|plenty of|mixed|loudest|clearest|usual|early|initial|general|specific|particular|special|big|clear|steady|plenty|lot of)\s+$/i;
/** Words before "praise" that make it the verb of a sentence about people ("Reviewers praise strong power"). */
const SUBJECT_BEFORE = /\b(reviewers|players|testers|fans|users|both|many|most|several|some|others|they|all|two|three|four|everyone|people|reviews|posts|creators|also|often|mostly|widely|generally|still|especially|repeatedly|consistently|frequently|mainly|largely|particularly|all|and|who|that|unanimously|regularly|commonly)\s+$/i;

/** A verb-first sentence ("Praises spin."), a clause after a comma (", praising soft feel"), or "who like(d) it". */
const START_BEFORE = /(^\s*|[.!?]["”’)]?\s+|,\s+|\b(like|liked|likes) it\s+|\breviewer\s+)$/;

/** The product itself, as named after "a/an" (any site's catalogue word). */
const PRODUCT_WORD = /\b(paddles?|rackets?|racquets?|discs?|putters?|drivers?|laptops?|headphones?|earbuds?|wheels?|rigs?|pedals?|serums?|creams?|cleansers?|sunscreens?|moisturi[sz]ers?|products?|machines?|grinders?|options?|picks?|choices?|bats?|models?)\b/i;

export type Swap = { text: string; changed: boolean; flags: string[]; rules: string[] };
const cap = (from: string, to: string) => /^[A-Z]/.test(from) ? to[0]!.toUpperCase() + to.slice(1) : to;

/** One text through the patterns. `extra` turns the "<subject> praise X" pattern on. */
export function noPraise(t: string, extra = true): Swap {
  if (!PRAISE_RE.test(t)) return { text: t, changed: false, flags: [], rules: [] };
  const flags: string[] = [], rules: string[] = [];
  const out = t.replace(/\b(prais(?:e|es|ed|ing))\b(\s*)(\w+)?/gi, (m, word: string, sp: string, next: string | undefined, at: number) => {
    const w = word.toLowerCase(), before = t.slice(Math.max(0, at - 40), at), nx = (next ?? "").toLowerCase();
    const v = VERB[w]!;
    // "call it a/an" only when the phrase names the product ("praise a plush control paddle"); a feature ("praises a
    // forgiving sweet spot") gets "love a/an" instead.
    if (nx === "a" || nx === "an") { const np = t.slice(at + m.length).split(/[.;:!?]| with | and | that | for | plus /)[0] ?? "";
      if (PRODUCT_WORD.test(np)) { rules.push("call it a/an"); return `${cap(word, v.call)}${sp}${next}`; }
      rules.push("love a/an"); return `${cap(word, v.love)}${sp}${next}`; }
    if (w === "praised" && nx === "for") { rules.push("praised for"); return `${cap(word, "loved")}${sp}${next}`; }
    if (w === "praise" && NOUN_BEFORE.test(before) && nx === "for") { rules.push("noun"); return `${cap(word, "love")}${sp}${next ?? ""}`; }
    if (["the", "its", "their", "his", "her"].includes(nx)) { rules.push("love the/its"); return `${cap(word, v.love)}${sp}${next}`; }
    if (extra && w !== "praised" && (SUBJECT_BEFORE.test(before) || START_BEFORE.test(t.slice(0, at)))) { rules.push("subject love X"); return `${cap(word, v.love)}${sp}${next ?? ""}`; }
    flags.push(`${before.slice(-30)}[${word}]${sp}${next ?? ""}`);
    return m;
  });
  // A field with any use the patterns don't cover stays as it is, for a manual look.
  if (flags.length) return { text: t, changed: false, flags, rules: [] };
  return { text: out, changed: out !== t, flags, rules };
}
