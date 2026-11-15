// DiscGolfRecs into the evidence store (ENGINE-PLAN.md step 6; owner OK 2026-11-15 via the PM: profile, targeted reader
// pass, discgolfrecs DB writes). Profile: lib/discgolf-profile.ts. Steps:
//   backfill [--write]                   rows from data we already hold: quick tags (quality / axis), "beginner-friendly" as a
//                                        suits row, the review form's level and max distance (suits rows: that writer's
//                                        verdict) and the maker's flight numbers, plastics, rim and max weight (facts)
//   export <dir> [size]                  the targeted reader input: all YouTube and blog summaries, own reviews, and forum
//                                        reports that use level / arm / glide / grip / beat-in / wind / "numbers" words
//   check <dir> [--sample N] [--write]   readers' output → rows; every quote must be found verbatim in that report's text
//   scores [--json out] [--csv out]      the scores (0–100) with raw counts and the flight-number prior, ENGINE-ALGO step 2
//                                        smoothing (k = 8); read-only
//   gaps <out.csv>                       the expert gap sheet (pickleball format + level and arm-speed columns); read-only
//   NICHE=discgolf npx tsx --conditions=react-server --env-file=.env.local scripts/discgolf-evidence.mts <step> …
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { ratingVerdict } from "../lib/top-lists";
import { plainSummary } from "../lib/plain-summary";
import { scoreAll } from "../lib/attr-score";
import { DISCGOLF as profile, DISC_GROUPS, flightOf, flightPrior, beginnerGated } from "../lib/discgolf-profile";
import type { EvidenceRow, SourceKind, Strength } from "../lib/evidence";

if (niche.id !== "discgolf") throw new Error("Run with NICHE=discgolf.");
const [step, ...rest] = process.argv.slice(2);
const data = await catalog();
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const VALUE = { positive: 1, mixed: 0, negative: -1 } as const;
const kindOf = (platform: string): SourceKind => platform === "YouTube" ? "youtube" : platform === "Blog" ? "blog" : "player_report";
const good = new Set(niche.tags.filter(t => t.tone === "pos").map(t => t.label));
type Report = { productId: string; ref: string; kind: SourceKind; author: string | null; at: string | null; verdict: -1 | 0 | 1 | null; tags: string[];
  texts: Record<string, string>; formLevel: string | null; formArm: string | null };
// One voice per writer: a YouTube channel or a blog site by its name; a forum report or a YouTube comment by its URL (the forum's
// source_name is the subreddit, so it would merge every forum writer into one voice).
const authorOf = (e: { sourcePlatform: string; sourceName: string | null; sourceUrl: string | null; id: string }) =>
  (e.sourcePlatform === "YouTube" && !/[?&]lc=/.test(e.sourceUrl ?? "")) || e.sourcePlatform === "Blog" ? (e.sourceName ? `${e.sourcePlatform}:${hash(e.sourceName.toLowerCase())}` : null)
    : `${e.sourcePlatform}:${hash(e.sourceUrl || e.id)}`;
const reports: Report[] = [
  ...data.reviews.map(r => ({ productId: r.racketId, ref: `p:${r.id}`, kind: "own_review" as const, author: r.alias ? `own:${hash(r.alias.toLowerCase())}` : `p:${r.id}`,
    at: r.createdAt, verdict: VALUE[ratingVerdict(r.rating)], tags: r.tags, texts: (r.reviewText ? { review: r.reviewText } : {}) as Record<string, string>, formLevel: r.playerLevel, formArm: r.playingStyle })),
  ...data.external.map(e => ({ productId: e.racketId, ref: `w:${e.id}`, kind: kindOf(e.sourcePlatform), author: authorOf(e),
    at: e.sourceDate || e.createdAt, verdict: e.sentiment ? VALUE[e.sentiment] : null, tags: e.tags,
    texts: Object.fromEntries(Object.entries({ summary: e.summary ? plainSummary(e.summary) : null, excerpt: e.excerpt, translation: e.sourceLanguage && e.sourceLanguage !== "en" ? e.excerptTranslation : null })
      .filter((x): x is [string, string] => typeof x[1] === "string" && x[1].trim().length > 0)), formLevel: null, formArm: null })),
];
const byRef = new Map(reports.map(r => [r.ref, r]));
const EX = { tags: "dg-tags-v1", form: "dg-form-v1", specs: "dg-specs-v1", reader: "dg-reader-v1" };
const GROUPS = new Set<string>(DISC_GROUPS.map(g => g.key));
// The review form's answers (lib/niche/discgolf.ts profile) as groups.
const FORM_LEVEL: Record<string, string> = { Beginner: "beginner", Casual: "intermediate", Intermediate: "intermediate", Advanced: "advanced", "Pro or elite": "advanced" };
const FORM_ARM: Record<string, string> = { "Under 250 ft": "arm_slow", "250–325 ft": "arm_mid", "325–400 ft": "arm_fast", "400 ft +": "arm_fast" };

async function save(rows: EvidenceRow[], kinds: string[]) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by in (${sql.join(kinds.map(k => sql`${k}`), sql`, `)})`);
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(chunk.map(r =>
        sql`(${r.productId}, ${niche.id}, ${r.sourceKind}, ${r.sourceRef}, ${r.authorKey}, ${r.attribute}, ${r.value}, ${r.valueText}, ${r.strength}, ${r.quote}, ${r.saidAt}, ${r.extractedBy}, ${now})`), sql`, `)}
        on conflict (product_id, source_kind, source_ref, attribute, extracted_by) do nothing`);
    }
  });
  console.log(`saved ${rows.length} rows (${kinds.join(", ")}) into ${niche.schema}.evidence`);
}
const row = (x: Report, attribute: string, value: number | null, strength: Strength, quote: string | null, extractedBy: string, valueText: string | null = null, refSuffix = ""): EvidenceRow =>
  ({ productId: x.productId, sourceKind: x.kind, sourceRef: `${x.ref}${refSuffix}`, authorKey: x.author, attribute, value, valueText, strength, quote, saidAt: x.at, extractedBy });

/** Per product: positive / mixed / negative report counts (the new engine's quality step). */
function reportCounts() {
  const c = new Map(data.rackets.map(r => [r.id, { reports: 0, positive: 0, mixed: 0, negative: 0 }]));
  for (const x of reports) { const o = c.get(x.productId); if (!o) continue; o.reports++; if (x.verdict === 1) o.positive++; else if (x.verdict === 0) o.mixed++; else if (x.verdict === -1) o.negative++; }
  return c;
}
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0; };
const flights = new Map(data.rackets.map(p => [p.id, flightOf(p.weight)]));
const known = [...flights.values()].filter((f): f is NonNullable<typeof f> => !!f);
const MID = { tf: median(known.map(f => f.turn + f.fade)), glide: median(known.map(f => f.glide)) };

if (step === "backfill") {
  const rows: EvidenceRow[] = [];
  const tagAttrs = profile.attrs.filter(a => a.kind === "quality" || a.kind === "axis");
  for (const x of reports) {
    for (const tag of x.tags) {
      // A good tag doesn't count on a negative report (as the finder counts them).
      if (good.has(tag) && x.verdict === -1) continue;
      for (const a of tagAttrs) for (const [list, sign] of [[a.plus, 1], [a.minus, -1]] as const)
        for (const [t, w] of list ?? []) if (t === tag) rows.push(row(x, a.key, sign, w, null, EX.tags, null, `#tag:${tag}`));
      if (tag === "beginner-friendly") rows.push(row(x, "suits_beginner", 1, 1, null, EX.tags, null, `#tag:${tag}`));
    }
    if (x.verdict !== null) {
      const lv = x.formLevel && FORM_LEVEL[x.formLevel], arm = x.formArm && FORM_ARM[x.formArm];
      if (lv) rows.push(row(x, `suits_${lv}`, x.verdict, 1, null, EX.form, "form"));
      if (arm) rows.push(row(x, `suits_${arm}`, x.verdict, 1, null, EX.form, "form"));
    }
  }
  for (const p of data.rackets) {
    const base = { productId: p.id, sourceKind: "maker" as const, sourceRef: `spec:${p.id}`, authorKey: "maker", strength: 1 as Strength, saidAt: null, extractedBy: EX.specs };
    const f = flights.get(p.id);
    if (f) {
      rows.push({ ...base, attribute: "flight", value: null, valueText: p.weight!.trim(), quote: p.weight });
      for (const k of ["speed", "glide", "turn", "fade"] as const) rows.push({ ...base, attribute: `flight_${k}`, value: f[k], valueText: null, quote: p.weight });
    }
    if (p.core?.trim()) rows.push({ ...base, attribute: "plastics", value: null, valueText: p.core.trim(), quote: p.core });
    const rim = Number((p.balance ?? "").match(/\d+(\.\d+)?/)?.[0] ?? NaN);
    if (rim) rows.push({ ...base, attribute: "rim", value: rim, valueText: p.balance, quote: p.balance });
    const mw = Number((p.surface ?? "").match(/\d+(\.\d+)?/)?.[0] ?? NaN);
    if (mw) rows.push({ ...base, attribute: "max_weight", value: mw, valueText: p.surface, quote: p.surface });
  }
  const count = (pred: (r: EvidenceRow) => boolean) => rows.filter(pred).length;
  console.log(`rows ${rows.length}: tags ${count(r => r.extractedBy === EX.tags)}, form ${count(r => r.extractedBy === EX.form)}, specs ${count(r => r.extractedBy === EX.specs)}`);
  for (const a of profile.attrs.filter(a => a.kind !== "fact")) console.log(`  ${a.key}: ${count(r => r.attribute === a.key)}`);
  console.log(`  flight on ${count(r => r.attribute === "flight")} of ${data.rackets.length} discs; median turn+fade ${MID.tf}, glide ${MID.glide}`);
  if (rest.includes("--write")) await save(rows, [EX.tags, EX.form, EX.specs]);
} else if (step === "export") {
  const [out, size = "130"] = rest;
  if (!out) throw new Error("export <dir> [size]");
  const words = /beginner|newer? (player|thrower)|first (disc|year|bag|driver)|noob|newbie|novice|slow arm|low (arm|power)|arm speed|big arm|noodle|\b\d{3} ?(ft|feet|foot|'|rated)|rated \d{3}|rating|power|advanced|\bpros?\b|\bams?\b|league|beat|seasoned|broke in|broken in|grip|tacky|slick|slippery|gummy|glide|float|than (its|the) numbers|more stable|less stable|wind/i;
  const name = new Map(data.rackets.map(p => [p.id, p])), listed = new Set(data.listed.map(p => p.id));
  const pick = reports.filter(x => listed.has(x.productId)).filter(x => { const t = Object.values(x.texts).join(" "); return t.length >= 25 && (x.kind !== "player_report" || words.test(t)); });
  mkdirSync(join(out, "in"), { recursive: true });
  const n = Number(size), items = pick.map(x => { const p = name.get(x.productId)!; return { id: x.ref, product: p.name, type: p.shape, flight: p.weight, ...x.texts }; });
  for (let i = 0; i < items.length; i += n) writeFileSync(join(out, "in", `b${String(i / n).padStart(3, "0")}.json`), JSON.stringify(items.slice(i, i + n)));
  console.log(`targeted pass: ${items.length} reports (YouTube ${pick.filter(x => x.kind === "youtube").length}, blog ${pick.filter(x => x.kind === "blog").length}, own ${pick.filter(x => x.kind === "own_review").length}, forum ${pick.filter(x => x.kind === "player_report").length}) in ${Math.ceil(items.length / n)} batches`);
} else if (step === "check") {
  const [dir] = rest.filter(a => !a.startsWith("--") && !/^\d+$/.test(a));
  const sampleN = rest.includes("--sample") ? Number(rest[rest.indexOf("--sample") + 1]) || 30 : 0;
  const ATTRS = new Set(["stability", "glide", "grip", "beat_in", "accuracy", "distance", "wind", "forehand", "suits", "writer"]);
  const rows: (EvidenceRow & { text: string })[] = [], dropped: unknown[] = [];
  const outDir = join(dir, "out");
  let reportsRead = 0;
  for (const f of readdirSync(outDir).filter(f => f.endsWith(".json")).sort()) {
    const got = JSON.parse(readFileSync(join(outDir, f), "utf8")) as Record<string, { attribute: string; value?: number; group?: string; strength?: number; quote?: string }[]>;
    for (const [ref, list] of Object.entries(got)) {
      const x = byRef.get(ref); if (!x || !Array.isArray(list)) { dropped.push({ ref, why: "unknown report" }); continue; }
      reportsRead++;
      const text = Object.values(x.texts).join("\n"), seen = new Set<string>();
      for (const r of list) {
        const grouped = r.attribute === "suits" || r.attribute === "writer";
        const why = !ATTRS.has(r.attribute) ? "attribute" : grouped && (!r.group || !GROUPS.has(r.group)) ? "group"
          : r.attribute !== "writer" && ![1, -1].includes(r.value as number) ? "value"
          : r.attribute !== "writer" && ![0.5, 1, 1.5].includes(r.strength as number) ? "strength" : null;
        const quoteOk = !!r.quote && r.quote.length >= 6 && Object.values(x.texts).some(t => t.includes(r.quote!));
        if (why || !quoteOk) { dropped.push({ ref, row: r, why: why ?? "quote not verbatim" }); continue; }
        const key = grouped ? `suits_${r.group}` : r.attribute;
        if (seen.has(key)) continue; seen.add(key);
        // The writer's own group carries that writer's verdict (mixed = 0), as skin's skin types; a statement about a group
        // carries its own +1 / −1.
        if (r.attribute === "writer") { if (x.verdict !== null) rows.push({ ...row(x, key, x.verdict, 1, r.quote!, EX.reader, `writer:${r.group}`), text }); }
        else rows.push({ ...row(x, key, r.value!, r.strength as Strength, r.quote!, EX.reader), text });
      }
    }
  }
  writeFileSync(join(dir, "rows.jsonl"), rows.map(({ text: _t, ...r }) => JSON.stringify(r)).join("\n"));
  writeFileSync(join(dir, "dropped.jsonl"), dropped.map(d => JSON.stringify(d)).join("\n"));
  const by = rows.reduce((m, r) => m.set(r.attribute, (m.get(r.attribute) ?? 0) + 1), new Map<string, number>());
  console.log(`reports read ${reportsRead}, reader rows ${rows.length}, dropped ${dropped.length}: ${JSON.stringify(Object.fromEntries([...by].sort()))}`);
  if (sampleN) for (const r of [...rows].sort(() => Math.random() - 0.5).slice(0, sampleN)) console.log(`\n[${r.attribute} ${r.value} s${r.strength}${r.valueText ? " " + r.valueText : ""}] "${r.quote}"\n   ${r.text.slice(0, 400).replace(/\n/g, " | ")}`);
  if (rest.includes("--write")) await save(rows.map(({ text: _t, ...r }) => r), [EX.reader]);
} else if (step === "scores" || step === "gaps") {
  const rows = await evidenceRows(), counts = reportCounts();
  const products = data.listed;
  const base = scoreAll(profile, products.map(p => { const c = counts.get(p.id)!; const j = c.positive + c.mixed + c.negative; return { id: p.id, shape: p.shape, reports: c.reports, verdict: j ? (c.positive - c.negative) / j : null }; }), rows);
  // Voices: one author (or one report), netted per attribute.
  const voices = new Map<string, Map<string, Map<string, number>>>();
  for (const r of rows) {
    if (r.value === null || r.sourceKind === "maker") continue;
    const p = voices.get(r.productId) ?? new Map(); voices.set(r.productId, p);
    const a = p.get(r.attribute) ?? new Map<string, number>(); p.set(r.attribute, a);
    const k = r.authorKey ?? r.sourceRef.split("#")[0]; a.set(k, (a.get(k) ?? 0) + r.value * r.strength);
  }
  const K = 8; // ENGINE-ALGO step 2: (mentions·raw + k·prior) / (mentions + k)
  type Out = { score: number | null; raw: number | null; prior: number | null; n: number; plus: number; minus: number; mixed: number };
  const result = products.map(p => {
    const prior = flightPrior(flights.get(p.id) ?? null, MID), c = counts.get(p.id)!, scores: Record<string, Out> = {};
    for (const a of profile.attrs.filter(a => a.kind !== "fact")) {
      const v = [...(voices.get(p.id)?.get(a.key)?.values() ?? [])];
      const plus = v.filter(x => x > 0).length, minus = v.filter(x => x < 0).length, mixed = v.filter(x => x === 0).length, n = v.length;
      const pr = prior[a.key] ?? null;
      if (a.kind === "quality") { const s = base.get(p.id)!.scores[a.key]; scores[a.key] = { score: s?.score ?? null, raw: s?.score ?? null, prior: null, n, plus, minus, mixed }; continue; }
      const raw = n ? Math.round(a.kind === "axis" ? 50 + 50 * (plus - minus) / Math.max(1, plus + minus) : 50 + 50 * v.reduce((s, x) => s + Math.max(-1, Math.min(1, x)), 0) / n) : null;
      // No prior (grip, beat-in): no score below minAxis voices; with a prior the flight numbers start it.
      const score = raw === null ? pr : pr === null ? (n >= profile.minAxis ? raw : null) : Math.round((n * raw + K * pr) / (n + K));
      scores[a.key] = { score, raw, prior: pr, n, plus, minus, mixed };
    }
    const gated = beginnerGated(prior.suits_beginner, scores.suits_beginner.n ? { score: scores.suits_beginner.raw!, n: scores.suits_beginner.n } : null);
    return { id: p.id, name: p.name, slug: p.slug, type: p.shape, flight: p.weight, ...c, evidence: rows.filter(r => r.productId === p.id && r.sourceKind !== "maker").length, beginnerGated: gated, scores };
  });
  if (step === "scores") {
    for (const a of profile.attrs.filter(a => a.kind !== "fact")) {
      const have = result.filter(r => r.scores[a.key].score !== null), voiced = result.filter(r => r.scores[a.key].n >= 3);
      console.log(`${a.key.padEnd(20)} ${a.kind.padEnd(8)} scored ${have.length}/${result.length}, 3+ voices ${voiced.length}`);
    }
    console.log(`beginner-gated: ${result.filter(r => r.beginnerGated).map(r => r.name).join(", ") || "none"}`);
    for (const g of ["suits_beginner", "suits_arm_slow", "suits_arm_fast"]) {
      const top = result.filter(r => r.scores[g].score !== null && r.scores[g].n >= 3).sort((a, b) => b.scores[g].score! - a.scores[g].score!);
      console.log(`\n${g}: best ${top.slice(0, 5).map(x => `${x.name} ${x.scores[g].score} (${x.scores[g].n})`).join(" · ")}\n   worst ${top.slice(-4).map(x => `${x.name} ${x.scores[g].score} (${x.scores[g].n})`).join(" · ")}`);
    }
    const j = rest.indexOf("--json"); if (j >= 0) writeFileSync(rest[j + 1], JSON.stringify({ computedAt: new Date().toISOString(), k: K, mid: MID, products: result }, null, 1));
    const c = rest.indexOf("--csv");
    if (c >= 0) {
      const keys = profile.attrs.filter(a => a.kind !== "fact").map(a => a.key);
      writeFileSync(rest[c + 1], ["name,type,flight,reports,positive,mixed,negative,beginner_gated," + keys.flatMap(k => [k, `${k}_n`]).join(","),
        ...result.map(r => [JSON.stringify(r.name), r.type, r.flight ?? "", r.reports, r.positive, r.mixed, r.negative, r.beginnerGated ? 1 : 0, ...keys.flatMap(k => [r.scores[k].score ?? "", r.scores[k].n])].join(","))].join("\n"));
    }
  } else {
    const [out] = rest; if (!out) throw new Error("gaps <out.csv>");
    const q = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    const thin = (k: string, min = 3) => (r: typeof result[number]) => r.scores[k].n < min;
    const checks: [string, (r: typeof result[number]) => boolean][] = [
      ["no flight numbers", r => !r.flight], ["few reports", r => r.reports < 10],
      ["level thin", r => ["suits_beginner", "suits_intermediate", "suits_advanced"].every(k => thin(k)(r))],
      ["arm thin", r => ["suits_arm_slow", "suits_arm_mid", "suits_arm_fast"].every(k => thin(k)(r))],
      ["stability thin", thin("stability")], ["glide thin", thin("glide")], ["grip thin", thin("grip")], ["beat-in thin", thin("beat_in")],
    ];
    const lines = result.map(r => ({ r, miss: checks.filter(([, f]) => f(r)).map(([w]) => w) })).filter(x => x.miss.length)
      .sort((a, b) => a.r.evidence - b.r.evidence || b.miss.length - a.miss.length || a.r.name.localeCompare(b.r.name));
    const cols = ["name", "slug", "type", "flight", "reports", "evidence_rows", "missing", "expert_stability", "expert_glide", "expert_grip", "expert_beat_in",
      "expert_accuracy", "expert_distance", "expert_wind", "expert_forehand", "expert_level", "expert_arm_speed", "notes"];
    writeFileSync(out, [cols.join(","), ...lines.map(({ r, miss }) => [q(r.name), r.slug, q(r.type ?? ""), q(r.flight ?? ""), r.reports, r.evidence, q(miss.join("; ")), ...Array(11).fill("")].join(","))].join("\n") + "\n");
    console.log(`${lines.length} discs with gaps of ${result.length} → ${out}`);
    for (const [w, f] of checks) console.log(`  ${w}: ${result.filter(f).length}`);
  }
} else throw new Error("step: backfill | export | check | scores | gaps");
process.exit(0);
