// Expert "How it plays" scores (owner decision 2026-11-18): an expert's blind 1–5 per trait, with a short reason each, become
// the bars a product page shows (db/expert-play/<niche>.json, read by db/match-data.ts). The engine keeps its own evidence.
// Rows are matched to products by NAME + YEAR, never by the sheet's slug column (it was made by a script and can be wrong).
// Re-running keeps each trait's reworded `line` while Grok's note for it is unchanged; a changed note drops the line, so it
// gets reworded again. Read-only on the DB.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/import-expert-play.mts <scored.csv> [--write]
// A new site (tennis): add its columns to SHEETS below and its file to db/match-data.ts; nothing else changes.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { readExpertPlay, type ExpertPlayFile, type ExpertPlayEntry } from "../lib/expert-play";

/** Each site's sheet: CSV score column → the site's trait key (lib/fit-config.ts), and the note column beside it. */
const SHEETS: Record<string, { trait: string; score: string; note: string }[]> = {
  padel: [
    { trait: "power", score: "attack_1to5", note: "attack_note" },
    { trait: "control", score: "control_1to5", note: "control_note" },
    { trait: "forgiveness", score: "sweet_spot_1to5", note: "sweet_spot_note" },
    { trait: "arm", score: "arm_comfort_1to5", note: "arm_comfort_note" },
  ],
  pickleball: [
    { trait: "power", score: "power_1to5", note: "power_note" },
    { trait: "control", score: "control_1to5", note: "control_note" },
    { trait: "spin", score: "spin_1to5", note: "spin_note" },
  ],
  // TennisRecs: Power, Control and Spin bars; arm comfort feeds the arm check and build chips.
  tennis: [
    { trait: "power", score: "power_1to5", note: "power_note" },
    { trait: "control", score: "control_1to5", note: "control_note" },
    { trait: "spin", score: "spin_1to5", note: "spin_note" },
    { trait: "arm", score: "arm_comfort_1to5", note: "arm_comfort_note" },
  ],
};

const args = process.argv.slice(2), write = args.includes("--write");
const [file] = args.filter(a => !a.startsWith("--"));
const sheet = SHEETS[niche.id];
if (!file || !sheet) throw new Error(`Usage: NICHE=<${Object.keys(SHEETS).join("|")}> import-expert-play.mts <scored.csv> [--write]`);

const parse = (text: string) => { const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const [head, ...lines] = parse(readFileSync(file, "utf8"));
const col = (n: string) => { const i = head.map(h => h.trim().toLowerCase()).indexOf(n); if (i < 0) throw new Error(`No column ${n}`); return i; };

/** Name for matching: superscripts and "+" kept as text, accents folded, punctuation dropped, the year left out. */
const SUP: Record<string, string> = { "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁰": "0" };
const nameKey = (s: string) => s.replace(/[¹²³⁴⁵⁰]/g, c => SUP[c]).replace(/\+/g, " plus ").replace(/&/g, " and ")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b20\d\d\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

const data = await catalog();
const byKey = new Map<string, typeof data.rackets>();
for (const r of data.rackets) { const k = `${nameKey(r.name)}|${r.year}`; byKey.set(k, [...(byKey.get(k) ?? []), r]); }
// A sheet with no year column: the full name, years kept ("Head Speed Pro 2026" ≠ "Head Speed Pro 2024").
const fullKey = (s: string) => nameKey(s.replace(/\b(20\d\d)\b/g, " y$1 "));
const byName = new Map<string, typeof data.rackets>();
for (const r of data.rackets) { const k = fullKey(r.name); byName.set(k, [...(byName.get(k) ?? []), r]); }

type Row = { name: string; year: number; slug: string; shape: string; scores: Record<string, { dots: number; note: string }>; confidence: string; sources: string };
const rows: Row[] = lines.map(l => ({ name: l[col("name")].trim(), year: Number(l[col("year")]), slug: l[col("slug")].trim(), shape: (l[col("shape")] ?? "").trim(), confidence: (l[col("confidence")] ?? "").trim(), sources: (l[col("sources")] ?? "").trim(),
  scores: Object.fromEntries(sheet.flatMap(s => { const d = Number(l[col(s.score)]); return Number.isInteger(d) && d >= 1 && d <= 5 ? [[s.trait, { dots: d, note: (l[col(s.note)] ?? "").trim() }]] : []; })) }));

const unmatched: Row[] = [], ambiguous: string[] = [], claims = new Map<string, Row[]>();
for (const r of rows) {
  // A sheet with no year (TennisRecs: names carry the generation) matches on the name alone, and only when it is unique.
  const hits = Number.isFinite(r.year) && r.year > 0 ? byKey.get(`${nameKey(r.name)}|${r.year}`) ?? [] : byName.get(fullKey(r.name)) ?? [];
  if (hits.length !== 1) { if (hits.length > 1) ambiguous.push(`${r.name} ${r.year}: ${hits.map(h => h.slug).join(", ")}`); else unmatched.push(r); continue; }
  claims.set(hits[0].id, [...(claims.get(hits[0].id) ?? []), r]);
}
// Two sheet rows for one product (the input sheet repeated a name, e.g. three "Bullpadel Vertex 05" 2027 rows): the scores are
// used only when every such row agrees; otherwise the product is left to the engine and listed for the owner.
const out: ExpertPlayFile = { _about: "", products: {} };
const prevPath = `db/expert-play/${niche.id}.json`;
const prev = existsSync(prevPath) ? readExpertPlay(JSON.parse(readFileSync(prevPath, "utf8"))) : { products: {} } as unknown as ExpertPlayFile;
const repeated: string[] = [];
for (const [id, rs] of claims) {
  const p = data.rackets.find(x => x.id === id)!;
  const sig = (r: Row) => sheet.map(s => r.scores[s.trait]?.dots ?? "-").join("");
  if (rs.length > 1 && new Set(rs.map(sig)).size > 1) { repeated.push(`${p.name} (${p.slug}): ${rs.length} sheet rows disagree (${rs.map(sig).join(" / ")}) — not used`); continue; }
  if (rs.length > 1) repeated.push(`${p.name} (${p.slug}): ${rs.length} identical sheet rows — used once`);
  const r = rs[0], old = prev.products[p.slug];
  const e: ExpertPlayEntry = { confidence: r.confidence || undefined, traits: {} };
  for (const s of sheet) { const v = r.scores[s.trait]; if (!v) continue;
    const kept = old?.traits[s.trait]?.note === v.note ? old.traits[s.trait]?.line : undefined;
    e.traits[s.trait] = { dots: v.dots, note: v.note, ...(kept ? { line: kept } : {}) }; }
  out.products[p.slug] = e;
}
// Same frame scored twice (owner via PM 2026-11-19): the copy takes the reference product's score and reason for that trait.
const ALIGN: Record<string, [copy: string, trait: string, from: string, why: string][]> = {
  tennis: [["wilson-blade-pro-98-16x19-v10", "power", "wilson-blade-pro-98-16x19-v9", "same frame as the V9 (identical specs)"]],
};
const aligned: string[] = [];
for (const [copy, trait, from, why] of ALIGN[niche.id] ?? []) {
  const src = out.products[from]?.traits[trait], dst = out.products[copy]?.traits[trait];
  if (!src || !dst) { aligned.push(`- ${copy} ${trait}: not aligned (missing)`); continue; }
  if (dst.dots !== src.dots) aligned.push(`- ${copy} ${trait}: ${dst.dots} → ${src.dots} (${why})`);
  const kept = dst.note === src.note ? dst.line : src.line;
  out.products[copy].traits[trait] = { dots: src.dots, note: src.note, ...(kept ? { line: kept } : {}) };
}
if (aligned.length) console.log(`Aligned:\n${aligned.join("\n")}`);
out._about = `Expert How it plays scores (owner decision 2026-11-18): an expert's blind 1–5 per trait from lab and reviewer data, matched by name + year (scripts/import-expert-play.mts). dots = the shown bar; line = the bar's line in the site voice (≤105 chars), note = the expert's own reason. The engine keeps its own reading for matching (scripts/expert-play-gaps.mts).`;
const noLine = Object.values(out.products).reduce((n, e) => n + Object.values(e.traits).filter(t => !t?.line).length, 0);
const listedNot = data.listed.filter(p => !out.products[p.slug]).map(p => `${p.name} (${p.slug}, ${data.reviews.filter(x => x.racketId === p.id).length + data.external.filter(x => x.racketId === p.id).length} reports)`);
console.log(`${niche.id}: ${rows.length} sheet rows → ${Object.keys(out.products).length} products. Unmatched ${unmatched.length}, ambiguous ${ambiguous.length}, repeated ${repeated.length}. Lines still to write: ${noLine}. Listed products without an expert score: ${listedNot.length}.`);
const report = [`# Expert play scores: ${niche.id} match report (${new Date().toISOString().slice(0, 10)})`, "",
  `${rows.length} sheet rows, ${Object.keys(out.products).length} products scored. Matched by name + year only.`, "", ...(aligned.length ? ["## Aligned (same frame)", ...aligned, ""] : []),
  `## Sheet rows with no product (${unmatched.length})`, ...unmatched.map(r => `- ${r.name} ${r.year || "(no year)"} (sheet slug ${r.slug})`), "",
  `## Name + year fits more than one product (${ambiguous.length})`, ...ambiguous.map(x => `- ${x}`), "",
  `## One product, several sheet rows (${repeated.length})`, ...repeated.map(x => `- ${x}`), "",
  `## Listed products with no expert score (${listedNot.length}): bars stay the engine's`, ...listedNot.map(x => `- ${x}`), ""].join("\n");
if (write) { mkdirSync("db/expert-play", { recursive: true }); writeFileSync(prevPath, JSON.stringify(out, null, 1) + "\n"); writeFileSync(`db/expert-play/${niche.id}-match-report.md`, report); console.log(`Wrote ${prevPath} and the match report.`); }
else console.log(report);
process.exit(0);
