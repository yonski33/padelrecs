// Reviews on the active niche that need marker highlights (owner 2026-11-14): none saved yet, or saved phrases that no longer
// match the text the card shows (the review was edited or re-imported). Writes JSON batches of {id, product, verdict, text} for
// the Sonnet readers (rules: scripts/highlight-rules.md, steps: scripts/HIGHLIGHTS.md); their output goes back in with scripts/save-highlights.mts.
//   NICHE=audio npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/export-highlight-input.mts <out-dir> [batch-size]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { phraseSegments } from "../lib/highlights";
import { plainSummary } from "../lib/plain-summary";

const [out, size = "120"] = process.argv.slice(2);
if (!out) throw new Error("Usage: export-highlight-input.mts <out-dir> [batch-size]");
const data = await catalog();
const name = new Map(data.rackets.map(p => [p.id, p.name]));
const verdict = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
const current = (text: string, saved: readonly string[] | null | undefined) =>
  !!saved?.length && phraseSegments(text, saved).filter(s => s.tone).length === saved.length;

const rows = [
  ...data.reviews.map(r => ({ id: `p:${r.id}`, product: name.get(r.racketId) ?? "", verdict: verdict(r.rating), text: r.reviewText ?? "", saved: r.highlights })),
  ...data.external.map(e => ({ id: `w:${e.id}`, product: name.get(e.racketId) ?? "", verdict: e.sentiment ?? "unknown",
    text: e.summary ? plainSummary(e.summary) : (e.sourceLanguage && e.sourceLanguage !== "en" && e.excerptTranslation) || e.excerpt || "", saved: e.highlights })),
].filter(r => r.text.trim().length >= 25 && r.product && !current(r.text, r.saved)).map(({ saved: _, ...r }) => r);

mkdirSync(join(out, "in"), { recursive: true });
const n = Number(size);
for (let i = 0; i < rows.length; i += n) writeFileSync(join(out, "in", `b${String(i / n).padStart(3, "0")}.json`), JSON.stringify(rows.slice(i, i + n)));
console.log(`${niche.id}: ${rows.length} reviews need highlights, ${Math.ceil(rows.length / n)} batches in ${join(out, "in")}.`);
