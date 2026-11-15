// Checks and merges the evidence readers' output (rules: scripts/evidence-rules.md) into evidence rows. Every row must be a
// known attribute with a valid value and strength, and its quote must be found verbatim in that report's stored text, or it
// is dropped (listed in <dir>/dropped.jsonl). Writes <dir>/rows.jsonl. --sample N prints N random rows with their report for
// a spot check. --write saves the rows (migration 0023), replacing earlier reader-v1 rows for the same reports.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/check-evidence-output.mts <dir> [--sample 30] [--write]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { EXTRACTORS, type EvidenceRow, type Strength } from "../lib/evidence";

const args = process.argv.slice(2), dir = args.find(a => !a.startsWith("--") && !/^\d+$/.test(a));
if (!dir) throw new Error("Usage: check-evidence-output.mts <dir> [--sample N] [--write]");
const sampleN = args.includes("--sample") ? Number(args[args.indexOf("--sample") + 1]) || 30 : 0;
const data = await catalog();
const ATTRS = new Set(["forgiveness", "power", "control", "defence", "arm", "speed", "durability", "level", "issue"]);
const LEVELS = ["beginner", "intermediate", "advanced"], ISSUES = new Set(["weight_off_spec", "balance_off_spec", "screws_loose", "rattle", "grip", "other"]);
type Report = { id: string; product: string; review?: string; summary?: string; excerpt?: string; translation?: string };
const meta = new Map<string, { productId: string; kind: EvidenceRow["sourceKind"]; at: string | null }>([
  ...data.reviews.map(r => [`p:${r.id}`, { productId: r.racketId, kind: "own_review" as const, at: r.createdAt }] as const),
  ...data.external.map(e => [`w:${e.id}`, { productId: e.racketId, kind: e.sourcePlatform === "YouTube" ? "youtube" as const : "player_report" as const, at: e.sourceDate || e.createdAt }] as const),
]);
const rows: (EvidenceRow & { report: Report })[] = [], dropped: unknown[] = [];
const missing: string[] = [];
let reportsRead = 0, withRows = 0;
for (const f of readdirSync(join(dir, "in")).filter(x => x.endsWith(".json")).sort()) {
  const outFile = join(dir, "out", f);
  if (!existsSync(outFile)) continue;
  const input = JSON.parse(readFileSync(join(dir, "in", f), "utf8")) as Report[];
  const output = JSON.parse(readFileSync(outFile, "utf8")) as Record<string, unknown[]>;
  for (const rep of input) {
    const got = output[rep.id];
    if (!Array.isArray(got)) { missing.push(rep.id); continue; }
    reportsRead++;
    const m = meta.get(rep.id); if (!m) { dropped.push({ id: rep.id, why: "report gone" }); continue; }
    const texts = [rep.review, rep.summary, rep.excerpt, rep.translation].filter((x): x is string => !!x);
    const seen = new Set<string>(); let kept = 0;
    for (const raw of got as Record<string, unknown>[]) {
      const why = (() => {
        const a = String(raw.attribute ?? ""), q = typeof raw.quote === "string" ? raw.quote : "";
        if (!ATTRS.has(a)) return "unknown attribute";
        if (![0.5, 1, 1.5].includes(Number(raw.strength))) return "bad strength";
        if (q.length < 8) return "quote too short";
        if (!texts.some(t => t.includes(q))) return "quote not verbatim";
        if (seen.has(a)) return "second row for attribute";
        if (a === "level" ? !LEVELS.includes(String(raw.level)) : raw.value !== 1 && raw.value !== -1) return "bad value";
        if (a === "issue" && (raw.value !== -1 || !ISSUES.has(String(raw.issue)))) return "bad issue";
        return null;
      })();
      if (why) { dropped.push({ id: rep.id, why, row: raw }); continue; }
      const a = String(raw.attribute); seen.add(a); kept++;
      rows.push({ productId: m.productId, sourceKind: m.kind, sourceRef: `${rep.id}#reader`, authorKey: null, attribute: a,
        value: a === "level" ? LEVELS.indexOf(String(raw.level)) : Number(raw.value), valueText: a === "level" ? String(raw.level) : a === "issue" ? String(raw.issue) : null,
        strength: Number(raw.strength) as Strength, quote: String(raw.quote), saidAt: m.at, extractedBy: EXTRACTORS.reader, report: rep });
    }
    if (kept) withRows++;
  }
}
writeFileSync(join(dir, "rows.jsonl"), rows.map(({ report: _r, ...r }) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
writeFileSync(join(dir, "dropped.jsonl"), dropped.map(d => JSON.stringify(d)).join("\n") + (dropped.length ? "\n" : ""));
const by = new Map<string, { plus: number; minus: number; other: number }>();
for (const r of rows) { const b = by.get(r.attribute) ?? { plus: 0, minus: 0, other: 0 }; if (r.attribute === "level") b.other++; else if ((r.value ?? 0) > 0) b.plus++; else b.minus++; by.set(r.attribute, b); }
const why = new Map<string, number>(); for (const d of dropped as { why: string }[]) why.set(d.why, (why.get(d.why) ?? 0) + 1);
console.log(`${reportsRead} reports read, ${withRows} with rows, ${rows.length} rows kept, ${dropped.length} dropped${missing.length ? `, ${missing.length} ids missing from output` : ""}`);
for (const [a, b] of [...by].sort()) console.log(`  ${a}: ${a === "level" ? `${b.other}` : `+${b.plus} / −${b.minus}`}`);
if (why.size) console.log(`  dropped: ${[...why].map(([k, n]) => `${k} ${n}`).join(", ")}`);

if (sampleN) {
  const pick = [...rows].sort(() => Math.random() - 0.5).slice(0, sampleN);
  writeFileSync(join(dir, "sample.json"), JSON.stringify(pick.map(r => ({ id: r.sourceRef, product: r.report.product, attribute: r.attribute, value: r.valueText ?? r.value, strength: r.strength, quote: r.quote,
    text: [r.report.review, r.report.summary, r.report.excerpt, r.report.translation].filter(Boolean).join(" ‖ ") })), null, 1));
  console.log(`sample of ${pick.length} → ${join(dir, "sample.json")}`);
}

if (args.includes("--write")) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  const refs = [...new Set(rows.map(r => r.sourceRef))];
  await db.transaction(async tx => {
    for (let i = 0; i < refs.length; i += 500) await tx.execute(sql`delete from ${schema}.evidence where extracted_by = ${EXTRACTORS.reader} and source_ref in (${sql.join(refs.slice(i, i + 500).map(x => sql`${x}`), sql`, `)})`);
    for (let i = 0; i < rows.length; i += 500) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(rows.slice(i, i + 500).map(r =>
      sql`(${r.productId}, ${niche.id}, ${r.sourceKind}, ${r.sourceRef}, ${r.authorKey}, ${r.attribute}, ${r.value}, ${r.valueText}, ${r.strength}, ${r.quote}, ${r.saidAt}, ${r.extractedBy}, ${now})`), sql`, `)}`);
  });
  console.log(`saved ${rows.length} reader rows into ${niche.schema}.evidence`);
}
process.exit(0);
