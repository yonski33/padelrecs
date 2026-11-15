// SimRacingRecs into the evidence store (ENGINE-PLAN.md step 6; owner OK 2026-11-15 via the PM session: profile, full reader
// pass, DB writes). Same shape as scripts/skin-evidence.mts, with sim racing's profile (lib/attr-profile-simracing.ts):
//   backfill [--write]            rows from data we already hold: quick tags (quality rows) and the specs (platform, torque, type)
//   export <dir> [size]           the full reader pass: every stored report on a listed product (rules: scripts/evidence-rules-simracing.md)
//   check <dir> [--sample N] [--write]   readers' output → rows; every quote must be found verbatim in that report's text
//   NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-evidence.mts <step> …
// Raw counts stay in the rows (one row per voice and attribute, value ±1, strength), so lib/engine can smooth by them.
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { ratingVerdict } from "../lib/top-lists";
import { plainSummary } from "../lib/plain-summary";
import { SIMRACING as profile, platformsOf, torqueOf } from "../lib/attr-profile-simracing";
import type { EvidenceRow, SourceKind, Strength } from "../lib/evidence";

if (niche.id !== "simracing") throw new Error("Run with NICHE=simracing.");
const [step, ...rest] = process.argv.slice(2);
const data = await catalog();
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const VALUE = { positive: 1, mixed: 0, negative: -1 } as const;
const kindOf = (platform: string): SourceKind => platform === "YouTube" ? "youtube" : platform === "Blog" ? "blog" : "player_report";
const good = new Set(niche.tags.filter(t => t.tone === "pos").map(t => t.label));
type Report = { productId: string; ref: string; kind: SourceKind; author: string | null; at: string | null; verdict: -1 | 0 | 1 | null; tags: string[]; texts: Record<string, string> };
const reports: Report[] = [
  ...data.reviews.map(r => ({ productId: r.racketId, ref: `p:${r.id}`, kind: "own_review" as const, author: r.alias ? `own:${hash(r.alias.toLowerCase())}` : `p:${r.id}`,
    at: r.createdAt, verdict: VALUE[ratingVerdict(r.rating)], tags: r.tags, texts: { review: r.reviewText } })),
  // One voice: a YouTube channel or blog is its source name; a forum report's source name is the community ("r/simracing"),
  // so there each comment (its URL) is its own voice. Grouping by the community would count 4,599 reports as 2 voices.
  ...data.external.map(e => ({ productId: e.racketId, ref: `w:${e.id}`, kind: kindOf(e.sourcePlatform),
    author: kindOf(e.sourcePlatform) === "player_report" ? `${e.sourcePlatform}:${hash((e.sourceUrl || e.id).toLowerCase())}` : e.sourceName ? `${e.sourcePlatform}:${hash(e.sourceName.toLowerCase())}` : null,
    at: e.sourceDate || e.createdAt, verdict: e.sentiment ? VALUE[e.sentiment] : null, tags: e.tags,
    texts: Object.fromEntries(Object.entries({ summary: e.summary ? plainSummary(e.summary) : null, excerpt: e.excerpt, translation: e.sourceLanguage && e.sourceLanguage !== "en" ? e.excerptTranslation : null })
      .filter((x): x is [string, string] => typeof x[1] === "string" && x[1].trim().length > 0)) })),
];
const byRef = new Map(reports.map(r => [r.ref, r]));
const shapeOf = new Map(data.rackets.map(p => [p.id, p.shape]));
const EX = { tags: "simracing-tags-v1", specs: "simracing-specs-v1", reader: "simracing-reader-v1" };
const applies = (key: string, productId: string) => { const a = profile.attrs.find(x => x.key === key); const s = shapeOf.get(productId); return !!a && (!a.appliesTo || (!!s && a.appliesTo.includes(s))); };

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
const row = (x: Report, attribute: string, value: number | null, strength: Strength, quote: string | null, extractedBy: string, refSuffix = ""): EvidenceRow =>
  ({ productId: x.productId, sourceKind: x.kind, sourceRef: `${x.ref}${refSuffix}`, authorKey: x.author, attribute, value, valueText: null, strength, quote, saidAt: x.at, extractedBy });
const tally = (rows: EvidenceRow[]) => Object.fromEntries([...rows.reduce((m, r) => m.set(r.attribute, (m.get(r.attribute) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]));

if (step === "backfill") {
  const rows: EvidenceRow[] = [];
  const tagAttrs = profile.attrs.filter(a => a.kind === "quality");
  for (const x of reports) for (const tag of x.tags) {
    // A good tag doesn't count on a negative report (as the finder counts them); only where the attribute applies.
    if (good.has(tag) && x.verdict === -1) continue;
    for (const a of tagAttrs) for (const [list, sign] of [[a.plus, 1], [a.minus, -1]] as const)
      for (const [t, w] of list ?? []) if (t === tag && applies(a.key, x.productId)) rows.push(row(x, a.key, sign, w, null, EX.tags, `#tag:${tag}`));
  }
  for (const p of data.rackets) {
    const base = { productId: p.id, sourceKind: "maker" as const, sourceRef: `spec:${p.id}`, authorKey: "maker", strength: 1 as Strength, saidAt: null, extractedBy: EX.specs };
    const plat = applies("platform", p.id) ? platformsOf(p.core) : null;
    if (plat) rows.push({ ...base, attribute: "platform", value: null, valueText: plat.join(", "), quote: p.core });
    const nm = p.shape === "Wheelbase" ? torqueOf(p.weight) : null;
    if (nm !== null) rows.push({ ...base, attribute: "torque_nm", value: nm, valueText: null, quote: p.weight });
    if (p.balance) rows.push({ ...base, attribute: "drive_type", value: null, valueText: p.balance, quote: p.balance });
  }
  console.log(`rows ${rows.length}: ${JSON.stringify(tally(rows))}`);
  writeFileSync(join(process.env.TMPDIR ?? "/tmp", "simracing-backfill.jsonl"), rows.map(r => JSON.stringify(r)).join("\n"));
  if (rest.includes("--write")) await save(rows, [EX.tags, EX.specs]);
} else if (step === "export") {
  const [out, size = "200"] = rest;
  if (!out) throw new Error("export <dir> [size]");
  const listed = new Set(data.listed.map(p => p.id)), name = new Map(data.rackets.map(p => [p.id, p.name]));
  const pick = reports.filter(x => listed.has(x.productId) && Object.values(x.texts).join(" ").length >= 25);
  mkdirSync(join(out, "in"), { recursive: true });
  const n = Number(size), items = pick.map(x => ({ id: x.ref, product: name.get(x.productId), type: shapeOf.get(x.productId) ?? null, ...x.texts }));
  for (let i = 0; i < items.length; i += n) writeFileSync(join(out, "in", `b${String(i / n).padStart(3, "0")}.json`), JSON.stringify(items.slice(i, i + n)));
  console.log(`full pass: ${items.length} reports (YouTube ${pick.filter(x => x.kind === "youtube").length}, blog ${pick.filter(x => x.kind === "blog").length}, own ${pick.filter(x => x.kind === "own_review").length}, forum ${pick.filter(x => x.kind === "player_report").length}) in ${Math.ceil(items.length / n)} batches`);
} else if (step === "check") {
  const [dir] = rest.filter(a => !a.startsWith("--") && !/^\d+$/.test(a));
  const sampleN = rest.includes("--sample") ? Number(rest[rest.indexOf("--sample") + 1]) || 30 : 0;
  const ATTRS = new Set([...profile.attrs.filter(a => a.kind === "quality").map(a => a.key), "driver"]), GROUPS = new Set(profile.groups.map(g => g.key));
  const rows: (EvidenceRow & { text: string })[] = [], dropped: unknown[] = [];
  const outDir = join(dir, "out");
  for (const f of readdirSync(outDir).filter(f => f.endsWith(".json")).sort()) {
    const got = JSON.parse(readFileSync(join(outDir, f), "utf8")) as Record<string, { attribute: string; value?: number; group?: string; strength?: number; quote?: string }[]>;
    for (const [ref, list] of Object.entries(got)) {
      const x = byRef.get(ref); if (!x || !Array.isArray(list)) { dropped.push({ ref, why: "unknown report" }); continue; }
      const text = Object.values(x.texts).join("\n"), seen = new Set<string>();
      for (const r of list) {
        const why = !ATTRS.has(r.attribute) ? "attribute" : r.attribute === "driver" ? (!r.group || !GROUPS.has(r.group) ? "group" : null)
          : ![1, -1].includes(r.value as number) ? "value" : ![0.5, 1, 1.5].includes(r.strength as number) ? "strength"
          : !applies(r.attribute, x.productId) ? "not for this category" : null;
        const quoteOk = !!r.quote && r.quote.length >= 6 && Object.values(x.texts).some(t => t.includes(r.quote!));
        if (why || !quoteOk) { dropped.push({ ref, row: r, why: why ?? "quote not verbatim" }); continue; }
        if (r.attribute === "driver") {
          // The writer is new to sim racing / upgrading: their verdict on the product is the suits value (mixed = 0).
          // Only owners' own reports: a YouTube or blog reviewer comparing with a cheaper base is testing, not upgrading.
          if (x.kind === "youtube" || x.kind === "blog") { dropped.push({ ref, row: r, why: "driver row from a reviewer" }); continue; }
          if (x.verdict === null || seen.has(`g:${r.group}`) || !applies(`suits_${r.group}`, x.productId)) continue; seen.add(`g:${r.group}`);
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
  console.log(`reader rows ${rows.length}, dropped ${dropped.length}: ${JSON.stringify(tally(rows))}`);
  const why = dropped.reduce<Record<string, number>>((m, d) => { const k = (d as { why: string }).why; m[k] = (m[k] ?? 0) + 1; return m; }, {});
  console.log(`dropped by reason: ${JSON.stringify(why)}`);
  if (sampleN) for (const r of [...rows].sort(() => Math.random() - 0.5).slice(0, sampleN)) console.log(`\n[${r.attribute} ${r.value} s${r.strength}] "${r.quote}"\n   ${r.text.slice(0, 400).replace(/\n/g, " | ")}`);
  if (rest.includes("--write")) await save(rows.map(({ text: _t, ...r }) => r), [EX.reader]);
} else throw new Error("step: backfill | export | check");
process.exit(0);
