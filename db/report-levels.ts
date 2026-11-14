import { sql } from "drizzle-orm";
import { database } from "./data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "./migrations";

/** Web reports whose writer states their own level (external_reviews.player_level, migration 0021; tagged by
 *  scripts/save-report-levels.mts with the exact words in level_quote). Only the racket fit page reads it. Empty when the
 *  column is missing (a niche not migrated yet) or nothing is tagged. */
export async function reportLevels(racketId: string): Promise<Map<string, { level: string; excerpt: string | null; english: boolean }>> {
  try {
    const db = await database();
    const rows = await db.execute(sql`select id::text as id, player_level, excerpt, source_language from ${sql.identifier(assertSchemaName(niche.schema))}.external_reviews
      where racket_id = ${racketId} and player_level is not null`);
    const list = (rows as unknown as { rows?: Row[] }).rows ?? (rows as unknown as Row[]);
    return new Map(list.map(r => [r.id, { level: r.player_level, excerpt: r.excerpt, english: !r.source_language || r.source_language === "en" }]));
  } catch { return new Map(); }
}
type Row = { id: string; player_level: string; excerpt: string | null; source_language: string | null };
