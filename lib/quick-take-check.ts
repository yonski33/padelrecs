import { COURT_ROWS, gateFor, markCount, plain, quickTakeSchema, type QuickTake } from "./quick-take";

/**
 * Checks a quick-take block against the product's stored reports before it is saved (scripts/save-quicktake.mts).
 * Errors block the save; warnings are printed for the writer to look at. The rules are the recipe's accuracy rules
 * (site-jobs/QUICK-TAKE-RECIPE.md §6) plus the module triggers (§4):
 * - counts and dates match the stored reports, and every cited report belongs to this product
 * - 3+ reports behind every claim, quick answer, compare card and level band; 5+ behind a How it plays row; tips need 2+
 *   different sources
 * - quote marks only around a player's exact words (an excerpt or one of our own reviews; never our own summaries)
 * - at most 3 markers outside the hook; 1–3 modules, each with its trigger met
 */

/** One stored report, as scripts/export-quicktake-input.mts exports it. */
export type Report = {
  id: string; kind: "web" | "own"; platform: string; sourceName: string | null; url: string | null; date: string | null;
  sentiment: "positive" | "mixed" | "negative" | null;
  /** Our summary or translation: readable, but never quotable. */
  summary: string | null;
  /** The player's own words (a web excerpt, or the text of a review posted here): the only quotable text. */
  words: string | null;
};
export type CheckResult = { ok: boolean; errors: string[]; warnings: string[]; block: QuickTake | null };

const norm = (s: string) => s.normalize("NFKC").replace(/[‘’ʼ`´]/g, "'").replace(/[“”«»„]/g, "\"").replace(/\s+/g, " ").trim().toLowerCase();
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50 };
const PEOPLE = "players?|testers?|reviewers?|people|reports?|owners?|users?";
const COUNT_RE = new RegExp(`\\b(\\d{1,3}|${Object.keys(NUMBER_WORDS).join("|")})\\+?\\s+(?:(?:of\\s+(?:the|them)|other|more|different|[a-z-]+)\\s+)?(?:${PEOPLE})\\b`, "gi");
/** Words the recipe bans: "owners"/"users" (padel says players), "copies" (say racket or unit), brand-speak and "N in 10". */
const BANNED: [RegExp, string][] = [
  [/\bowners?\b/i, "say \"players\", not \"owners\""], [/\busers?\b/i, "say \"players\", not \"users\""],
  [/\bcop(y|ies)\b/i, "say \"racket\" or \"unit\", not \"copy\""], [/reddit reviews?/i, "never write \"Reddit reviews\""],
  [/game[- ]changer|unleash|comprehensive review|elevate your/i, "brand-speak"], [/\b\d+\s+(in|out of)\s+10\b/i, "no \"N in 10\" numbers"],
];

/** Every text field of the block with where it sits, and the reports that back it. */
type Field = { where: string; text: string; reports?: string[] };
function fields(qt: QuickTake): Field[] {
  const f: Field[] = [];
  const add = (where: string, text: string | undefined, reports?: string[]) => { if (text) f.push({ where, text, reports }); };
  add("hook.good", qt.hook.good); add("hook.catch", qt.hook.catch);
  if (qt.plays?.verdict) add("plays.verdict", qt.plays.verdict.text); if (qt.catch.verdict) add("catch.verdict", qt.catch.verdict.text);
  if (qt.compare?.verdict) add("compare.verdict", qt.compare.verdict.text);
  qt.modules.forEach((m, i) => { if ("verdict" in m && m.verdict) add(`modules[${i}] ${m.type}.verdict`, m.verdict.text); });
  add("tldr.lead", qt.tldr.lead); qt.tldr.madeFor.forEach((t, i) => add(`tldr.madeFor[${i}]`, t)); qt.tldr.notFor.forEach((t, i) => add(`tldr.notFor[${i}]`, t));
  if (qt.level) { add("level.answer", qt.level.answer, qt.level.reports); add("level.note", qt.level.note, qt.level.reports); }
  if (qt.plays) {
    add("plays.lead", qt.plays.lead);
    for (const [k, z] of Object.entries(qt.plays.court ?? {})) if (z) add(`plays.court.${k}`, z.line, z.reports);
    qt.plays.rows.forEach((r, i) => add(`plays.rows[${i}] ${r.label}`, r.line, r.reports));
  }
  add("catch.lead", qt.catch.lead, qt.catch.reports); qt.catch.bullets.forEach((t, i) => add(`catch.bullets[${i}]`, t, qt.catch.reports));
  qt.modules.forEach((m, i) => {
    const w = `modules[${i}] ${m.type}`;
    const reps = "reports" in m ? m.reports : m.type === "weigh" ? m.weights.map(x => x.id) : m.type === "hardness" ? [...m.soft, ...m.medium, ...m.hard] : undefined;
    if ("lead" in m) add(`${w}.lead`, m.lead, reps);
    if (m.type === "themes") m.bars.forEach((b, j) => add(`${w}.bars[${j}]`, b.label, b.reports));
    if (m.type === "setup") { m.rows.forEach((r, j) => add(`${w}.rows[${j}]`, r.line, reps)); m.numbers?.forEach((n, j) => add(`${w}.numbers[${j}]`, n.note, n.reports)); add(`${w}.note`, m.note, reps); }
    if (m.type === "durability") m.rows.forEach((r, j) => add(`${w}.rows[${j}]`, r.line, reps));
    if (m.type === "version") { add(`${w}.title`, m.title); [...m.pickSelf, ...m.pickOther].forEach((t, j) => add(`${w}.pick[${j}]`, t, reps)); add(`${w}.other.says`, m.other.says, reps); add(`${w}.self.says`, m.self.says, reps); }
    if (m.type === "weigh") [...m.heavy.bullets, ...m.light.bullets].forEach((t, j) => add(`${w}.bullets[${j}]`, t, reps));
    if (m.type === "arm") [...m.kind, ...m.harsh].forEach((t, j) => add(`${w}.bullets[${j}]`, t, reps));
    if (m.type === "hardness") { add(`${w}.answer`, m.answer, reps); add(`${w}.brand`, m.brand); }
  });
  if (qt.compare) {
    add("compare.lead", qt.compare.lead);
    qt.compare.cards.forEach((c, i) => c.arrows.forEach((a, j) => add(`compare.cards[${i}].arrows[${j}]`, a.text, c.reports)));
    if (qt.compare.went) add("compare.went", qt.compare.went.text);
  }
  qt.answers.forEach((a, i) => { add(`answers[${i}].q`, a.q); add(`answers[${i}].badge`, a.badge, a.reports); add(`answers[${i}].a`, a.a, a.reports); });
  qt.tips.forEach((t, i) => add(`tips[${i}]`, t.text, t.reports));
  add("thinSpot", qt.thinSpot);
  return f;
}
const receiptsOf = (qt: QuickTake) => [...(qt.catch.receipts ?? []).map(r => ({ ...r, where: "catch.receipts" })),
  ...qt.modules.flatMap((m, i) => ("receipts" in m ? m.receipts ?? [] : []).map(r => ({ ...r, where: `modules[${i}].receipts` })))];

/** The block's quoted passages ("…" or “…”), to be checked against the players' words. */
export function quotedPassages(text: string) {
  const out: string[] = [];
  for (const m of text.matchAll(/["“]([^"“”]{2,}?)["”]/g)) out.push(m[1]);
  return out;
}

export function checkQuickTake(input: unknown, reports: Report[], opts: { knownSlugs?: Set<string>; selfSlug?: string } = {}): CheckResult {
  const errors: string[] = [], warnings: string[] = [];
  const parsed = quickTakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, block: null, warnings, errors: parsed.error.issues.map(i => `schema: ${i.path.join(".")}: ${i.message}`) };
  const qt = parsed.data;
  const byId = new Map(reports.map(r => [r.id, r]));
  const total = reports.length;
  const verdicts = { positive: 0, mixed: 0, negative: 0 };
  for (const r of reports) if (r.sentiment) verdicts[r.sentiment]++;

  // Gate (recipe §1)
  const gate = gateFor(total);
  if (!gate) errors.push(`gate: only ${total} reports; a quick take needs ${8}+`);
  else if (qt.kind === "full" && gate !== "full") errors.push(`gate: a full page needs 20+ reports, this product has ${total}`);
  if (qt.kind === "short" && (qt.plays || qt.modules.length || qt.compare || qt.level)) errors.push("short page: only hero, TL;DR, The catch, Quick answers, community and specs");

  // Counts snapshot
  const c = qt.counts;
  if (c.reports !== total) errors.push(`counts.reports is ${c.reports}, the database has ${total}`);
  for (const k of ["positive", "mixed", "negative"] as const) if (c[k] !== verdicts[k]) errors.push(`counts.${k} is ${c[k]}, the database has ${verdicts[k]}`);

  const fs = fields(qt);
  // Cited reports exist, belong to this product, and are not listed twice
  const cite = (where: string, list: string[] | undefined) => {
    if (!list) return 0;
    const missing = list.filter(id => !byId.has(id));
    if (missing.length) errors.push(`${where}: ${missing.length} cited report(s) not found for this product (${missing.slice(0, 3).join(", ")})`);
    if (new Set(list).size !== list.length) errors.push(`${where}: a report is cited twice`);
    return new Set(list.filter(id => byId.has(id))).size;
  };
  const need = (where: string, list: string[] | undefined, min: number, what = "reports") => {
    const n = cite(where, list);
    if (n < min) errors.push(`${where}: ${n} ${what} behind it, needs ${min}+`);
    return n;
  };
  const distinctSources = (list: string[]) => new Set(list.map(id => byId.get(id)).filter(Boolean).map(r => (r!.url ?? r!.id).replace(/[?&]lc=.*$/, "").toLowerCase())).size;

  if (qt.level) need("level", qt.level.reports, 3);
  if (qt.level && qt.level.from > qt.level.to) errors.push("level: from is above to");
  need("catch", qt.catch.reports, 3);
  if (qt.plays) {
    const zones = Object.entries(qt.plays.court ?? {}).filter(([, z]) => z);
    zones.forEach(([k, z]) => need(`plays.court.${k}`, z!.reports, 5, "mentions"));
    if (zones.length === 1) errors.push("court map: needs 2+ zones with 5+ mentions each");
    qt.plays.rows.forEach(r => need(`plays.rows ${r.label}`, r.reports, 5, "mentions"));
    if (zones.length) for (const r of qt.plays.rows) if (COURT_ROWS.test(r.label)) warnings.push(`plays row "${r.label}" repeats the court map and isn't shown`);
    for (const r of qt.plays.rows) if (r.key !== undefined) {
      const n = r.key.split(/\s+/).length;
      if (n < 2 || n > 4) errors.push(`plays row "${r.label}": key is ${n} words, 2–4`);
      if (!r.line.startsWith(r.key)) errors.push(`plays row "${r.label}": the line must open with its key "${r.key}"`);
    }
    // At most one marker in How it plays, on the row that decides it for most buyers (owner 2026-11-15).
    const playMarks = markCount(qt.plays.lead) + qt.plays.rows.reduce((n, r) => n + markCount(r.line), 0) + Object.values(qt.plays.court ?? {}).reduce((n, z) => n + (z ? markCount(z.line) : 0), 0);
    if (playMarks > 1) errors.push(`plays: ${playMarks} markers, at most one`);
    if (qt.plays.rows.filter(r => r.chip === "Loved").length > 1) errors.push("plays: at most one Loved chip");
    if (!zones.length && !qt.plays.rows.length) errors.push("plays: needs a court map or rows");
  }
  if (qt.kind === "full" && !qt.plays) warnings.push("full page without How it plays");

  // Modules and their triggers (recipe §4)
  const types = qt.modules.map(m => m.type);
  if (new Set(types).size !== types.length) errors.push("modules: each type at most once");
  if (qt.kind === "full" && !qt.modules.length) warnings.push("full page with no modules (aim for 1–3)");
  for (const [i, m] of qt.modules.entries()) {
    const w = `modules[${i}] ${m.type}`;
    if (m.type === "themes") {
      m.bars.forEach(b => need(`${w} bar "${b.label}"`, b.reports, 8, "mentions"));
      const counts = m.bars.map(b => b.reports.length);
      if (counts.some((n, j) => j > 0 && n > counts[j - 1])) errors.push(`${w}: bars must be sorted, most mentioned first`);
    }
    if (m.type === "setup") { need(w, m.reports, 5); m.numbers?.forEach(n => cite(`${w} number ${n.value}`, n.reports)); }
    if (m.type === "version") {
      need(w, m.reports, 10);
      if (m.other.slug && opts.knownSlugs && !opts.knownSlugs.has(m.other.slug)) errors.push(`${w}: unknown slug ${m.other.slug}`);
    }
    if (m.type === "durability") need(w, m.reports, 5);
    if (m.type === "arm") need(w, m.reports, 6);
    if (m.type === "weigh") {
      const ids = m.weights.map(x => x.id);
      need(w, ids, 8, "players with a weight");
      const g = m.weights.map(x => x.grams);
      if (g.length && Math.max(...g) - Math.min(...g) < 15) errors.push(`${w}: weights span ${Math.max(...g) - Math.min(...g)} g, the trigger is 15 g+`);
      for (const x of m.weights) { const r = byId.get(x.id); const text = r ? `${r.summary ?? ""} ${r.words ?? ""}` : ""; if (r && !text.includes(String(x.grams))) errors.push(`${w}: report ${x.id} doesn't mention ${x.grams}`); }
    }
    if (m.type === "hardness") {
      const n = [m.soft, m.medium, m.hard].map(l => cite(`${w}`, l)), sum = n[0] + n[1] + n[2];
      if (sum < 8) errors.push(`${w}: ${sum} players gave a feel, needs 8+`);
      else if (Math.max(...n) / sum < 0.6) errors.push(`${w}: no feel has 60%+ (${n.join("/")}); skip the module, the Feel row says Divided`);
      const all = [...m.soft, ...m.medium, ...m.hard]; if (new Set(all).size !== all.length) errors.push(`${w}: a report is in two feel groups`);
    }
  }

  // Compare cards: 3+ players each (recipe §3), rivals that exist
  if (qt.compare) for (const card of qt.compare.cards) {
    need(`compare "${card.name}"`, card.reports, 3, "players");
    if (opts.knownSlugs && !opts.knownSlugs.has(card.slug)) errors.push(`compare "${card.name}": ${card.slug} isn't in the catalog; rivals must be catalog rackets`);
    if (card.slug && card.slug === opts.selfSlug) errors.push(`compare "${card.name}": compares with itself`);
  }
  if (qt.kind === "full" && !qt.compare) warnings.push("full page without How it compares");
  // Quick answers: 3+ reports each (owner 2026-11-15), 4–6 on a full page
  qt.answers.forEach(a => need(`answer "${a.q}"`, a.reports, 3));
  if (qt.answers.length > 0 && qt.answers.length < 3) errors.push(`answers: ${qt.answers.length}; 3–6 questions the page hasn't answered yet, or none`);
  // Tips: 2+ different sources, at their section
  for (const t of qt.tips) {
    cite(`tip "${t.text.slice(0, 30)}…"`, t.reports);
    if (distinctSources(t.reports) < 2) errors.push(`tip "${t.text.slice(0, 40)}…": needs 2+ different sources`);
    const place = t.after;
    const present = ["tldr", "catch", "answers"].includes(place) || (place === "plays" && qt.plays) || (place === "compare" && qt.compare) || types.includes(place as never);
    if (!present) errors.push(`tip "${t.text.slice(0, 30)}…": goes after "${place}", which isn't on the page`);
  }
  if (qt.tips.length < 2) warnings.push(`${qt.tips.length} tip notes (aim for 2–4, never invented)`);

  // Quote marks only on verbatim text; counts in the text no bigger than the reports behind them; banned words
  const quotable = reports.filter(r => r.words).map(r => norm(r.words!));
  const isVerbatim = (s: string) => { const n = norm(s); return n.length > 0 && quotable.some(q => q.includes(n)); };
  for (const f of fs) {
    const text = plain(f.text);
    for (const q of quotedPassages(text)) if (!isVerbatim(q)) errors.push(`${f.where}: quote marks on words no player wrote: "${q}"`);
    // The thin spot says how little backs a part of the page ("only 3 players compared it"); its numbers are caveats, not claims.
    if (f.where !== "thinSpot") for (const m of text.matchAll(COUNT_RE)) {
      const raw = m[1].toLowerCase(), n = NUMBER_WORDS[raw] ?? Number(raw);
      const backed = f.reports ? new Set(f.reports).size : 0;
      if (!f.reports) errors.push(`${f.where}: says "${m[0]}" but cites no reports`);
      else if (n > backed) errors.push(`${f.where}: says "${m[0]}" but cites ${backed}`);
    }
    for (const [re, why] of BANNED) if (re.test(text)) errors.push(`${f.where}: ${why} ("${text.match(re)![0]}")`);
  }
  for (const r of receiptsOf(qt)) {
    if (!byId.has(r.id)) errors.push(`${r.where}: report ${r.id} not found for this product`);
    else if (r.verbatim && !isVerbatim(r.text)) errors.push(`${r.where}: marked verbatim but isn't the player's exact words: ${r.text.slice(0, 50)}`);
    else if (!r.verbatim) for (const q of quotedPassages(r.text)) if (!isVerbatim(q)) errors.push(`${r.where}: quote marks on words no player wrote: "${q}"`);
    for (const [re, why] of BANNED.slice(0, 4)) if (re.test(r.text)) errors.push(`${r.where}: ${why}`);
  }
  const nReceipts = receiptsOf(qt).length;
  if (qt.kind === "full" && (nReceipts < 6 || nReceipts > 10)) warnings.push(`${nReceipts} receipts on the page (aim for 6–10)`);

  // Marker: the hook's catch has its own; at most 3 more outside the community section (recipe §7)
  // Hook (owner 2026-11-15): 8–10 words, one standout trait in at most 5, then the catch.
  const words = (t: string) => plain(t).split(/\s+/).filter(Boolean).length;
  if (words(qt.hook.good) + words(qt.hook.catch) > 10) errors.push(`hook: ${words(qt.hook.good) + words(qt.hook.catch)} words, at most 10`);
  if (words(qt.hook.good) > 5) errors.push(`hook.good: ${words(qt.hook.good)} words, at most 5 (one standout trait)`);
  if (markCount(qt.hook.good) || markCount(qt.hook.catch)) errors.push("hook: no ==marker== inside; the catch is marked on its own");
  const marks = fs.filter(f => !f.where.startsWith("hook.")).reduce((n, f) => n + markCount(f.text), 0);
  if (marks > 3) errors.push(`${marks} markers outside the hook; at most 3`);
  return { ok: errors.length === 0, errors, warnings, block: qt };
}
