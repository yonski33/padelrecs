// Lab numbers from independent review sites into the evidence store (ENGINE-PLAN.md step 2, owner 2026-11-15): swing and
// twist weight, spin RPM, power and pop, each a row `lab:<metric>` with the number, a short exact quote and the page link.
// <rows.json> is a list of {slug, url, metric, value, quote}; <index.json> maps each url to the saved page text it was
// read from. A row is kept only when its quote is found verbatim in that page and holds the number. --write saves the
// rows, replacing earlier lab-v1 rows.
//   NICHE=pickleball npx tsx --conditions=react-server --env-file=.env.local scripts/save-lab-evidence.mts <rows.json> <index.json> [--write]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { fitConfigFor } from "../lib/fit-config";
import { EXTRACTORS, type EvidenceRow } from "../lib/evidence";

const [rowsFile, indexFile] = process.argv.slice(2).filter(a => !a.startsWith("--"));
if (!rowsFile || !indexFile) throw new Error("Usage: save-lab-evidence.mts <rows.json> <index.json> [--write]");
const cfg = fitConfigFor(niche);
if (!cfg?.lab) throw new Error(`${niche.id} has no lab metrics in its profile.`);
const data = await catalog();
const bySlug = new Map(data.rackets.map(r => [r.slug, r.id]));
const site = new Map(data.external.map(e => [e.sourceUrl, e.sourceName]));
const index = JSON.parse(readFileSync(indexFile, "utf8")) as Record<string, { file: string }>;
const pages = new Map<string, string>();
const page = (url: string) => { if (!pages.has(url)) { const f = index[url]?.file; pages.set(url, f ? readFileSync(join(dirname(indexFile), f), "utf8").replace(/\s+/g, " ") : ""); } return pages.get(url)!; };
const input = JSON.parse(readFileSync(rowsFile, "utf8")) as { slug: string; url: string; metric: string; value: number; quote: string }[];
const rows: EvidenceRow[] = [], dropped = new Map<string, number>();
const drop = (why: string) => dropped.set(why, (dropped.get(why) ?? 0) + 1);
const seen = new Set<string>();
const digits = (n: number) => String(n).replace(/\.0+$/, "");
for (const x of input) {
  const id = bySlug.get(x.slug);
  if (!id) { drop("unknown product"); continue; }
  if (!cfg.lab.metrics[x.metric]) { drop("unknown metric"); continue; }
  if (typeof x.value !== "number" || !Number.isFinite(x.value)) { drop("bad value"); continue; }
  const q = x.quote?.replace(/\s+/g, " ").trim() ?? "";
  if (q.length < 6 || q.length > 160) { drop("quote length"); continue; }
  if (!page(x.url).includes(q)) { drop("quote not on page"); continue; }
  // The quote must hold the number (or both ends of a range whose midpoint it is), with or without a thousands comma.
  const plain = q.replace(/(\d),(\d{3})/g, "$1$2");
  const nums = (plain.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const ok = nums.includes(x.value) || nums.some((a, i) => i + 1 < nums.length && Math.abs((a + nums[i + 1]) / 2 - x.value) < 0.01) || plain.includes(digits(x.value));
  if (!ok) { drop("number not in quote"); continue; }
  const k = `${id}|${x.url}|${x.metric}`;
  if (seen.has(k)) { drop("duplicate"); continue; }
  seen.add(k);
  rows.push({ productId: id, sourceKind: "blog", sourceRef: x.url, authorKey: `Blog:${(site.get(x.url) ?? new URL(x.url).hostname).toLowerCase()}`, attribute: `lab:${x.metric}`,
    value: x.value, valueText: null, strength: 1.5, quote: q, saidAt: null, extractedBy: EXTRACTORS.lab });
}
const per = new Map<string, number>(); for (const r of rows) per.set(r.attribute, (per.get(r.attribute) ?? 0) + 1);
console.log(`${rows.length} lab rows kept on ${new Set(rows.map(r => r.productId)).size} products, ${input.length - rows.length} dropped`);
console.log(`  ${[...per].sort().map(([k, n]) => `${k} ${n}`).join(", ")}`);
if (dropped.size) console.log(`  dropped: ${[...dropped].map(([k, n]) => `${k} ${n}`).join(", ")}`);
if (process.argv.includes("--write")) {
  const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${EXTRACTORS.lab}`);
    for (let i = 0; i < rows.length; i += 500) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at) values ${sql.join(rows.slice(i, i + 500).map(r =>
      sql`(${r.productId}, ${niche.id}, ${r.sourceKind}, ${r.sourceRef}, ${r.authorKey}, ${r.attribute}, ${r.value}, ${r.valueText}, ${r.strength}, ${r.quote}, ${r.saidAt}, ${r.extractedBy}, ${now})`), sql`, `)}`);
  });
  console.log(`saved ${rows.length} lab rows into ${niche.schema}.evidence`);
}
process.exit(0);
