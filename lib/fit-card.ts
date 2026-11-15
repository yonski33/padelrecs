// The fit card's two boxes on a racket page (owner 2026-11-15): "Why it fits" and "What to consider", written per racket from
// our evidence (player reports, YouTube summaries, tags, tips) and picked for the visitor's style / level / sore arm.
// Content: db/fit-card/<niche>.json, keyed by product slug. Every line lists the reports behind it (`src`, report ids;
// "other-slug:id" when the evidence sits on another racket's page). Pure, with no data import, so the browser's fit check
// (fit-live.tsx) can rerun it on every tap; the server reads the content (lib/fit-card-data.ts) and passes only this racket's
// entry. The % and the verdict stay in lib/fit-verdict.ts; this only picks the words.
import type { QuickChoice } from "./quick-match";

/** What a line is relevant to: the style picks, the levels, and "arm" for a sore elbow / wrist. */
export type CardTag = "control" | "balance" | "power" | "beginner" | "intermediate" | "advanced" | "arm";
export type CardNote = { label: string; t: string; src: (string | number)[] };
export type CardAlt = { slug: string; t: string; src: (string | number)[] };
export type CardLine = {
  t: string;
  for: CardTag[];
  /** Shown only when one of these is picked (arm-only lines, a level that is the main catch). */
  only?: CardTag[];
  src: (string | number)[];
  /** A player tip, heads up or weather check under a catch: 2+ sources (lib/fit-card checks). */
  tip?: CardNote;
  /** "If you want X, look at Y": a catalog racket, linked. */
  alt?: CardAlt;
};
export type CardContent = { strengths: CardLine[]; catches: CardLine[] };

/** The visitor's picks as tags. "any" style adds nothing. */
export function pickTags(c: Pick<QuickChoice, "style" | "level" | "arm">): CardTag[] {
  return [c.style !== "any" ? c.style : null, c.level ?? null, c.arm ? "arm" : null].filter((x): x is CardTag => !!x);
}

// A sore arm outranks the style, the style outranks the level: what the visitor asked about most directly comes first.
const WEIGHT: Record<CardTag, number> = { arm: 4, control: 3, balance: 3, power: 3, beginner: 2, intermediate: 2, advanced: 2 };
const score = (l: CardLine, picks: CardTag[]) => l.for.reduce((a, t) => a + (picks.includes(t) ? WEIGHT[t] : 0), 0);
const eligible = (l: CardLine, picks: CardTag[]) => !l.only || l.only.some(t => picks.includes(t));
/** Lines ranked for the picks: eligible ones only, best match first, the author's order breaking ties. */
function ranked(lines: CardLine[], picks: CardTag[]) {
  return lines.map((l, i) => ({ l, i, s: score(l, picks) })).filter(x => eligible(x.l, picks)).sort((a, b) => b.s - a.s || a.i - b.i);
}

/** Which pick a fit-check reason is about: the style ("You want power, but…"), a sore arm, or else the level. */
export function reasonTag(reason: string, c: Pick<QuickChoice, "style" | "level" | "arm">): CardTag | null {
  if (/^You want /.test(reason)) return c.style !== "any" ? c.style : null;
  if (/^Sore arm/.test(reason)) return "arm";
  return c.level ?? null;
}

export type CardCatch = CardLine & { /** The one note shown under it: the alternative when it answers the visitor's style, else the tip. */ note?: { kind: "tip"; tip: CardNote } | { kind: "alt"; alt: CardAlt } };
/** The card's lines for a visitor: 2 strengths and 1–2 catches. A second catch only when it speaks to one of the picks, and
 *  never for a clean "good" verdict (its headline promises one catch).
 *  `hard`: the fit check's hard conflict for a "probably not" verdict. A racket line on the same pick goes first and replaces
 *  the generic reason; with none, the generic reason (level bookkeeping stripped) leads and one racket catch follows. */
export function cardLines(content: CardContent, c: Pick<QuickChoice, "style" | "level" | "arm">, opts: { maxCatches?: 1 | 2; hard?: string } = {}) {
  const picks = pickTags(c), max = opts.maxCatches ?? 2;
  const strengths = ranked(content.strengths, picks).slice(0, 2).map(x => x.l);
  let cs = ranked(content.catches, picks);
  const hardTag = opts.hard ? reasonTag(opts.hard, c) : null;
  // A level conflict needs a line written for that level (`only`); most lines name levels only as who they matter to.
  const isLevel = hardTag === "beginner" || hardTag === "intermediate" || hardTag === "advanced";
  const onHard = !hardTag ? [] : [...cs.filter(x => x.l.only?.includes(hardTag)), ...(isLevel ? [] : cs.filter(x => !x.l.only?.includes(hardTag) && x.l.for.includes(hardTag)))];
  if (onHard.length) cs = [...onHard, ...cs.filter(x => !onHard.includes(x))];
  const lead = opts.hard && !onHard.length ? plainReason(opts.hard) : null;
  const room = lead ? 1 : max;
  const picked = cs.slice(0, 1).concat(room > 1 ? cs.slice(1, 2).filter(x => x.s > 0) : []).slice(0, room).map(x => x.l);
  const catches: CardCatch[] = picked.map(l => {
    const wantsAlt = l.alt && (c.style === "any" || l.for.includes(c.style));
    return { ...l, note: wantsAlt || (l.alt && !l.tip) ? { kind: "alt" as const, alt: l.alt! } : l.tip ? { kind: "tip" as const, tip: l.tip } : undefined };
  });
  return { strengths, catches, lead };
}

/** Drops the level bookkeeping a fit-check reason may start with ("Level: the brand says professional · …."): the owner
 *  wants reasons, not who-says-what. What follows ("A pro line, built for advanced players.") stays. */
export function plainReason(reason: string) {
  return reason.replace(/^Level:[^]*?\.\s+(?=[A-Z])/, "").trim();
}
