// Prints each spec filter's group counts on live data, and the products it can't place (with their raw value), so a
// site's lib/spec-filters/<site>.ts can be checked. Read-only. Usage:
//   NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/spec-filter-counts.mts [--misses]
import { catalog } from "../db/data";
import { siteSpecFilters } from "../lib/spec-filters";
import { niche } from "../lib/niche";
const data = await catalog(); const showMisses = process.argv.includes("--misses");
for (const f of siteSpecFilters) {
  const pool = data.listed.filter(r => !f.categories || f.categories.some(c => c.toLowerCase() === (r.shape ?? "").toLowerCase()));
  const res = pool.map(r => ({ r, keys: f.classify(r as unknown as Record<string, unknown>) }));
  const bad = res.flatMap(x => x.keys.filter(k => !f.groups.some(g => g.key === k)));
  console.log(`## ${f.label} (${f.id})${f.categories ? ` in ${f.categories.join(", ")}` : ""}: ${res.filter(x => x.keys.length).length}/${pool.length} placed${bad.length ? `, UNKNOWN KEYS ${[...new Set(bad)].join(",")}` : ""}`);
  for (const g of f.groups) console.log(`  ${String(res.filter(x => x.keys.includes(g.key)).length).padStart(4)}  ${g.label}`);
  if (showMisses) for (const x of res.filter(x => !x.keys.length).slice(0, 15)) console.log(`     miss: ${x.r.name.slice(0, 40)} | ${JSON.stringify(Object.fromEntries(Object.entries(x.r).filter(([k, v]) => typeof v === "string" && (k === "shape" || niche.specs.some(s => s.column === k)))))}`);
}
process.exit(0);
