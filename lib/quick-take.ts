import { z } from "zod";

/**
 * The editorial "quick take" (owner 2026-11-15, recipe: site-jobs/QUICK-TAKE-RECIPE.md): one block per product, stored in
 * rackets.quick_take and drawn by app/rackets/[slug]/quick-take.tsx. "We read the web so you don't have to": every line
 * comes from what players said, and every claim lists the stored reports (external_reviews ids, or reviews ids for our own
 * players) behind it, so lib/quick-take-check.ts can re-count it against the database before it is saved.
 *
 * Text fields take two bits of markup: **bold** and ==marker== (the yellow marker; the hook's catch gets it on its own).
 * Quote marks only ever go around a player's exact words.
 */

const ids = z.array(z.string().min(1)).max(400);
const line = z.string().trim().min(1).max(320);
const short = z.string().trim().min(1).max(160);

/** How it plays rows the court map already covers; with a map they're left out (owner 2026-11-15). */
export const COURT_ROWS = /^(attack|overheads?|smash(es)?|defen[cs]e|at the net|net( play)?|volleys?)$/i;

/** The How it plays chips, strongest first (recipe §3). */
export const CHIPS = ["Loved", "Strong", "Good", "Decent", "Divided", "Tricky", "Limited"] as const;
export type Chip = typeof CHIPS[number];
/** Rows are drawn strongest chip first. */
export const chipRank = (c: Chip) => CHIPS.indexOf(c);
export const chipTone = (c: Chip) => c === "Limited" ? "b" : ["Loved", "Strong", "Good"].includes(c) ? "g" : "m";

/** A short verdict chip beside a section heading (owner 2026-11-15): ≤5 words, green, amber or neutral. Optional. */
const verdict = z.object({ text: z.string().trim().min(1).max(40).refine(t => t.split(/\s+/).length <= 5, "5 words at most"), tone: z.enum(["g", "m", "n"]) }).strict().optional();
export type Verdict = NonNullable<z.infer<typeof verdict>>;
const receipt = z.object({ id: z.string().min(1), text: line, verbatim: z.boolean().optional() }).strict();
const receipts = z.array(receipt).max(10).optional();
const zone = z.object({ chip: z.enum(CHIPS), line, reports: ids }).strict();
/** A How it plays row. key: 2–4 words the line opens with, drawn bold so the rows scan (owner 2026-11-15). */
const row = z.object({ label: z.string().trim().min(1).max(40), chip: z.enum(CHIPS), key: z.string().trim().min(1).max(40).optional(), line, reports: ids }).strict();
const plainRow = z.object({ label: z.string().trim().min(1).max(40), line }).strict();
const bullets = (min: number, max: number) => z.array(line).min(min).max(max);

/** Optional sections, each with its trigger (recipe §4); lib/quick-take-check.ts enforces the triggers. */
export const moduleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("themes"), lead: line, bars: z.array(z.object({ label: z.string().trim().min(1).max(40), complaint: z.boolean().optional(), reports: ids }).strict()).min(4).max(8), receipts }).strict(),
  z.object({ type: z.literal("setup"), lead: line, rows: z.array(plainRow).min(2).max(6), numbers: z.array(z.object({ value: z.string().trim().min(1).max(16), note: short, reports: ids }).strict()).max(4).optional(), note: line.optional(), reports: ids, receipts }).strict(),
  z.object({ type: z.literal("version"), title: z.string().trim().min(1).max(60), lead: line,
    other: z.object({ slug: z.string().nullable(), short: z.string().trim().min(1).max(24), says: z.string().trim().min(1).max(40) }).strict(),
    self: z.object({ short: z.string().trim().min(1).max(24), says: z.string().trim().min(1).max(40) }).strict(),
    pickSelf: bullets(2, 4), pickOther: bullets(2, 4), reports: ids, receipts }).strict(),
  z.object({ type: z.literal("durability"), verdict, lead: line, rows: z.array(plainRow).min(2).max(5), reports: ids, receipts }).strict(),
  z.object({ type: z.literal("weigh"), verdict, lead: line, heavy: z.object({ title: short, bullets: bullets(1, 4) }).strict(), light: z.object({ title: short, bullets: bullets(1, 4) }).strict(),
    weights: z.array(z.object({ grams: z.number().int().min(250).max(450), id: z.string().min(1) }).strict()), receipts }).strict(),
  z.object({ type: z.literal("arm"), verdict, lead: line, kind: bullets(1, 4), harsh: bullets(1, 4), reports: ids, receipts }).strict(),
  z.object({ type: z.literal("hardness"), answer: z.string().trim().min(1).max(40), soft: ids, medium: ids, hard: ids, brand: short.optional() }).strict(),
]);
export type Module = z.infer<typeof moduleSchema>;
export type ModuleType = Module["type"];
/** Where a module's section sits. "hardness" is drawn inside How it plays; the rest are their own sections. */
export const MODULE_TITLES: Record<Exclude<ModuleType, "version">, string> = {
  themes: "What players say", setup: "Setting it up", durability: "Durability watch", weigh: "Weigh your racket", arm: "Arm check", hardness: "How hard is it?",
};

export const TIP_LABELS = ["Player tip", "Weather check", "Heads up", "Setup tip"] as const;
/** Where a tip note is drawn: after one of the core sections, or after a module (by its type). */
export const TIP_PLACES = ["tldr", "plays", "catch", "compare", "answers", "themes", "setup", "version", "durability", "weigh", "arm"] as const;

export const quickTakeSchema = z.object({
  v: z.literal(1),
  /** full: 20+ reports; short: 8–19 (hero, TL;DR, The catch, Quick answers, community, specs). */
  kind: z.enum(["full", "short"]),
  hook: z.object({ good: z.string().trim().min(1).max(90), catch: z.string().trim().min(1).max(90) }).strict(),
  tldr: z.object({ lead: line, madeFor: bullets(2, 4), notFor: bullets(1, 3) }).strict(),
  /** "Who's it for?": 0 beginner, 1 intermediate, 2 advanced (no Pro, recipe §4). */
  level: z.object({ from: z.number().int().min(0).max(2), to: z.number().int().min(0).max(2), answer: z.string().trim().min(1).max(60), note: line, reports: ids }).strict().optional(),
  plays: z.object({ verdict, lead: line, court: z.object({ net: zone.optional(), overheads: zone.optional(), defence: zone.optional() }).strict().optional(), rows: z.array(row).max(8) }).strict().optional(),
  catch: z.object({ verdict, lead: line, bullets: bullets(2, 4), reports: ids, about: z.boolean().optional(), what: z.string().trim().max(60).optional(), receipts }).strict(),
  modules: z.array(moduleSchema).max(3),
  compare: z.object({ verdict, lead: line, cards: z.array(z.object({ slug: z.string().nullable(), name: z.string().trim().min(1).max(60), tile: z.string().trim().max(8).optional(),
    arrows: z.array(z.object({ dir: z.enum(["up", "down", "same", "none"]), text: z.string().trim().min(1).max(48) }).strict()).min(1).max(4), reports: ids }).strict()).min(2).max(4),
    went: z.object({ label: z.string().trim().min(1).max(30), text: line }).strict().optional() }).strict().optional(),
  /** Only questions the rest of the page hasn't answered: 3–6 of them, or none (owner 2026-11-15). */
  answers: z.array(z.object({ q: z.string().trim().min(1).max(60), badge: z.string().trim().min(1).max(16), tone: z.enum(["yes", "maybe", "no"]), a: line, reports: ids }).strict()).max(6),
  tips: z.array(z.object({ label: z.enum(TIP_LABELS), text: line, after: z.enum(TIP_PLACES), reports: ids }).strict()).max(4),
  /** "How we read this" ends on the page's weakest part (recipe §3). */
  thinSpot: line,
  /** Snapshot of the counts the block was written from; the checker compares them with the database. */
  counts: z.object({ reports: z.number().int(), positive: z.number().int(), mixed: z.number().int(), negative: z.number().int() }).strict(),
  written: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();
export type QuickTake = z.infer<typeof quickTakeSchema>;

/** The stored block, or null when it is missing or no longer valid (a bad block falls back to the normal page). */
export function readQuickTake(value: unknown): QuickTake | null {
  if (!value || typeof value !== "object") return null;
  const parsed = quickTakeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Report-count gate (recipe §1). */
export const FULL_MIN = 20, SHORT_MIN = 8;
export const gateFor = (reports: number) => reports >= FULL_MIN ? "full" : reports >= SHORT_MIN ? "short" : null;

/** "130+": rounded down to 5 below 100 and to 10 from 100 (recipe: round N down to the nearest 5 or 10). */
export function roundedDown(n: number) { return n < 10 ? n : n < 100 ? Math.floor(n / 5) * 5 : Math.floor(n / 10) * 10; }
/** "about 40": the nearest 5 from 10 up. */
export function about(n: number) { return n < 10 ? n : Math.round(n / 5) * 5; }

/** The hero's sentiment words (recipe §3): the lead word from the split, then a word per smaller group. */
export function sentimentWords(positive: number, mixed: number, negative: number) {
  const total = positive + mixed + negative;
  if (!total) return null;
  const p = positive / total, n = negative / total, m = mixed / total;
  const lead = p >= 0.6 ? "Mostly positive" : p >= 0.45 ? "Leaning positive" : n >= 0.6 ? "Mostly negative" : n >= 0.45 ? "Leaning negative" : "Divided";
  const word = (share: number) => share >= 0.2 ? "some" : share >= 0.05 ? "a few" : "hardly any";
  const leadKey = lead.includes("positive") ? "positive" : lead.includes("negative") ? "negative" : null;
  const rest = ([["positive", p], ["mixed", m], ["negative", n]] as const).filter(([k]) => k !== leadKey)
    .map(([k, share]) => ({ key: k, words: `${word(share)} ${k}` }));
  return { lead, leadKey, rest };
}

/** **bold** and ==marker== spans of a text field. */
export type Span = { text: string; b?: boolean; mark?: boolean };
export function spans(text: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*|==(.+?)==/g;
  let at = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    out.push(m[1] !== undefined ? { text: m[1], b: true } : { text: m[2], mark: true });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}
export const plain = (text: string) => spans(text).map(s => s.text).join("");
export const markCount = (text: string) => spans(text).filter(s => s.mark).length;

/** The level track's lime band, as left/right insets (the approved mockups: 38% from intermediate, 22% before advanced). */
export function levelBand(from: number, to: number) {
  const left = ["0%", "38%", "70%"][from], right = ["70%", "22%", "0%"][to];
  return { left, right };
}

/** The source pills: never led by Reddit (recipe "Sources and Reddit"), plain grey, every source used. */
export function sourcePills(platforms: Iterable<string>, ownReviews: number, site: string) {
  const have = new Set(platforms);
  const order: [string, string][] = [["YouTube", "YouTube testers"], ["Blog", "Padel blogs"], ["Forum", "Forums"], ["Padel shop", "Padel shops"], ["Reddit", "Reddit"]];
  const pills = order.filter(([p]) => have.has(p)).map(([, label]) => label);
  for (const p of have) if (!order.some(([k]) => k === p)) pills.push(p);
  if (ownReviews) pills.push(`${site} players`);
  return pills;
}

/** "Mar 2025" for a source date or ISO timestamp. */
export const monthYear = (iso: string, long = false) => new Date(iso.length === 7 ? `${iso}-01` : iso)
  .toLocaleDateString("en-GB", { month: long ? "long" : "short", year: "numeric", timeZone: "UTC" });

/** The page title and meta description (recipe "SEO"). */
export function quickTakeSeo(name: string, year: number, qt: QuickTake, reports: number, site: string) {
  return {
    title: `${name} review (${year}): what players say | ${site}`,
    description: `${plain(qt.hook.good)} ${plain(qt.hook.catch)} From ${roundedDown(reports)}+ player reports.`,
  };
}
