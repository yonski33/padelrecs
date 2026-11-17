// SimRacingRecs: checks Grok's compatibility CSVs (lib/simracing-compat.ts rules) and, with --write, saves the rows that pass
// to db/compat/simracing.json (a repo file, no database write). Reads the catalogue from db/catalogs/simracing.json.
//   npx tsx scripts/simracing-compat-import.mts <folder with the *_compat.csv files> [--write]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseCsv, checkCompat, COMPAT_FILES, type CompatKind, type CatalogItem } from "../lib/simracing-compat";

const args = process.argv.slice(2), write = args.includes("--write");
const [dir] = args.filter(a => !a.startsWith("--"));
if (!dir) throw new Error("Usage: simracing-compat-import.mts <folder> [--write]");
const catalog = (JSON.parse(readFileSync(new URL("../db/catalogs/simracing.json", import.meta.url), "utf8")) as { products: CatalogItem[] }).products;
const out: Record<string, Record<string, Record<string, string>>> = {};
let bad = 0;
for (const kind of Object.keys(COMPAT_FILES) as CompatKind[]) {
  const file = join(dir, `${kind}_compat.csv`);
  if (!existsSync(file)) { console.log(`${kind}: no file yet (${file})`); continue; }
  const { problems, ok, missing } = checkCompat(kind, parseCsv(readFileSync(file, "utf8")), catalog);
  const unknown = ok.filter(r => Object.values(r).some(v => /^unknown$/i.test(v))).length;
  console.log(`\n${kind}: ${ok.length} rows pass, ${problems.length} problems, ${unknown} with an "unknown", ${missing.length} catalogue products missing`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  if (missing.length) console.log(`  missing: ${missing.join("; ")}`);
  bad += problems.length;
  out[kind] = Object.fromEntries(ok.map(({ name, ...rest }) => [name, rest]));
}
if (write) {
  if (bad) { console.error(`\nNot written: ${bad} problems. Fix the CSVs (or the names) and run again.`); process.exit(1); }
  writeFileSync(new URL("../db/compat/simracing.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
  console.log("\ndb/compat/simracing.json written");
}
process.exit(0);
