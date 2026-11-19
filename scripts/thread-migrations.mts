// Thread redesign migrations (db/thread-migrations): the dry run and the backup of the owner's routine, never the write.
//   NICHE=padel npx tsx --env-file-if-exists=.env.local scripts/thread-migrations.mts            dry run (each file in a transaction, rolled back)
//   NICHE=padel npx tsx --env-file-if-exists=.env.local scripts/thread-migrations.mts --backup <dir>   rackets table as JSON
// The write goes through drizzle/ after the owner's OK (db/thread-migrations/README.md), so this script has no apply mode.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { assertDatabaseTarget } from "../lib/deployment-target";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../db/thread-migrations");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
assertDatabaseTarget(url, process.env.SUPABASE_PROJECT_REF);
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const backup = process.argv.indexOf("--backup");
  if (backup > 0) {
    const dir = process.argv[backup + 1]; if (!dir) throw new Error("--backup needs a folder");
    mkdirSync(dir, { recursive: true });
    const { rows } = await client.query(`select * from "padelrecs"."rackets" order by id`);
    const file = join(dir, `padelrecs-rackets-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(file, JSON.stringify(rows));
    console.log(`Backup: ${rows.length} rackets → ${file}`);
  } else {
    const before = await client.query(`select table_name from information_schema.tables where table_schema='padelrecs' and table_name in ('trait_votes','comments','comment_votes')
      union all select 'rackets.model_line' from information_schema.columns where table_schema='padelrecs' and table_name='rackets' and column_name='model_line'`);
    console.log(`Already present: ${before.rows.map(r => r.table_name).join(", ") || "none"}`);
    for (const f of readdirSync(DIR).filter(f => f.endsWith(".sql")).sort()) {
      const body = readFileSync(join(DIR, f), "utf8").replace(/^\s*BEGIN;\s*$/m, "").replace(/^\s*COMMIT;\s*$/m, "");
      await client.query("BEGIN");
      try {
        const res = await client.query(body);
        const last = Array.isArray(res) ? res[res.length - 1] : res;
        console.log(`${f}: ok, check ${JSON.stringify(last.rows)}`);
      } catch (e) { console.log(`${f}: FAILED ${(e as Error).message}`); }
      finally { await client.query("ROLLBACK"); }
    }
    const after = await client.query(`select count(*)::int n from information_schema.tables where table_schema='padelrecs' and table_name in ('trait_votes','comments','comment_votes')`);
    console.log(`After rollback, new tables present: ${after.rows[0].n} (expected 0)`);
  }
} finally { await client.end(); }
