import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { database } from "./data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "./migrations";
import { readQuickTake, type QuickTake } from "../lib/quick-take";

/**
 * A product's quick-take block (rackets.quick_take, migration 0020), read on its own rather than in the catalog: blocks are
 * a few KB each and only the product page needs one. A missing column (a niche not migrated yet) or a block that no longer
 * validates gives null, which keeps the normal product page.
 * Local preview only: QUICKTAKE_DIR=<dir> shows <dir>/<slug>.json instead (never in production), so a block can be looked at
 * before scripts/save-quicktake.mts --write.
 */
export async function quickTakeFor(racketId: string, slug: string): Promise<QuickTake | null> {
  const dir = process.env.NODE_ENV !== "production" ? process.env.QUICKTAKE_DIR : undefined;
  if (dir) { try { return readQuickTake(JSON.parse(await readFile(join(dir, `${slug}.json`), "utf8"))); } catch { /* no local block: fall through */ } }
  try {
    const db = await database();
    const rows = await db.execute(sql`select quick_take from ${sql.identifier(assertSchemaName(niche.schema))}.rackets where id = ${racketId}`);
    const row = (rows as unknown as { rows?: { quick_take: unknown }[] }).rows?.[0] ?? (rows as unknown as { quick_take: unknown }[])[0];
    return readQuickTake(row?.quick_take);
  } catch { return null; }
}
