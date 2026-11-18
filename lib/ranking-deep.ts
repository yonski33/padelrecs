// "Get to know the top 10" (owner-approved mock 2026-11-19, https://claude.ai/artifact/1SraSpcRFykkPTXZCC3FVB): the words of
// each block and the quick picks, worked out from data the site already has: the bars a product page shows (trait dots, the
// expert's where set), the racket page's sourced Why yes / Why not items (db/racket-page), the quick take's player tips, the
// tag counts and the Player score. A line without real evidence behind it is left out, never written from nothing.
// Copy rules: lines ≤ 105 characters, no em dashes, no "we/us", no counts inside advice, no testing claims, praise only in
// "What people love", and no line against the racket's own bars (lib/content-consistency.ts). Pure, so tests feed plain objects.
import { claims, contradicts } from "./content-consistency";
import { lineProblem } from "./expert-play";

export const DEEP_MAX = 105, PICK_MAX = 60;
/** The bars each block shows, in order: [trait key, label]. */
export const DEEP_BARS: [string, string][] = [["power", "Power"], ["control", "Control"], ["arm", "Comfort"], ["speed", "Speed"]];
/** A tag pill needs this many mentions (owner rule: counts under 5 are hidden). */
export const MIN_TAG_PILL = 5;

export type Dots = Partial<Record<string, number>>;
export type DeepItem = { title: string; t: string; src: (string | number)[] };
export type DeepRow = { id: string; rank: number; signal: number | null; dots: Dots; grams: number | null; shape: string | null; balance: string | null;
  /** Tag → mentions across the racket's reviews and reports. */ tags: Record<string, number>; reports: number; beginner: number | null;
  yes: DeepItem[]; no: DeepItem[] };

const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;
const plain = (t: string) => t.replace(/==/g, "").replace(/\s+/g, " ").trim();
/** A line the page may show: within the length, no em dash, and none of the expert-line faults (counts, we/us, testing). */
export const lineOk = (t: string | null | undefined, max = DEEP_MAX): t is string => !!t && t.length <= max && !/[—]/.test(t) && lineProblem(t) === null;
const sources = (i: DeepItem) => new Set(i.src.map(String)).size;
/** Comfort words the claim rules don't read ("comfortable", "kind to sore elbows"): never beside a Comfort bar under 4 (owner
 *  rule: no "comfortable" with Comfort at 2/5). */
const COMFY = /\b(comfortable|comfy|cushioned|kind to (sore )?(the )?(arm|elbow|wrist)s?|easy on (sore )?(the )?(arm|elbow|wrist)s?|arm[- ]friendly)\b/i;
/** A line its bars contradict (lib/content-consistency.ts, plus the comfort words above). */
export const against = (t: string, dots: Dots) => !!contradicts(t, dots) || (COMFY.test(t) && (dots.arm ?? 0) > 0 && (dots.arm ?? 0) < 4);
/** An item with 2+ distinct sources that its bars don't contradict, most-sourced first. */
const usable = (items: DeepItem[], dots: Dots) => items.filter(i => sources(i) >= 2 && !against(`${i.title}. ${i.t}`, dots))
  .map((i, k) => ({ i, k })).sort((a, b) => sources(b.i) - sources(a.i) || a.k - b.k).map(x => x.i);

/** Praise tags as nouns for "most praised for its …". */
const TAG_NOUN: Record<string, string> = { "good control": "control", forgiving: "forgiveness", "fast at the net": "speed at the net", "arm-friendly": "arm comfort",
  "easy power": "easy power", "great on smashes": "smashes", "great in defence": "defence", "good spin": "spin" };
/** The one bar a racket leads the whole list on, alone: [trait, phrase]. */
const LEADS: Record<string, string> = { forgiveness: "the most forgiving in the top 10", power: "the hardest hitter in the top 10", control: "the most precise in the top 10",
  defence: "the strongest in defence in the top 10", arm: "the kindest on the arm in the top 10", speed: "the quickest at the net in the top 10" };
const leadOf = (row: DeepRow, all: DeepRow[]) => Object.keys(LEADS).find(k => { const d = row.dots[k] ?? 0; return d >= 4 && all.every(o => o === row || (o.dots[k] ?? 0) < d); }) ?? null;
/** Mentions as a share of the racket's reports. */
const share = (row: DeepRow, tags: string[]) => tags.reduce((a, t) => a + (row.tags[t] ?? 0), 0) / Math.max(1, row.reports);

/** "Why it's #N here": where it stands on the Player score, and what sets it apart (a bar it leads alone, else its most
 *  mentioned praise that its bars back). */
export function whyLine(row: DeepRow, prev: DeepRow | null, all: DeepRow[], season: string): string | null {
  if (row.signal === null) return null;
  const stand = !prev || prev.signal === null ? `Top player score ${season}`
    : prev.signal === row.signal ? `Level with #${prev.rank} on player score` : prev.signal - row.signal <= 2 ? `Just behind #${prev.rank} on player score` : `Next on player score after #${prev.rank}`;
  const lead = leadOf(row, all);
  const praise = Object.entries(row.tags).filter(([t, n]) => TAG_NOUN[t] && n >= MIN_TAG_PILL && !against(t, row.dots)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => TAG_NOUN[t]);
  const why = (lead ? LEADS[lead] : null) ?? (praise.length ? `most praised for its ${praise.join(" and ")}` : null);
  // The line reads after its label ("Why it's #1 here: "), so the two together keep to the limit.
  const max = DEEP_MAX - `Why it's #${row.rank} here: `.length, t = why ? `${stand}, and ${why}.` : `${stand}.`;
  return lineOk(t, max) ? t : lineOk(`${stand}.`, max) ? `${stand}.` : null;
}

/** "What people love": the most-sourced praise item as one sentence, with no catch inside it. */
export function loveLine(row: DeepRow): { line: string; item: DeepItem } | null {
  for (const i of usable(row.yes, row.dots)) {
    const t = plain(i.t);
    if (/[“”"]/.test(t) || claims(t).some(c => c.dir < 0) || /\b(but|though|although|however)\b/i.test(t)) continue;
    if (lineOk(t, DEEP_MAX - "What people love: ".length)) return { line: t, item: i };
  }
  return null;
}
/** "What to watch": the most-sourced catch item as one sentence. */
export function watchLine(row: DeepRow): { line: string; item: DeepItem } | null {
  for (const i of usable(row.no, row.dots)) { const t = plain(i.t); if (!/[“”"]/.test(t) && lineOk(t, DEEP_MAX - "What to watch: ".length)) return { line: t, item: i }; }
  return null;
}

/** "Skip it if …": who a catch matters to, from a sourced Why not item, as a clause. A catch about durability or weather says
 *  nothing about who should skip it, so it is passed over. */
const SKIP: { re: RegExp; clause: string; bar?: [string, number] }[] = [
  { re: /\b(not a beginner|not a first racket|technique|timing)\b/i, clause: "you are still learning the strokes; it rewards good technique" },
  { re: /\b(small(er)? sweet spot|less forgiving|punish|mishits get)\b/i, clause: "you mishit often; off-centre hits get little help", bar: ["forgiveness", 3] },
  { re: /\b(no free power|little free (power|pace)|power takes effort|smashes need|need a full|your own arm|less free power|not explosive)\b/i, clause: "you want free power on flat smashes", bar: ["power", 3] },
  { re: /\b(bouncy|lively|trampoline|fly long|run long|run away)\b/i, clause: "you want a calm, low-rebound block at the net" },
  { re: /\b(harsh|elbow|shoulder pain|arm pain)\b/i, clause: "your elbow or wrist is sore", bar: ["arm", 3] },
  { re: /\b(heavy|head-heavy|late|slow to manoeuvre)\b/i, clause: "you want the lightest, quickest hands at the net", bar: ["speed", 3] },
  { re: /\b(firm|stiff|hard)\b/i, clause: "you like a soft, cushioned feel" },
];
/** Catches about the weather or wear say when, not who: no "skip it if" from them ("stiff on a cold day" is not a firm racket). */
const WHEN = /\b(cold|heat|hot|warm|weather|winter|summer|temperature|chips?|cracks?|peel|wears?|durab\w*|screws?|break)\b/i;
/** `avoid`: the item "What to watch" already says, tried last. `used`: clauses earlier blocks said, tried after the fresh ones. */
export function skipLine(row: DeepRow, avoid?: DeepItem, used: Set<string> = new Set()): string | null {
  const items = usable(row.no, row.dots), order = [...items.filter(x => x !== avoid), ...items.filter(x => x === avoid)];
  const found = order.flatMap(i => { const text = `${i.title}. ${plain(i.t)}`; if (WHEN.test(text)) return [];
    const s = SKIP.find(x => x.re.test(text) && (!x.bar || (row.dots[x.bar[0]] ?? 0) <= x.bar[1]));
    return s ? [`Skip it if ${s.clause}.`] : []; }).filter(t => lineOk(t));
  return found.find(t => !used.has(t)) ?? found[0] ?? null;
}

/** A player tip from the quick take with 2+ players behind it, as advice only: the sentences that count or name players go,
 *  the rest stays if it is still a whole line (the product page's own rule, app/rackets/[slug]/racket-fit.tsx). */
export function tipLine(tips: { text: string; reports: unknown[] }[] | undefined, clean: (t: string) => string = t => t): string | null {
  for (const tip of tips ?? []) {
    if (tip.reports.length < 2) continue;
    const t = clean(tip.text).split(/(?<=[.!?])\s+/).filter(x => !/\b(players?|reviewers?|people|testers?|one|two|three|four|five)\b/i.test(x)).join(" ").trim();
    if (t.length >= 20 && lineOk(t)) return t;
  }
  return null;
}

/** Each trait as a gain ("is quicker at the net") for "Compared with #N+1". */
const MORE: Record<string, string> = { forgiveness: "is more forgiving", power: "hits harder", control: "is more precise", defence: "is better in defence",
  arm: "is easier on the arm", speed: "is quicker at the net" };
const and = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "";
/** "is more forgiving and better in defence": a repeated "is" goes. */
const preds = (xs: string[]) => and(xs.map((x, i) => i > 0 && xs[0].startsWith("is ") && x.startsWith("is ") ? x.slice(3) : x));
/** "The Nox is quicker at the net; the Adidas is more forgiving." `ok(key, dir)`: may this one be called better (1) or worse
 *  (−1) than the next on the trait (lib/claim-guard.ts, the product page's rule for "more X than"). */
export function comparedLine(me: string, next: string, ok: (key: string, dir: 1 | -1) => boolean, max = DEEP_MAX): string | null {
  const keys = Object.keys(MORE), up = keys.filter(k => ok(k, 1)), down = keys.filter(k => ok(k, -1));
  const none = "No clear edge on the bars; the player score sets them apart.";
  if (!up.length && !down.length) return none;
  // Both sides where there are both, two traits a side at most, fewer when the line runs long, one side as the last resort.
  for (const [a, b] of [[2, 2], [1, 2], [2, 1], [1, 1], [1, 0], [0, 1]]) {
    const ups = up.slice(0, a), downs = down.slice(0, b);
    if (!ups.length && !downs.length) continue;
    const t = [ups.length ? `The ${me} ${preds(ups.map(k => MORE[k]))}` : null, downs.length ? `${ups.length ? "the" : "The"} ${next} ${preds(downs.map(k => MORE[k]))}` : null].filter(Boolean).join("; ") + ".";
    if (lineOk(t, max)) return t;
  }
  return null;
}

/** The quick picks: a label, the racket and a reason under 60 characters. A racket whose own catch speaks against the label
 *  (`against`) is passed over; ties go to the stronger tag share, then the Player score. */
export type QuickPick = { label: string; id: string; reason: string };
type PickRule = { label: string; key: (r: DeepRow) => number; tags: string[]; against?: RegExp; gate?: (r: DeepRow) => boolean;
  reason: (r: DeepRow, alone: boolean) => string | null };
const d = (r: DeepRow, k: string) => r.dots[k] ?? 0;
const RULES: PickRule[] = [
  { label: "Best for beginners", key: r => d(r, "forgiveness") * 100 + (r.beginner ?? 0), tags: ["forgiving"], against: /\b(not a beginner|not a first racket|technique)\b/i,
    reason: r => `${d(r, "forgiveness") >= 5 ? "A big sweet spot" : "A forgiving sweet spot"}${/round/i.test(r.shape ?? "") ? " and a round shape" : ""}, so mishits still play` },
  { label: "Softest on the arm", key: r => d(r, "arm"), tags: ["arm-friendly", "soft"], against: /\b(harsh|elbow|arm pain)\b/i, gate: r => d(r, "arm") >= 4,
    reason: (_, alone) => alone ? "The kindest on the arm in the top 10" : "Among the kindest on the arm here" },
  { label: "Hardest smash", key: r => d(r, "power"), tags: ["great on smashes", "easy power"], against: /\b(smashes need|no free power|little free|power takes effort|less free power|not explosive)\b/i,
    reason: (r, alone) => alone ? "The hardest hitter in the top 10" : /high/i.test(r.balance ?? "") ? "Head-heavy punch, with the most smash praise here" : "Strong power, with the most smash praise here" },
  { label: "Best at the net", key: r => d(r, "speed"), tags: ["fast at the net"], against: /\b(late|slow|heavy at the net)\b/i,
    reason: (_, alone) => alone ? "The quickest hands in the top 10" : "Quick hands, with the most net praise here" },
  { label: "Best for control", key: r => d(r, "control"), tags: ["good control"], against: /\b(hard to control|less control)\b/i,
    reason: (_, alone) => alone ? "The most precise racket in the top 10" : "Precise, with the most control praise here" },
  { label: "Best for defenders", key: r => d(r, "defence"), tags: ["great in defence"], against: /\b(defence|blocking)\b/i,
    reason: (_, alone) => alone ? "The strongest in defence in the top 10" : "Strong from the back, with the most defence praise" },
  { label: "Lightest and fastest", key: r => r.grams === null ? -Infinity : -Math.round(r.grams) * 10 + d(r, "speed"), tags: ["fast at the net"], gate: r => r.grams !== null && d(r, "speed") >= 4,
    reason: (r, alone) => `${alone ? "The lightest here" : "Among the lightest here"}, and quick at the net` },
  { label: "Best all-rounder", key: r => { const k = ["power", "control", "speed", "forgiveness", "defence"].map(x => d(r, x)); return Math.min(...k) * 100 + k.reduce((a, b) => a + b, 0); }, tags: [],
    gate: r => ["power", "control", "speed", "forgiveness", "defence"].every(x => d(r, x) >= 4),
    reason: () => "Power, control, speed and sweet spot all rate well" },
];
export function quickPicks(rows: DeepRow[]): QuickPick[] {
  return RULES.flatMap(rule => {
    const pool = rows.filter(r => r.signal !== null && (!rule.gate || rule.gate(r)) && !(rule.against && usable(r.no, r.dots).some(i => rule.against!.test(`${i.title}. ${plain(i.t)}`))));
    if (!pool.length) return [];
    const best = Math.max(...pool.map(rule.key)), top = pool.filter(r => rule.key(r) === best);
    const win = [...top].sort((a, b) => share(b, rule.tags) - share(a, rule.tags) || (b.signal ?? 0) - (a.signal ?? 0) || a.rank - b.rank)[0];
    const reason = rule.reason(win, top.length === 1);
    return reason && lineOk(reason, PICK_MAX - 1) ? [{ label: rule.label, id: win.id, reason }] : [];
  });
}

/** The tag pills: the most mentioned, 5+ mentions, never one its bars contradict. */
export function tagPills(row: DeepRow, tone: (t: string) => string, max = 3): { tag: string; n: number; tone: string }[] {
  return Object.entries(row.tags).filter(([t, n]) => n >= MIN_TAG_PILL && !against(t, row.dots) && tone(t) !== "neutral").sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max).map(([tag, n]) => ({ tag, n, tone: tone(tag) }));
}
