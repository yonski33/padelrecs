// SimRacingRecs: builds db/compat/simracing-pairs.json ("Works with", lib/simracing-pairs.ts) from the checked
// compatibility table (db/compat/simracing.json) and the summary's "check" pairs. Repo files only, no database write.
//   npx tsx scripts/simracing-pairs.mts <summary.md> [--write] [--show "Name" ...]
import { readFileSync, writeFileSync } from "node:fs";
import { buildPairs, checkPairs, type CompatTable, type PairItem } from "../lib/simracing-pairs";
const args = process.argv.slice(2), write = args.includes("--write"), [summaryFile] = args.filter(a => !a.startsWith("--"));
const show = args.flatMap((a, i) => args[i - 1] === "--show" ? [a] : []);
const items = (JSON.parse(readFileSync(new URL("../db/catalogs/simracing.json", import.meta.url), "utf8")) as { products: PairItem[] }).products.filter(p => p.shape !== "Cockpit");
const table = JSON.parse(readFileSync(new URL("../db/compat/simracing.json", import.meta.url), "utf8")) as CompatTable;
const check: [string, string][] = [...checkPairs(readFileSync(summaryFile, "utf8"), items),
  // The summary's note under the T-LCM question: the T3PM's own checker leaves out the T80 too.
  ["Thrustmaster T3PM", "Thrustmaster T80 Ferrari 488 GTB Edition"]];
const pairs = buildPairs(table, items, check);
const n = Object.values(pairs).reduce((a, l) => a + l.length, 0) / 2;
console.log(`${Object.keys(pairs).length} products with a "works with" list, ${n} pairs; ${check.length} check pairs held back`);
for (const c of check) console.log(`  check: ${c[0]} ↔ ${c[1]}`);
for (const s of show) console.log(`\n${s}:\n  ${(pairs[s] ?? []).map(p => `${p.name}${p.note ? ` (${p.note})` : ""}`).join("\n  ") || "—"}`);
if (write) { writeFileSync(new URL("../db/compat/simracing-pairs.json", import.meta.url), JSON.stringify(pairs, null, 1) + "\n"); console.log("written"); }
