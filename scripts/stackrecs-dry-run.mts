// StackRecs DB dry run (owner OK "dry run first", 2026-11-19): inside ONE transaction that always rolls back, create the
// stackrecs schema with every drizzle migration (rewritten for it, db/migrations.ts) and import the catalog snapshot, then
// report what would exist. Nothing is kept. Refuses to run unless NICHE=stackrecs and the schema doesn't exist yet.
// Usage: NICHE=stackrecs npx tsx --env-file=<.env.local> scripts/stackrecs-dry-run.mts backups/stackrecs-catalog.json
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { migrationsFor } from "../db/migrations";
import { parseSnapshot, importSnapshot } from "../db/transfer";

if (niche.id !== "stackrecs") throw new Error("NICHE=stackrecs only");
const path = process.argv[2]; if (!path) throw new Error("Usage: … scripts/stackrecs-dry-run.mts <snapshot.json>");
const snapshot = parseSnapshot(JSON.parse(await readFile(path, "utf8")));
class Rollback extends Error {}
const { db, client } = connect();
try {
  const [have] = await client`select count(*)::int as n from information_schema.schemata where schema_name = ${niche.schema}`;
  if (have.n > 0) throw new Error(`Schema "${niche.schema}" already exists: not a fresh dry run.`);
  const migrations = migrationsFor(niche.schema);
  let report: Record<string, unknown> = {};
  try {
    await db.transaction(async tx => {
      let statements = 0;
      for (const m of migrations) for (const s of m.sql) if (s.trim()) { await tx.execute(sql.raw(s)); statements++; }
      const verified = await importSnapshot(tx as never, snapshot);
      const tables = await tx.execute(sql`select table_name from information_schema.tables where table_schema = ${niche.schema} order by 1`);
      const rls = await tx.execute(sql`select count(*)::int as n from pg_tables where schemaname = ${niche.schema} and not rowsecurity`);
      const other = await tx.execute(sql`select count(*)::int as n from information_schema.tables where table_schema = 'padelrecs'`);
      report = { migrations: migrations.length, statements, tables: (tables as unknown as { table_name: string }[]).map(t => t.table_name),
        tablesWithoutRls: (rls as unknown as { n: number }[])[0].n, padelTablesSeen: (other as unknown as { n: number }[])[0].n, verified };
      throw new Rollback();
    });
  } catch (e) { if (!(e instanceof Rollback)) throw e; }
  const [after] = await client`select count(*)::int as n from information_schema.schemata where schema_name = ${niche.schema}`;
  console.log(JSON.stringify({ ...report, rolledBack: after.n === 0 }, null, 1));
} finally { await client.end(); }
