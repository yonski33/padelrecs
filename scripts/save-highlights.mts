// Saves marker highlights to the active niche's reviews (owner 2026-11-14). Input: a JSON file {"p:<id>"|"w:<id>": [phrases]},
// as the Sonnet highlight passes write it. Every phrase is checked against the text the review card shows (lib/highlights.ts
// draws it the same way); a review whose phrases don't all match is skipped and listed. Dry run unless --write.
//   NICHE=skin npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/save-highlights.mts <file.json> [--write]
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { phraseSegments, MAX_HIGHLIGHTS } from "../lib/highlights";
import { plainSummary } from "../lib/plain-summary";
import { connect } from "./connection";

const [file] = process.argv.slice(2).filter(a => !a.startsWith("--"));
const write = process.argv.includes("--write");
if (!file) throw new Error("Usage: save-highlights.mts <file.json> [--write]");
const input = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;

const data = await catalog();
// The card's text: the review itself, or a web review's summary (as plainSummary shows it), else the translation or excerpt.
const shown = new Map<string, string>([
  ...data.reviews.map(r => [`p:${r.id}`, r.reviewText ?? ""] as [string, string]),
  ...data.external.map(e => [`w:${e.id}`, e.summary ? plainSummary(e.summary) : (e.sourceLanguage && e.sourceLanguage !== "en" && e.excerptTranslation) || e.excerpt || ""] as [string, string]),
]);

const player: { id: string; h: string[] }[] = [], web: { id: string; h: string[] }[] = [];
const skipped: string[] = [];
for (const [key, value] of Object.entries(input)) {
  const text = shown.get(key);
  const phrases = Array.isArray(value) ? value.map(p => typeof p === "string" ? p : (p as { t?: unknown })?.t).filter((p): p is string => typeof p === "string" && p.length > 0).slice(0, MAX_HIGHLIGHTS) : [];
  // Every phrase must be drawn: the same check the page makes (exact substring, no overlap).
  const drawn = text ? phraseSegments(text, phrases).filter(s => s.tone).length : 0;
  if (!text || !phrases.length || drawn !== phrases.length) { skipped.push(key); continue; }
  (key.startsWith("p:") ? player : web).push({ id: key.slice(2), h: phrases });
}

console.log(`${niche.id}: ${player.length} player + ${web.length} web reviews ready, ${skipped.length} skipped${skipped.length ? ` (e.g. ${skipped.slice(0, 5).join(", ")})` : ""}.`);
if (!write) { console.log("Dry run: pass --write to save."); process.exit(0); }

const { db, client } = connect();
try {
  const table = (name: string) => sql.raw(`"${niche.schema}"."${name}"`);
  for (const [name, rows] of [["reviews", player], ["external_reviews", web]] as const) {
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = JSON.stringify(rows.slice(i, i + 500));
      await db.execute(sql`update ${table(name)} t set highlights = array(select jsonb_array_elements_text(x.h))
        from jsonb_to_recordset(${chunk}::jsonb) as x(id text, h jsonb) where t.id = x.id`);
    }
  }
  console.log("Saved.");
} finally { await client.end(); }
