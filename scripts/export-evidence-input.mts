// Reports for the evidence reader pass (ENGINE-PLAN.md step 4, rules: scripts/evidence-rules.md): every stored report on the
// active niche with 25+ characters of text, as JSON batches for Sonnet readers. Read-only.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/export-evidence-input.mts <out-dir> [batch-size]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { plainSummary } from "../lib/plain-summary";

const [out, size = "130"] = process.argv.slice(2);
if (!out) throw new Error("Usage: export-evidence-input.mts <out-dir> [batch-size]");
const data = await catalog();
const name = new Map(data.rackets.map(p => [p.id, p.name]));
const clean = (o: Record<string, string | null | undefined>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string" && v.trim().length > 0)) as Record<string, string>;
const rows = [
  ...data.reviews.map(r => ({ id: `p:${r.id}`, product: name.get(r.racketId) ?? "", ...clean({ review: r.reviewText }) })),
  ...data.external.map(e => ({ id: `w:${e.id}`, product: name.get(e.racketId) ?? "", ...(niche.id === "padel" ? {} : { kind: e.sourcePlatform === "Blog" ? "blog" : "player" }),
    ...clean({ summary: e.summary ? plainSummary(e.summary) : null, excerpt: e.excerpt, translation: e.sourceLanguage && e.sourceLanguage !== "en" ? e.excerptTranslation : null }) })),
].filter(r => r.product && Object.entries(r).filter(([k]) => k !== "id" && k !== "product" && k !== "kind").map(([, v]) => v).join(" ").trim().length >= 25);
mkdirSync(join(out, "in"), { recursive: true });
const n = Number(size);
for (let i = 0; i < rows.length; i += n) writeFileSync(join(out, "in", `b${String(i / n).padStart(3, "0")}.json`), JSON.stringify(rows.slice(i, i + n)));
console.log(`${niche.id}: ${rows.length} reports, ${Math.ceil(rows.length / n)} batches in ${join(out, "in")}.`);
process.exit(0);
