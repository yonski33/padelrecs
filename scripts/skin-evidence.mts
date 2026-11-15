// SkinRecs into the evidence store (ENGINE-PLAN.md step 6, owner OK 2026-11-15 "Yes, pass A"). Three steps:
//   backfill [--write]            rows from data we already hold: quick tags (quality / axis), the writer's own skin type stated in
//                                 the text or the review form (suits rows: that writer's verdict), and the specs (fragrance, SPF)
//   export <dir> [size]           reader pass A input: YouTube and blog summaries, plus reports that state a skin type or talk about
//                                 finish or texture (rules: scripts/evidence-rules-skin.md)
//   check <dir> [--sample N] [--write]   readers' output → rows; every quote must be found verbatim in that report's text
//   NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-evidence.mts <step> …
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { ratingVerdict } from "../lib/top-lists";
import { plainSummary } from "../lib/plain-summary";
import { attrProfileFor, statedGroups, fragranceFact, spfOf } from "../lib/attr-profile";
import type { EvidenceRow, SourceKind, Strength } from "../lib/evidence";

const profile = attrProfileFor(niche);
if (!profile) throw new Error("No attribute profile for this niche (NICHE=skin).");
const [step, ...rest] = process.argv.slice(2);
const data = await catalog();
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const VALUE = { positive: 1, mixed: 0, negative: -1 } as const;
/** Who said it, so one voice counts once. YouTube and blogs: the channel or site. Forum reports: the comment itself (its
 *  permalink), never source_name, which is the subreddit there, so a whole forum would count as one voice (PM bug report
 *  2026-11-15, same fix as sim racing). No writer handle is stored for forum reports. */
export const forumUrlKey = (url: string) => url.trim().toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
const authorOf = (e: { sourcePlatform: string; sourceName: string | null; sourceUrl: string }) =>
  kindOf(e.sourcePlatform) === "player_report" ? (e.sourceUrl ? `forum:${hash(forumUrlKey(e.sourceUrl))}` : null)
    : e.sourceName ? `${e.sourcePlatform}:${hash(e.sourceName.toLowerCase())}` : null;
const kindOf = (platform: string): SourceKind => platform === "YouTube" ? "youtube" : platform === "Blog" ? "blog" : "player_report";
const good = new Set(niche.tags.filter(t => t.tone === "pos").map(t => t.label));
type Report = { productId: string; ref: string; kind: SourceKind; author: string | null; at: string | null; verdict: -1 | 0 | 1 | null; tags: string[];
  texts: Record<string, string>; formType: string | null };
const reports: Report[] = [
  ...data.reviews.map(r => ({ productId: r.racketId, ref: `p:${r.id}`, kind: "own_review" as const, author: r.alias ? `own:${hash(r.alias.toLowerCase())}` : `p:${r.id}`,
    at: r.createdAt, verdict: VALUE[ratingVerdict(r.rating)], tags: r.tags, texts: { review: r.reviewText }, formType: r.playerLevel })),
  ...data.external.map(e => ({ productId: e.racketId, ref: `w:${e.id}`, kind: kindOf(e.sourcePlatform), author: authorOf(e),
    at: e.sourceDate || e.createdAt, verdict: e.sentiment ? VALUE[e.sentiment] : null, tags: e.tags,
    texts: Object.fromEntries(Object.entries({ summary: e.summary ? plainSummary(e.summary) : null, excerpt: e.excerpt, translation: e.sourceLanguage && e.sourceLanguage !== "en" ? e.excerptTranslation : null })
      .filter((x): x is [string, string] => typeof x[1] === "string" && x[1].trim().length > 0)), formType: null })),
];
const byRef = new Map(reports.map(r => [r.ref, r]));
const EX = { tags: "skin-tags-v1", words: "skin-type-words-v1", form: "skin-type-form-v1", specs: "skin-specs-v1", reader: "skin-reader-v1" };

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

if (step === "backfill") {
  const rows: EvidenceRow[] = [];
  const tagAttrs = profile.attrs.filter(a => a.kind === "quality" || a.kind === "axis");
  for (const x of reports) {
    // 1. Quick tags: a good tag doesn't count on a negative report (as the finder counts them).
    for (const tag of x.tags) {
      if (good.has(tag) && x.verdict === -1) continue;
      for (const a of tagAttrs) for (const [list, sign] of [[a.plus, 1], [a.minus, -1]] as const)
        for (const [t, w] of list ?? []) if (t === tag) rows.push(row(x, a.key, sign, w, null, EX.tags, null, `#tag:${tag}`));
    }
    // 2. The writer's own skin type, with that writer's verdict as the suits value. Mixed counts as 0.
    if (x.verdict !== null) {
      const said = new Map<string, string>();
      for (const t of Object.values(x.texts)) for (const g of statedGroups(t)) if (!said.has(g.group)) said.set(g.group, g.quote);
      for (const [g, q] of said) rows.push(row(x, `suits_${g}`, x.verdict, 1, q, EX.words));
      const form = x.formType?.toLowerCase();
      if (form && profile.groups.some(g => g.key === form) && !said.has(form)) rows.push(row(x, `suits_${form}`, x.verdict, 1, null, EX.form, "form"));
    }
  }
  // 3. Specs: fragrance and SPF (maker rows).
  for (const p of data.listed) {
    const base = { productId: p.id, sourceKind: "maker" as const, sourceRef: `spec:${p.id}`, authorKey: "maker", strength: 1 as Strength, saidAt: null, extractedBy: EX.specs };
    const f = fragranceFact(p.balance);
    if (f) rows.push({ ...base, attribute: "fragrance_free", value: f === "free" ? 1 : 0, valueText: f, quote: p.balance });
    const spf = p.shape === "Sunscreen" ? spfOf(p.name, p.weight, p.core) : null;
    if (spf) rows.push({ ...base, attribute: "spf", value: spf, valueText: null, quote: p.name });
  }
  const count = (pred: (r: EvidenceRow) => boolean) => rows.filter(pred).length;
  console.log(`rows ${rows.length}: tags ${count(r => r.extractedBy === EX.tags)}, skin type words ${count(r => r.extractedBy === EX.words)}, form ${count(r => r.extractedBy === EX.form)}, specs ${count(r => r.extractedBy === EX.specs)}`);
  for (const g of profile.groups) {
    const per = new Map<string, number>(); for (const r of rows.filter(r => r.attribute === `suits_${g.key}`)) per.set(r.productId, (per.get(r.productId) ?? 0) + 1);
    console.log(`  ${g.key}: ${count(r => r.attribute === `suits_${g.key}`)} writers, products with ≥${profile.minGroup}: ${[...per.values()].filter(n => n >= profile.minGroup).length}`);
  }
  console.log(`  fragrance: ${JSON.stringify(Object.fromEntries(["free", "oils", "fragrance"].map(k => [k, count(r => r.attribute === "fragrance_free" && r.valueText === k)])))}; spf ${count(r => r.attribute === "spf")} of ${data.listed.filter(p => p.shape === "Sunscreen").length} sunscreens`);
  writeFileSync(join(process.env.TMPDIR ?? "/tmp", "skin-backfill.jsonl"), rows.map(r => JSON.stringify(r)).join("\n"));
  if (rest.includes("--write")) await save(rows, [EX.tags, EX.words, EX.form, EX.specs]);
} else if (step === "export") {
  const [out, size = "120"] = rest;
  if (!out) throw new Error("export <dir> [size]");
  const words = /\b(dry|oily|combination|combo|sensitive|acne[- ]prone|normal)[,\s]+(?:[a-z-]+[,\s]+){0,2}skin\b|\b(rosacea|eczema|matte|mattif\w*|dewy|glowy|shiny|greasy|tacky|sticky|drying|dried (me|my skin) out|stripp\w*|flaky|tight)\b/i;
  const listed = new Set(data.listed.map(p => p.id)), name = new Map(data.rackets.map(p => [p.id, p.name]));
  const pick = reports.filter(x => listed.has(x.productId)).filter(x => { const t = Object.values(x.texts).join(" "); return t.length >= 25 && (x.kind === "youtube" || x.kind === "blog" || x.kind === "own_review" || words.test(t)); });
  mkdirSync(join(out, "in"), { recursive: true });
  const n = Number(size), items = pick.map(x => ({ id: x.ref, product: name.get(x.productId), type: data.rackets.find(p => p.id === x.productId)?.shape ?? null, ...x.texts }));
  for (let i = 0; i < items.length; i += n) writeFileSync(join(out, "in", `b${String(i / n).padStart(3, "0")}.json`), JSON.stringify(items.slice(i, i + n)));
  console.log(`pass A: ${items.length} reports (YouTube ${pick.filter(x => x.kind === "youtube").length}, blog ${pick.filter(x => x.kind === "blog").length}, own ${pick.filter(x => x.kind === "own_review").length}, forum ${pick.filter(x => x.kind === "player_report").length}) in ${Math.ceil(items.length / n)} batches`);
} else if (step === "check") {
  const [dir] = rest.filter(a => !a.startsWith("--") && !/^\d+$/.test(a));
  const sampleN = rest.includes("--sample") ? Number(rest[rest.indexOf("--sample") + 1]) || 30 : 0;
  const ATTRS = new Set(["hydration", "gentle", "breakouts", "finish", "texture", "skin_type"]), GROUPS = new Set(profile.groups.map(g => g.key));
  const rows: (EvidenceRow & { text: string })[] = [], dropped: unknown[] = [];
  const outDir = join(dir, "out");
  for (const f of readdirSync(outDir).filter(f => f.endsWith(".json")).sort()) {
    const got = JSON.parse(readFileSync(join(outDir, f), "utf8")) as Record<string, { attribute: string; value?: number; group?: string; strength?: number; quote?: string }[]>;
    for (const [ref, list] of Object.entries(got)) {
      const x = byRef.get(ref); if (!x || !Array.isArray(list)) { dropped.push({ ref, why: "unknown report" }); continue; }
      const text = Object.values(x.texts).join("\n");
      const seen = new Set<string>();
      for (const r of list) {
        const why = !ATTRS.has(r.attribute) ? "attribute" : r.attribute === "skin_type" ? (!r.group || !GROUPS.has(r.group) ? "group" : null) : ![1, -1].includes(r.value as number) ? "value"
          : ![0.5, 1, 1.5].includes(r.strength as number) ? "strength" : null;
        const quoteOk = !!r.quote && r.quote.length >= 6 && Object.values(x.texts).some(t => t.includes(r.quote!));
        if (why || !quoteOk) { dropped.push({ ref, row: r, why: why ?? "quote not verbatim" }); continue; }
        if (r.attribute === "skin_type") {
          if (x.verdict === null || seen.has(`g:${r.group}`)) continue; seen.add(`g:${r.group}`);
          rows.push({ ...row(x, `suits_${r.group}`, x.verdict, 1, r.quote!, EX.reader), text });
        } else {
          if (seen.has(r.attribute)) continue; seen.add(r.attribute);
          rows.push({ ...row(x, r.attribute, r.value!, r.strength as Strength, r.quote!, EX.reader), text });
        }
      }
    }
  }
  writeFileSync(join(dir, "rows.jsonl"), rows.map(({ text: _t, ...r }) => JSON.stringify(r)).join("\n"));
  writeFileSync(join(dir, "dropped.jsonl"), dropped.map(d => JSON.stringify(d)).join("\n"));
  const by = rows.reduce((m, r) => m.set(r.attribute, (m.get(r.attribute) ?? 0) + 1), new Map<string, number>());
  console.log(`reader rows ${rows.length}, dropped ${dropped.length}: ${JSON.stringify(Object.fromEntries(by))}`);
  if (sampleN) for (const r of [...rows].sort(() => Math.random() - 0.5).slice(0, sampleN)) console.log(`\n[${r.attribute} ${r.value} s${r.strength}] "${r.quote}"\n   ${r.text.slice(0, 400).replace(/\n/g, " | ")}`);
  if (rest.includes("--write")) {
    // The reader's skin types replace the word rules' rows for the same report (no double counting of one writer).
    const read = new Set(rows.filter(r => r.attribute.startsWith("suits_")).map(r => `${r.sourceRef}|${r.attribute}`));
    const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema));
    const res = await db.execute(sql`select id, source_ref, attribute from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${EX.words}`);
    const dup = ((res as unknown as { rows?: { id: string; source_ref: string; attribute: string }[] }).rows ?? (res as unknown as { id: string; source_ref: string; attribute: string }[])).filter(r => read.has(`${r.source_ref}|${r.attribute}`)).map(r => r.id);
    for (let i = 0; i < dup.length; i += 1000) await db.execute(sql`delete from ${schema}.evidence where id in (${sql.join(dup.slice(i, i + 1000).map(id => sql`${id}`), sql`, `)})`);
    console.log(`removed ${dup.length} word-rule rows the reader also found`);
    await save(rows.map(({ text: _t, ...r }) => r), [EX.reader]);
  }
} else if (step === "rekey") {
  // Re-keys the saved rows' author_key with authorOf (the forum-voice fix) in place, so the reader's rows and the word rows it
  // replaced stay as they are. Dry run: voice counts and suits scores before / after. --write saves (owner OK needed).
  const { evidenceRows } = await import("../db/evidence");
  const { scoreAll } = await import("../lib/attr-score");
  const rows = await evidenceRows();
  const newKey = new Map(reports.map(x => [x.ref, x.author]));
  const after = rows.map(r => { const k = newKey.get(r.sourceRef.split("#")[0]); return k !== undefined && r.sourceKind !== "maker" ? { ...r, authorKey: k } : r; });
  const changed = rows.filter((r, i) => r.authorKey !== after[i].authorKey);
  const voices = (rs: typeof rows) => new Set(rs.filter(r => r.sourceKind === "player_report").map(r => r.authorKey ?? r.sourceRef.split("#")[0])).size;
  console.log(`rows ${rows.length}, re-keyed ${changed.length}; forum voices ${voices(rows)} → ${voices(after)}`);
  const cnt = new Map(data.listed.map(r => [r.id, { n: 0, p: 0, neg: 0, j: 0 }]));
  for (const x of reports) { const c = cnt.get(x.productId); if (c) { c.n++; if (x.verdict !== null) { c.j++; if (x.verdict > 0) c.p++; if (x.verdict < 0) c.neg++; } } }
  const inputs = data.listed.map(r => { const c = cnt.get(r.id)!; return { id: r.id, shape: r.shape, reports: c.n, verdict: c.j ? (c.p - c.neg) / c.j : null }; });
  const [b, a] = [scoreAll(profile, inputs, rows), scoreAll(profile, inputs, after)];
  for (const attr of profile.attrs.filter(x => x.kind !== "fact")) {
    let had = 0, has = 0, moved = 0, big = 0;
    for (const p of data.listed) { const x = b.get(p.id)!.scores[attr.key], y = a.get(p.id)!.scores[attr.key]; if (x) had++; if (y) has++;
      if (x && y && x.score !== y.score) moved++; if (x && y && Math.abs(x.score - y.score) >= 10) big++; }
    console.log(`  ${attr.key.padEnd(18)} scored ${had} → ${has}; score changed ${moved}, by 10+ ${big}`);
  }
  const name = new Map(data.listed.map(r => [r.id, r.name]));
  const ex = data.listed.map(p => ({ p, x: b.get(p.id)!.scores.suits_dry, y: a.get(p.id)!.scores.suits_dry })).filter(o => o.y && (!o.x || o.x.n !== o.y.n)).sort((m, n) => n.y!.n - m.y!.n).slice(0, 4);
  for (const o of ex) console.log(`  e.g. dry: ${name.get(o.p.id)} ${o.x ? `${o.x.score} (${o.x.n} voices)` : "no score"} → ${o.y!.score} (${o.y!.n} voices)`);
  if (rest.includes("--write")) {
    const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema));
    const pairs = [...new Map(reports.filter(x => x.kind === "player_report").map(x => [x.ref, x.author])).entries()];
    let n = 0;
    await db.transaction(async tx => {
      for (let i = 0; i < pairs.length; i += 500) {
        const chunk = pairs.slice(i, i + 500);
        const res = await tx.execute(sql`update ${schema}.evidence e set author_key = v.k from (values ${sql.join(chunk.map(([ref, k]) => sql`(${ref}, ${k})`), sql`, `)}) as v(ref, k)
          where e.niche = ${niche.id} and e.source_kind = 'player_report' and split_part(e.source_ref, '#', 1) = v.ref and e.author_key is distinct from v.k`);
        n += (res as unknown as { rowCount?: number; count?: number }).rowCount ?? (res as unknown as { count?: number }).count ?? 0;
      }
    });
    console.log(`re-keyed ${n} rows in ${niche.schema}.evidence`);
  }
} else throw new Error("step: backfill | export | check | rekey");
process.exit(0);
