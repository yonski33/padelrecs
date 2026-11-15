// Today's padel data into the evidence store (ENGINE-PLAN.md step 1, owner 2026-11-15): quick tags, arm words in report text,
// YouTube channels' checked notes, stated levels (web reports and the review form), specs and makers' stated levels.
// No reading by a model: every row comes from data we already hold, with the same rules the pages use today.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/evidence-backfill.mts <out.jsonl> <yt-data.jsonl> … [--check] [--write]
// Without flags it only writes the rows to <out.jsonl>. --check compares every listed racket's trait scores from these rows
// with today's (app/match-context.ts) and fails on any difference. --write saves the rows (migration 0023 must be applied),
// replacing earlier rows from the same extractors.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { displayName } from "../lib/brand-name";
import { ratingVerdict } from "../lib/top-lists";
import { classifyTraitNote, armFromReportText } from "../lib/youtube-trait-rules";
import { traitScores, type TraitInput, type Trait } from "../lib/trait-score";
import { fitConfigFor } from "../lib/fit-config";
import { tagRows, evidenceTotals, sentenceWith, EXTRACTORS, type EvidenceRow } from "../lib/evidence";
import { matchContext } from "../app/match-context";
import padelLevelSources from "../db/level-sources/padel.json";

const args = process.argv.slice(2), flags = new Set(args.filter(a => a.startsWith("--"))), files = args.filter(a => !a.startsWith("--"));
const [out, ...ytFiles] = files;
if (!out) throw new Error("Usage: evidence-backfill.mts <out.jsonl> [<yt-data.jsonl> …] [--check] [--write]");
const cfg = fitConfigFor(niche);
if (!cfg) throw new Error(`${niche.id} has no site profile (lib/fit-config.ts).`);
const TRAITS = cfg.traits.map(t => t.key);
const levelSources: Record<string, unknown> = niche.id === "padel" ? padelLevelSources : {};
const data = await catalog();
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const good = new Set(niche.tags.filter(t => t.tone === "pos").map(t => t.label));
const rows: EvidenceRow[] = [];
const taggedReports = new Map<string, Set<string>>();
const LEVEL = ["Beginner", "Intermediate", "Advanced"];

// 1. Reports: quick tags (counted like the finder) and arm words in the text when there's no arm tag.
const reports = [
  ...data.reviews.map(r => ({ productId: r.racketId, ref: `p:${r.id}`, kind: "own_review" as const, author: r.alias ? `own:${hash(r.alias.toLowerCase())}` : null, at: r.createdAt, v: ratingVerdict(r.rating), tags: r.tags, text: r.reviewText })),
  ...data.external.map(e => ({ productId: e.racketId, ref: `w:${e.id}`, kind: e.sourcePlatform === "YouTube" ? "youtube" as const : "player_report" as const,
    author: e.sourceName ? `${e.sourcePlatform}:${hash(e.sourceName.toLowerCase())}` : null, at: e.sourceDate || e.createdAt, v: e.sentiment, tags: e.tags,
    text: [e.summary, e.excerptTranslation ?? e.excerpt].filter(Boolean).join(" ") })),
];
for (const x of reports) {
  const counted = x.tags.filter(t => !(good.has(t) && x.v === "negative"));
  if (counted.length) { const s = taggedReports.get(x.productId) ?? new Set(); s.add(x.ref); taggedReports.set(x.productId, s); }
  rows.push(...tagRows({ productId: x.productId, ref: x.ref, kind: x.kind, author: x.author, at: x.at, tags: counted }, cfg));
  if (!x.tags.includes(cfg.arm.plus) && !(cfg.arm.minus && x.tags.includes(cfg.arm.minus)) && x.text) {
    const a = armFromReportText(x.text);
    if (a) rows.push({ productId: x.productId, sourceKind: x.kind, sourceRef: `${x.ref}#arm-words`, authorKey: x.author, attribute: cfg.arm.trait, value: a, valueText: null, strength: 1,
      quote: sentenceWith(x.text, s => armFromReportText(s) === a), saidAt: x.at, extractedBy: EXTRACTORS.armWords });
  }
}

// 2. YouTube channels' notes: each channel nets to +1 / −1 / nothing per racket and trait; the quote is the reviewer's own
// words from the first note that counted that way.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const bySlug = new Map(data.rackets.map(r => [r.slug, r.id]));
const byName = new Map(data.rackets.flatMap(r => { const b = data.brands.find(x => x.id === r.brandId)?.name; return [[norm(displayName(r.name, b)), r.id], [norm(`${displayName(r.name, b)} ${r.year}`), r.id], [norm(r.name), r.id]] as [string, string][]; }));
type YtRow = { racket: string; vid: string; channel: string; items?: { k: string; t: string; q?: string; ts?: string }[] };
const yt = new Map<string, Map<string, Partial<Record<Trait, { sum: number; notes: { v: number; q: string | null; ref: string }[] }>>>>();
for (const f of ytFiles) for (const line of readFileSync(f, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const row = JSON.parse(line) as YtRow, id = bySlug.get(row.racket) ?? byName.get(norm(row.racket));
  if (!id) continue;
  const ch = yt.get(id) ?? new Map(); yt.set(id, ch);
  const sums = ch.get(row.channel) ?? {}; ch.set(row.channel, sums);
  for (const it of row.items ?? []) for (const [t, v] of classifyTraitNote(it.k, it.t)) {
    const e = (sums[t] ??= { sum: 0, notes: [] }); e.sum += v; e.notes.push({ v, q: it.q ?? null, ref: `${row.vid}${it.ts ? `@${it.ts}` : ""}` });
  }
}
for (const [id, ch] of yt) for (const [channel, sums] of ch) for (const [t, e] of Object.entries(sums) as [Trait, { sum: number; notes: { v: number; q: string | null; ref: string }[] }][]) {
  if (!e.sum) continue;
  const v = Math.sign(e.sum), note = e.notes.find(n => n.v === v)!;
  rows.push({ productId: id, sourceKind: "youtube", sourceRef: `yt:${hash(channel)}#${note.ref}`, authorKey: `YouTube:${hash(channel.toLowerCase())}`, attribute: t, value: v, valueText: null,
    strength: 1, quote: note.q, saidAt: null, extractedBy: EXTRACTORS.ytNotes });
}

// 3. Stated levels: web reports tagged with the writer's own words (migration 0021), and the review form's level field.
try {
  const db = await database();
  const res = await db.execute(sql`select id::text as id, racket_id, player_level, level_quote, source_date, created_at from ${sql.identifier(assertSchemaName(niche.schema))}.external_reviews where player_level is not null`);
  for (const r of ((res as unknown as { rows?: Record<string, string | null>[] }).rows ?? (res as unknown as Record<string, string | null>[]))) {
    const i = LEVEL.indexOf(r.player_level!) >= 0 ? LEVEL.indexOf(r.player_level!) : r.player_level === "Competitive" ? 2 : -1;
    if (i < 0) continue;
    rows.push({ productId: r.racket_id!, sourceKind: "player_report", sourceRef: `w:${r.id}#level`, authorKey: null, attribute: "level", value: i, valueText: r.player_level!, strength: 1,
      quote: r.level_quote, saidAt: r.source_date || r.created_at, extractedBy: EXTRACTORS.level });
  }
} catch (e) { console.warn(`stated web levels not read: ${(e as Error).message}`); }
for (const r of data.reviews) if (r.playerLevel) {
  const i = LEVEL.indexOf(r.playerLevel) >= 0 ? LEVEL.indexOf(r.playerLevel) : r.playerLevel === "Competitive" ? 2 : -1;
  if (i >= 0) rows.push({ productId: r.racketId, sourceKind: "own_review", sourceRef: `p:${r.id}#level`, authorKey: null, attribute: "level", value: i, valueText: r.playerLevel, strength: 1,
    quote: null, saidAt: r.createdAt, extractedBy: EXTRACTORS.level });
}

// 4. Specs and makers' stated levels.
for (const r of data.rackets) for (const col of ["shape", "balance", "weight", "core", "surface"] as const) {
  const v = r[col]; if (!v) continue;
  rows.push({ productId: r.id, sourceKind: "maker", sourceRef: `specs#${col}`, authorKey: null, attribute: `spec:${col}`, value: null, valueText: v, strength: 1, quote: null, saidAt: null, extractedBy: EXTRACTORS.specs });
}
const slugToId = new Map(data.rackets.map(r => [r.slug, r.id]));
for (const [slug, src] of Object.entries(levelSources as Record<string, { maker?: { from: number; to: number; words: string; url: string } }>)) {
  const id = slugToId.get(slug); if (!id || !src.maker) continue;
  rows.push({ productId: id, sourceKind: "maker", sourceRef: src.maker.url, authorKey: null, attribute: "level", value: src.maker.from, valueText: `${src.maker.from}-${src.maker.to}`, strength: 1,
    quote: src.maker.words, saidAt: null, extractedBy: EXTRACTORS.makerLevel });
}

// No duplicate keys (the table's unique index).
const key = (r: EvidenceRow) => `${r.productId}|${r.sourceKind}|${r.sourceRef}|${r.attribute}|${r.extractedBy}`;
const dup = rows.length - new Set(rows.map(key)).size;
if (dup) throw new Error(`${dup} duplicate evidence keys`);
writeFileSync(out, rows.map(r => JSON.stringify(r)).join("\n") + "\n");
const count = new Map<string, number>();
for (const r of rows) count.set(`${r.extractedBy} ${r.attribute}`, (count.get(`${r.extractedBy} ${r.attribute}`) ?? 0) + 1);
console.log(`${rows.length} rows → ${out}`);
for (const [k, n] of [...count].sort()) console.log(`  ${k}: ${n}`);
console.log(`  reports with tags: ${[...taggedReports.values()].reduce((a, s) => a + s.size, 0)}; rows without a quote: ${rows.filter(r => !r.quote && r.extractedBy !== EXTRACTORS.specs && r.extractedBy !== EXTRACTORS.level).length}`);

// --check: trait scores from the evidence rows must equal today's for every listed racket.
if (flags.has("--check")) {
  const ctx = await matchContext();
  const totals = evidenceTotals(rows, taggedReports, cfg);
  const inputs: TraitInput[] = data.listed.map(r => ({ id: r.id, tagged: totals.get(r.id)?.tagged ?? 0, tags: {}, totals: totals.get(r.id)?.traits ?? {},
    youtube: totals.get(r.id)?.youtube, specs: { shape: r.shape, balance: r.balance, weight: r.weight, core: r.core, surface: r.surface } }));
  const fresh = traitScores(inputs, cfg);
  let diff = 0;
  for (const r of data.listed) {
    const a = ctx.traits(r.id).auto, b = fresh.get(r.id);
    for (const t of TRAITS) if (JSON.stringify(a?.[t]) !== JSON.stringify(b?.[t])) { if (diff++ < 15) console.log(`DIFF ${r.slug} ${t}: today ${JSON.stringify(a?.[t])} · evidence ${JSON.stringify(b?.[t])}`); }
  }
  console.log(diff ? `CHECK FAILED: ${diff} trait scores differ` : `CHECK OK: ${data.listed.length} rackets × ${TRAITS.length} traits identical`);
  if (diff) process.exit(1);
}

// --write: replace this backfill's rows (same extractors) and insert.
if (flags.has("--write")) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  const kinds = [...new Set(rows.map(r => r.extractedBy))];
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by in (${sql.join(kinds.map(k => sql`${k}`), sql`, `)})`);
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(chunk.map(r =>
        sql`(${r.productId}, ${niche.id}, ${r.sourceKind}, ${r.sourceRef}, ${r.authorKey}, ${r.attribute}, ${r.value}, ${r.valueText}, ${r.strength}, ${r.quote}, ${r.saidAt}, ${r.extractedBy}, ${now})`), sql`, `)}`);
    }
  });
  console.log(`saved ${rows.length} rows into ${niche.schema}.evidence`);
}
process.exit(0);
