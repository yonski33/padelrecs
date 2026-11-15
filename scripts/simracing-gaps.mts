// SimRacingRecs gaps for the owner's expert (like pickleball-expert-gaps.csv / skin-gaps.mts): facts we can't read from
// reviews (price band, missing platforms or torque) and the attribute scores with too few voices, as a sheet to fill.
//   export: NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-gaps.mts export <out.csv> [--rows a.jsonl,b.jsonl]
//   report: … scripts/simracing-gaps.mts report [--rows …]       coverage per attribute and the top products per category
//   import: … scripts/simracing-gaps.mts import <filled.csv> [--write]
// --rows reads evidence from JSONL files (the dry run) instead of the evidence table. Import saves the facts as owner rows in
// the evidence store (owner rows win over the maker's) and the expert columns to db/known-dots/simracing.json as the
// known-correct set (ENGINE-PLAN §2F): calibration targets, not overrides.
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { applies } from "../lib/attr-profile";
import { SIMRACING as profile } from "../lib/attr-profile-simracing";
import { scoreAll, dotsOf } from "../lib/attr-score";
import type { EvidenceRow } from "../lib/evidence";

if (niche.id !== "simracing") throw new Error("Run with NICHE=simracing.");
const [step, file] = process.argv.slice(2);
const data = await catalog();
const SCORED = profile.attrs.filter(a => a.kind !== "fact");
const COLS = ["name", "slug", "type", "reports", "evidence_rows", "missing", "platform", "torque_nm", "price_band", ...SCORED.map(a => `expert_${a.key}`), "notes"];
const csvCell = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function parseCsv(text: string): string[][] {
  const out: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); out.push(row); row = []; cell = ""; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out;
}
async function rowsIn(): Promise<EvidenceRow[]> {
  const i = process.argv.indexOf("--rows");
  if (i < 0) return evidenceRows();
  return process.argv[i + 1].split(",").flatMap(f => readFileSync(f, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l) as EvidenceRow));
}
/** Scores for every product (raw positive / mixed / negative counts kept for the shared engine). */
async function scored() {
  const rows = await rowsIn();
  const c = new Map(data.rackets.map(r => [r.id, { n: 0, pos: 0, mixed: 0, neg: 0 }]));
  for (const e of data.external) { const x = c.get(e.racketId); if (!x) continue; x.n++; if (e.sentiment === "positive") x.pos++; else if (e.sentiment === "mixed") x.mixed++; else if (e.sentiment === "negative") x.neg++; }
  for (const r of data.reviews) { const x = c.get(r.racketId); if (!x) continue; x.n++; if (r.rating >= 4) x.pos++; else if (r.rating <= 2) x.neg++; else x.mixed++; }
  const attrs = scoreAll(profile, data.rackets.map(r => { const x = c.get(r.id)!, j = x.pos + x.mixed + x.neg; return { id: r.id, shape: r.shape, reports: x.n, verdict: j ? (x.pos - x.neg) / j : null }; }), rows);
  const evN = new Map<string, number>(); for (const r of rows) evN.set(r.productId, (evN.get(r.productId) ?? 0) + 1);
  return { attrs, counts: c, evN };
}

if (step === "export") {
  if (!file) throw new Error("export <out.csv>");
  const { attrs, counts, evN } = await scored();
  const lines = data.rackets.map(r => {
    const a = attrs.get(r.id)!, c = counts.get(r.id)!;
    const thin = SCORED.filter(x => applies(x, r.shape) && !a.scores[x.key]).map(x => x.key);
    const missing = [...(c.n === 0 ? ["no reports"] : c.n < 10 ? ["under 10 reports"] : []), "price",
      ...(applies(profile.attrs.find(x => x.key === "platform")!, r.shape) && !a.facts.platform ? ["platform"] : []),
      ...(r.shape === "Wheelbase" && a.facts.torque_nm == null ? ["torque"] : []),
      ...(thin.length ? [`${thin.join("/")} thin`] : [])];
    return { r, c, a, missing, ev: evN.get(r.id) ?? 0 };
  }).sort((x, y) => (x.r.shape ?? "").localeCompare(y.r.shape ?? "") || y.c.n - x.c.n || x.r.slug.localeCompare(y.r.slug));
  writeFileSync(file, [COLS.join(","), ...lines.map(({ r, c, a, missing, ev }) => [r.name, r.slug, r.shape, c.n, ev, missing.join("; "),
    a.facts.platform ?? "", a.facts.torque_nm ?? "", "", ...SCORED.map(x => applies(x, r.shape) ? "" : "n/a"), ""].map(csvCell).join(","))].join("\n") + "\n");
  const n = (k: string) => lines.filter(l => l.missing.some(m => m.includes(k))).length;
  console.log(`${lines.length} products → ${file}. no reports ${n("no reports")} · under 10 ${n("under 10")} · platform ${n("platform")} · torque ${n("torque")} · some attribute thin ${n("thin")}`);
} else if (step === "report") {
  const { attrs, counts } = await scored();
  for (const a of profile.attrs) {
    const pool = data.rackets.filter(r => applies(a, r.shape));
    const have = pool.filter(r => a.kind === "fact" ? attrs.get(r.id)!.facts[a.key] != null : !!attrs.get(r.id)!.scores[a.key]);
    const dots = [1, 2, 3, 4, 5].map(d => pool.filter(r => { const s = attrs.get(r.id)!.scores[a.key]; return s && dotsOf(s.score) === d; }).length);
    console.log(`${a.key.padEnd(14)} ${a.kind.padEnd(8)} ${String(have.length).padStart(3)}/${pool.length}${a.kind === "fact" ? "" : `  dots 1-5: ${dots.join("/")}`}`);
  }
  for (const a of SCORED.filter(a => a.kind === "quality" || a.kind === "suits")) {
    const top = data.rackets.map(r => ({ r, s: attrs.get(r.id)!.scores[a.key] })).filter(x => x.s).sort((x, y) => y.s!.score - x.s!.score);
    if (!top.length) continue;
    const f = (x: typeof top[number]) => `${x.r.name} ${x.s!.score} (+${x.s!.plus ?? "?"}/−${x.s!.minus ?? "?"} of ${counts.get(x.r.id)!.n})`;
    console.log(`\n${a.key}: best ${top.slice(0, 4).map(f).join(" · ")}\n   low ${top.slice(-3).map(f).join(" · ")}`);
  }
} else if (step === "import") {
  if (!file) throw new Error("import <filled.csv> [--write]");
  const [head, ...body] = parseCsv(readFileSync(file, "utf8")).filter(r => r.some(x => x.trim()));
  const col = (k: string) => head.indexOf(k);
  const bySlug = new Map(data.rackets.map(r => [r.slug, r]));
  const facts: { productId: string; attribute: string; value: number | null; valueText: string | null }[] = [];
  const known: Record<string, Record<string, string | number>> = {};
  const bad: string[] = [];
  for (const line of body) {
    const r = bySlug.get(line[col("slug")]?.trim()); if (!r) { bad.push(`unknown slug ${line[col("slug")]}`); continue; }
    const price = line[col("price_band")]?.trim(), nm = line[col("torque_nm")]?.trim(), plat = line[col("platform")]?.trim();
    if (price) { if (/^\${1,3}$/.test(price)) facts.push({ productId: r.id, attribute: "price", value: price.length, valueText: price }); else bad.push(`${r.slug}: price_band "${price}"`); }
    if (nm && r.shape === "Wheelbase") { if (/^\d+(\.\d+)?$/.test(nm)) facts.push({ productId: r.id, attribute: "torque_nm", value: Number(nm), valueText: null }); else bad.push(`${r.slug}: torque_nm "${nm}"`); }
    if (plat) facts.push({ productId: r.id, attribute: "platform", value: null, valueText: plat });
    for (const k of [...SCORED.map(a => `expert_${a.key}`), "notes"]) {
      const v = line[col(k)]?.trim(); if (!v || v === "n/a") continue;
      if (k !== "notes" && !/^(10|[1-9])$/.test(v)) { bad.push(`${r.slug}: ${k} "${v}" (1–10)`); continue; }
      (known[r.slug] ??= {})[k.replace(/^expert_/, "")] = k === "notes" ? v : Number(v);
    }
  }
  console.log(`facts ${facts.length}, expert products ${Object.keys(known).length}, problems ${bad.length}${bad.length ? `:\n  ${bad.join("\n  ")}` : ""}`);
  if (process.argv.includes("--write")) {
    writeFileSync(new URL("../db/known-dots/simracing.json", import.meta.url), JSON.stringify(known, null, 1) + "\n");
    const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), now = new Date().toISOString();
    await db.transaction(async tx => {
      await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = 'owner-sheet-v1'`);
      for (const f of facts) await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at)
        values (${f.productId}, ${niche.id}, 'owner', ${`sheet:${f.productId}`}, 'owner', ${f.attribute}, ${f.value}, ${f.valueText}, 1, null, ${now}, 'owner-sheet-v1', ${now})`);
    });
    console.log(`saved ${facts.length} owner facts and db/known-dots/simracing.json`);
  }
} else throw new Error("step: export <out.csv> | report | import <filled.csv> [--write]");
process.exit(0);
