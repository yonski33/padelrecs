// CoffeeRecs: catalogue corrections from Grok's maker spec check (2026-11-18, coffeerecs-data-check.md; built into
// db/fixes/coffee-2026-11-18.json by scripts/grok-coffee/build_specs.py). Two kinds of change:
//   - the Type column (balance) mapped to one fixed value per category (espresso: the heater; grinders: hand / flat / conical
//     electric; brewers: the method; kettles; scales: espresso or brew). Features that used to sit in Type (built-in grinder,
//     E61, flow control, single dose) are facts in db/specs/coffee.json and show as chips on the product page;
//   - Grok's errors (ECM Mechanika Max II is a heat exchanger, Vario+ ceramic burrs, Timemore Basic 3.0 2 kg, Varia EVO 0.8 kg,
//     key specs that held a feature or a motor figure).
// Input: a JSON array of { name, set: { balance?, weight?, core?, surface? }, source, why }. The maker URL also goes into
// db/catalogs/coffee.json's sources with the same values. Dry run by default (old → new per field, with the source and why);
// --check writes inside a transaction and rolls it back; --write writes (only with the owner's OK typed in the session).
//   NICHE=coffee npx tsx --conditions=react-server --env-file=.env.local scripts/coffee-data-fix.mts db/fixes/coffee-2026-11-18.json [--check|--write] [--md out.md]
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

if (niche.id !== "coffee") throw new Error("Run with NICHE=coffee.");
const args = process.argv.slice(2), check = args.includes("--check"), write = args.includes("--write") || check;
const md = args.includes("--md") ? args[args.indexOf("--md") + 1] : null;
const [file] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--md");
if (!file) throw new Error("Usage: coffee-data-fix.mts <fixes.json> [--check|--write] [--md out.md]");
type Col = "balance" | "weight" | "core" | "surface";
type Fix = { name: string; set: Partial<Record<Col, string | null>>; source: string; why: string };
const fixes = JSON.parse(readFileSync(file, "utf8")) as Fix[];
const LABEL: Record<Col, string> = { balance: "type", weight: "weight", core: "material", surface: "key specs" };
const MAX: Record<Col, number> = { balance: 120, weight: 120, core: 200, surface: 160 };
const R = <T,>(x: unknown) => (Array.isArray(x) ? x : (x as { rows: T[] }).rows) as T[];
const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = R<{ id: string; name: string; shape: string } & Record<Col, string | null>>(await db.execute(sql`select id, name, shape, balance, weight, core, surface from ${S}.rackets`));
const plan: { id: string; name: string; shape: string; cols: Partial<Record<Col, string | null>>; old: Partial<Record<Col, string | null>>; source: string; why: string }[] = [], bad: string[] = [];
for (const f of fixes) {
  const r = rows.filter(x => x.name === f.name);
  if (r.length !== 1) { bad.push(`${f.name}: ${r.length} matches`); continue; }
  const p = r[0], cols: Partial<Record<Col, string | null>> = {}, old: Partial<Record<Col, string | null>> = {};
  for (const [k, v] of Object.entries(f.set) as [Col, string | null][]) if ((p[k] ?? null) !== v) { cols[k] = v; old[k] = p[k]; }
  const long = (Object.entries(cols) as [Col, string | null][]).find(([k, v]) => (v?.length ?? 0) > MAX[k]);
  if (long) { bad.push(`${f.name}: ${LABEL[long[0]]} over ${MAX[long[0]]} chars`); continue; }
  if (!Object.keys(cols).length) { bad.push(`${f.name}: already right`); continue; }
  plan.push({ id: p.id, name: p.name, shape: p.shape, cols, old, source: f.source, why: f.why });
  console.log(`\n${p.name} (${p.shape})   ${f.source}\n  why: ${f.why}`);
  for (const [k, v] of Object.entries(cols) as [Col, string | null][]) console.log(`  ${LABEL[k].padEnd(10)} ${JSON.stringify(p[k] ?? "")} → ${JSON.stringify(v ?? "")}`);
}
console.log(`\n${plan.length} products to change; ${bad.length} skipped${bad.length ? `:\n  ${bad.join("\n  ")}` : ""}`);
if (md) {
  const esc = (s: string | null | undefined) => (s ?? "").replace(/\|/g, "\\|");
  const lines = ["| Product | Field | Now | New | Why | Source |", "|---|---|---|---|---|---|",
    ...plan.flatMap(p => (Object.entries(p.cols) as [Col, string | null][]).map(([k, v]) => `| ${esc(p.name)} | ${LABEL[k]} | ${esc(p.old[k])} | ${esc(v)} | ${esc(p.why)} | ${p.source} |`))];
  writeFileSync(md, lines.join("\n") + "\n");
  console.log(`table written to ${md}`);
}
if (write) {
  await db.transaction(async tx => {
    for (const p of plan) for (const [k, v] of Object.entries(p.cols) as [Col, string | null][]) await tx.execute(sql`update ${S}.rackets set ${sql.identifier(k)} = ${v} where id = ${p.id}`);
    console.log(`${check ? "checked (rolled back)" : "updated"} ${plan.length} products`);
    if (check) throw new Error("ROLLBACK (--check)");
  }).catch(e => { if (check && String(e?.message).includes("ROLLBACK (--check)")) return; console.error("FAILED:", e?.message, e?.cause?.message ?? ""); process.exit(1); });
  if (!check) {
    // The file keeps one product per line: only the changed products' lines are rewritten, so the diff stays readable.
    const path = new URL("../db/catalogs/coffee.json", import.meta.url);
    let n = 0;
    const lines = readFileSync(path, "utf8").split("\n").map(line => {
      const t = line.trim(); if (!t.startsWith('{"brand"')) return line;
      const comma = t.endsWith(",") ? "," : "", c = JSON.parse(t.replace(/,$/, "")) as { name: string; sources?: string[] } & Partial<Record<Col, string | null>>;
      const p = plan.find(x => x.name === c.name); if (!p) return line;
      Object.assign(c, p.cols); c.sources = [...new Set([...(c.sources ?? []), p.source])]; n++;
      return `${line.slice(0, line.length - line.trimStart().length)}${JSON.stringify(c)}${comma}`;
    });
    writeFileSync(path, lines.join("\n"));
    console.log(`db/catalogs/coffee.json updated (${n} products)`);
  }
}
process.exit(0);
