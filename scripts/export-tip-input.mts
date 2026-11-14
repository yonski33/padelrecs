// Reviews on the active niche that need reading for player tips (owner 2026-11-15, TIPS-PLAN.md phase 1): never read (tips is
// null), or saved tips whose quote is no longer in the stored text (the review was edited or re-imported). Writes JSON batches
// for the Sonnet readers (rules: scripts/tip-rules.md, steps: scripts/TIPS.md); their output goes back in with scripts/save-tips.mts.
// Read-only: nothing is written to the database.
//   NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/export-tip-input.mts <out-dir> [batch-size]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { tipSources, tipsCurrent } from "../lib/tips";
import { plainSummary } from "../lib/plain-summary";

const [out, size = "120"] = process.argv.slice(2);
if (!out) throw new Error("Usage: export-tip-input.mts <out-dir> [batch-size]");
const data = await catalog();
const name = new Map(data.rackets.map(p => [p.id, p.name]));
const clean = (o: Record<string, string | null | undefined>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string" && v.trim().length > 0)) as Record<string, string>;

// Readers see each stored text under its own name and may quote any of them (each quote from one text only).
const rows = [
  ...data.reviews.map(r => ({ row: { id: `p:${r.id}`, product: name.get(r.racketId) ?? "", ...clean({ review: r.reviewText }) },
    sources: tipSources(r), saved: r.tips })),
  ...data.external.map(e => ({ row: { id: `w:${e.id}`, product: name.get(e.racketId) ?? "",
    ...clean({ summary: e.summary ? plainSummary(e.summary) : null, excerpt: e.excerpt, translation: e.sourceLanguage && e.sourceLanguage !== "en" ? e.excerptTranslation : null }) },
    sources: tipSources(e), saved: e.tips })),
].filter(r => r.row.product && r.sources.join(" ").trim().length >= 25 && !tipsCurrent(r.saved, r.sources)).map(r => r.row);

mkdirSync(join(out, "in"), { recursive: true });
const n = Number(size);
for (let i = 0; i < rows.length; i += n) writeFileSync(join(out, "in", `b${String(i / n).padStart(3, "0")}.json`), JSON.stringify(rows.slice(i, i + n)));
console.log(`${niche.id}: ${rows.length} reviews need reading for tips, ${Math.ceil(rows.length / n)} batches in ${join(out, "in")}.`);
