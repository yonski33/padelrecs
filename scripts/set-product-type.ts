import { execFileSync } from "node:child_process";
import postgres from "postgres";
import { niche } from "../lib/niche";
import { assertDatabaseTarget, assertNicheSchema } from "../lib/deployment-target";
import { assertSchemaName } from "../db/migrations";

// Moves named products of this niche (NICHE) from one type to another in the live database, e.g. SkinRecs ointments out of
// Moisturizer (2026-11-12). Only rows still filed under --from change; db/catalogs/<niche>.json is updated separately.
//   NICHE=skin npx tsx --env-file-if-exists=.env.local scripts/set-product-type.ts --from Moisturizer --to "Balm & ointment" <slug>… [--apply]
// Without --apply it only prints the products and what would change. With --apply this niche's schema is exported to
// backups/ first. Old product addresses redirect to the new type page by themselves (proxy.ts).
const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const from = arg("--from"), to = arg("--to"), apply = process.argv.includes("--apply");
const slugs = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !["--from", "--to"].includes(all[i - 1]));
if (!from || !to || !slugs.length) throw new Error('Usage: NICHE=<niche> … scripts/set-product-type.ts --from <Type> --to <Type> <slug>… [--apply]');
if (!niche.typePages?.some(t => t.shape === to) && !niche.shapeFilter.includes(to)) throw new Error(`"${to}" is not a type of ${niche.site.name}.`);
const schema = assertSchemaName(assertNicheSchema(niche));

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Set MIGRATION_DATABASE_URL or DATABASE_URL in .env.local");
assertDatabaseTarget(url, process.env.SUPABASE_PROJECT_REF);
const sql = postgres(url, { prepare: false, max: 1 });

try {
  const rows = await sql<{ slug: string; name: string; shape: string | null }[]>`select slug, name, shape from ${sql(schema)}.rackets where slug in ${sql(slugs)} order by slug`;
  const missing = slugs.filter(s => !rows.some(r => r.slug === s));
  if (missing.length) throw new Error(`Not in ${schema}: ${missing.join(", ")}`);
  for (const r of rows) console.log(`${r.slug}: ${r.shape ?? "(none)"}${r.shape === from ? ` → ${to}` : r.shape === to ? " (already)" : " (left alone: not " + from + ")"}`);
  if (!apply) { console.log("Dry run. Add --apply to write."); }
  else {
    const file = `backups/${niche.id}-before-set-type-${new Date().toISOString().replace(/[:.]/g, "").slice(0, 15)}.json`;
    execFileSync("npx", ["tsx", "--env-file-if-exists=.env.local", "scripts/export-data.ts", file], { stdio: "inherit", env: { ...process.env, NICHE: niche.id } });
    const changed = await sql`update ${sql(schema)}.rackets set shape = ${to} where slug in ${sql(slugs)} and shape = ${from} returning slug`;
    console.log(`Backup ${file}. Changed ${changed.length}: ${changed.map(r => r.slug).join(", ") || "none"}.`);
  }
} finally {
  await sql.end();
}
