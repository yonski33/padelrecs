import { readFile, writeFile } from "node:fs/promises";
import { rackets, racketSlugRedirects } from "../db/schema";
import { parseSnapshot, snapshotSchema } from "../db/transfer";
import { planNameYears, applyNameYears } from "../db/name-years";
import type { CatalogTransaction } from "../db/racket-selection";
import { niche, hasYears, catalogPath } from "../lib/niche";
import { connect } from "./connection";

// One-off for a niche that dropped model years from product names (PickleballRecs, 2026-10-22): strips the trailing year
// from every name and slug and keeps each old slug as a redirect. Dry run unless --apply.
// Needs a fresh db:export of the same schema, checked with db:check-export; it refuses if the live catalog has changed since.
// Usage: NICHE=pickleball npx tsx --env-file-if-exists=.env.local scripts/drop-name-years.ts backups/<export>.json [--apply]
const [path, flag] = process.argv.slice(2);
if (!path || (flag && flag !== "--apply")) throw new Error("Usage: NICHE=<niche> npx tsx scripts/drop-name-years.ts <fresh export.json> [--apply]");
if (hasYears) throw new Error(`${niche.site.name} still puts years in names (productYears); set productYears: false first`);
const backup = parseSnapshot(JSON.parse(await readFile(path, "utf8")));
if (snapshotSchema(backup) !== niche.schema) throw new Error(`${path} is an export of "${snapshotSchema(backup)}", not "${niche.schema}"`);
if (!backup.tables.racket_slug_redirects) throw new Error(`${path} has no slug redirects table; take a fresh db:export`);

const now = new Date();
const { renames, problems, after } = planNameYears(backup, now);
const { db, client } = connect();
try {
  // The export must still describe the live catalog, so nothing renamed or added since then is missed.
  const key = (r: { id: string; name: string; slug: string; year: number }) => `${r.id}|${r.name}|${r.slug}|${r.year}`;
  const live = (await db.select({ id: rackets.id, name: rackets.name, slug: rackets.slug, year: rackets.year }).from(rackets)).map(key).sort();
  const saved = backup.tables.rackets.map(key).sort();
  const liveRedirects = (await db.select().from(racketSlugRedirects)).map(r => `${r.slug}|${r.racketId}`).sort();
  const savedRedirects = backup.tables.racket_slug_redirects.map(r => `${r.slug}|${r.racket_id}`).sort();
  if (JSON.stringify(live) !== JSON.stringify(saved) || JSON.stringify(liveRedirects) !== JSON.stringify(savedRedirects))
    throw new Error(`The live ${niche.words.many} or redirects changed since ${path} was exported; export again`);

  console.log(`${renames.length} of ${backup.tables.rackets.length} ${niche.words.many} in "${niche.schema}" end in their year.`);
  for (const r of renames.slice(0, 10)) console.log(`  ${r.oldName} → ${r.newName}   ${catalogPath}/${r.oldSlug} → ${catalogPath}/${r.newSlug}`);
  if (renames.length > 10) console.log(`  … and ${renames.length - 10} more`);
  if (problems.length) { console.error("Refusing to write:\n  " + problems.join("\n  ")); process.exitCode = 1; }
  else if (flag !== "--apply") console.log("Dry run. Add --apply to rename.");
  else {
    // Every product and redirect must match the planned snapshot afterwards, or nothing is written.
    // The scripts' postgres.js driver runs the same queries as the site's node-postgres one.
    const counts = await db.transaction(tx => applyNameYears(tx as unknown as CatalogTransaction, { renames, after }, now));
    const out = path.replace(/\.json$/, "") + "-after-name-years.json";
    await writeFile(out, JSON.stringify(after, null, 1), { mode: 0o600 });
    console.log(`Renamed ${renames.length} ${niche.words.many}; verified`, counts, `\nExpected state written to ${out} (check it with db:verify).`);
  }
} finally { await client.end(); }
