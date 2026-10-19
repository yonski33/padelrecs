import { readMigrationFiles } from "drizzle-orm/migrator";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The SQL in drizzle/ is written for the "padelrecs" schema (drizzle-kit generates it with NICHE unset).
 * Other niches run the same migrations with that schema name swapped for their own, and track them in
 * their own table, so each niche's tables evolve independently inside the shared database.
 */
export const SOURCE_SCHEMA = "padelrecs";
const VALID_SCHEMA = /^[a-z][a-z0-9_]{0,62}$/;

export function assertSchemaName(schema: string) {
  if (!VALID_SCHEMA.test(schema)) throw new Error(`Invalid Postgres schema name "${schema}"`);
  return schema;
}

/** One migration statement rewritten for a niche schema. Every reference in generated SQL is quoted: "padelrecs". */
export function forSchema(sql: string, schema: string) {
  return sql.replaceAll(`"${SOURCE_SCHEMA}"`, `"${assertSchemaName(schema)}"`);
}

export function migrationsFor(schema: string, migrationsFolder = "./drizzle") {
  return readMigrationFiles({ migrationsFolder }).map(m => ({ ...m, sql: m.sql.map(statement => forSchema(statement, schema)) }));
}

/** A temporary copy of drizzle/ rewritten for a niche schema, for drizzle's own migrate(). */
export async function migrationsFolderFor(schema: string, source = "./drizzle") {
  const folder = await mkdtemp(join(tmpdir(), `recs-migrations-${assertSchemaName(schema)}-`));
  await mkdir(join(folder, "meta"));
  await writeFile(join(folder, "meta", "_journal.json"), await readFile(join(source, "meta", "_journal.json")));
  for (const file of (await readdir(source)).filter(f => f.endsWith(".sql"))) {
    await writeFile(join(folder, file), forSchema(await readFile(join(source, file), "utf8"), schema));
  }
  return folder;
}

/** Padel keeps drizzle's default tracking table (its history predates the platform); other niches get their own. */
export function migrationsTable(schema: string) {
  return schema === SOURCE_SCHEMA ? "__drizzle_migrations" : `__drizzle_migrations_${assertSchemaName(schema)}`;
}

/** All migrations as plain SQL, in order, for local throwaway engines (tests and export checks). */
export function migrationSql(schema: string, migrationsFolder = "./drizzle") {
  return migrationsFor(schema, migrationsFolder).map(m => m.sql.join("\n"));
}
