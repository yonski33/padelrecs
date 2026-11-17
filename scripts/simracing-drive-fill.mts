// SimRacingRecs: the drive type (Type column, rackets.balance) for wheelbases that had none, from the makers' own pages
// (owner OK 2026-11-16, "Yes, fill them"). Input: a JSON array of { name, drive, url } (drive: Gear | Belt | Hybrid |
// No force feedback | Unknown). Only empty Type columns are filled; "Unknown" is skipped, and so is "No force feedback" (no
// drive to name). The maker URL is added to the product's sources in db/catalogs/simracing.json, which gets the same value,
// so a later import keeps it. Dry run by default; --check rolls the DB write back.
//   NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-drive-fill.mts <drives.json> [--check|--write]
import { readFileSync, writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

if (niche.id !== "simracing") throw new Error("Run with NICHE=simracing.");
const args = process.argv.slice(2), check = args.includes("--check"), write = args.includes("--write") || check;
const [file] = args.filter(a => !a.startsWith("--"));
if (!file) throw new Error("Usage: simracing-drive-fill.mts <drives.json> [--check|--write]");
const VALUE: Record<string, string> = { Gear: "Gear drive", Belt: "Belt drive", Hybrid: "Hybrid (belt + gear)" };
const drives = JSON.parse(readFileSync(file, "utf8")) as { name: string; drive: string; url: string; quote?: string }[];
const data = await catalog();
const path = new URL("../db/catalogs/simracing.json", import.meta.url);
const cat = JSON.parse(readFileSync(path, "utf8")) as { products: { name: string; shape: string | null; balance: string | null; sources?: string[] }[] };
const plan: { id: string; name: string; value: string; url: string }[] = [], skipped: string[] = [];
for (const d of drives) {
  const value = VALUE[d.drive];
  const r = data.rackets.find(x => x.name === d.name && x.shape === "Wheelbase");
  if (!r) { skipped.push(`${d.name}: not in the catalogue`); continue; }
  if (!value) { skipped.push(`${d.name}: ${d.drive}`); continue; }
  if (r.balance) { skipped.push(`${d.name}: already "${r.balance}"`); continue; }
  if (!/^https:\/\/([a-z0-9-]+\.)*(logitechg|logi|logitech|thrustmaster)\.com\//.test(d.url)) { skipped.push(`${d.name}: not a maker URL (${d.url})`); continue; }
  plan.push({ id: r.id, name: r.name, value, url: d.url });
}
for (const p of plan) console.log(`${p.name.padEnd(56)} → ${p.value}   ${p.url}`);
console.log(`${plan.length} to fill; skipped ${skipped.length}${skipped.length ? `:\n  ${skipped.join("\n  ")}` : ""}`);
if (write) {
  const db = await database(), table = sql`${sql.identifier(assertSchemaName(niche.schema))}.rackets`;
  await db.transaction(async tx => {
    for (const p of plan) await tx.execute(sql`update ${table} set balance = ${p.value} where id = ${p.id} and balance is null`);
    console.log(`${check ? "checked (rolled back)" : "updated"} ${plan.length} products`);
    if (check) throw new Error("ROLLBACK (--check)");
  }).catch(e => { if (check && String(e?.message).includes("ROLLBACK (--check)")) return; console.error("FAILED:", e?.message, e?.cause?.message ?? ""); process.exit(1); });
  if (!check) {
    for (const p of plan) { const c = cat.products.find(x => x.name === p.name && x.shape === "Wheelbase"); if (!c) continue;
      c.balance = p.value; c.sources = [...new Set([...(c.sources ?? []), p.url])]; }
    writeFileSync(path, JSON.stringify(cat, null, 1) + "\n");
    console.log("db/catalogs/simracing.json updated");
  }
}
process.exit(0);
