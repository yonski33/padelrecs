import { sql } from "drizzle-orm";
import { database } from "./data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "./migrations";
import { TRAITS, type Trait } from "../lib/trait-score";

/** Trait scores the owner set by hand in the admin area (rackets.trait_override jsonb, migration 0022), by product id. Read
 *  with raw SQL like the quick-take block: empty when the column is missing (a niche not migrated yet). */
export async function traitOverrides(): Promise<Map<string, Partial<Record<Trait, number>>>> {
  try {
    const db = await database();
    const rows = await db.execute(sql`select id, trait_override from ${sql.identifier(assertSchemaName(niche.schema))}.rackets where trait_override is not null`);
    const list = (rows as unknown as { rows?: Row[] }).rows ?? (rows as unknown as Row[]);
    return new Map(list.map(r => [r.id, cleanOverride(r.trait_override)]));
  } catch { return new Map(); }
}
type Row = { id: string; trait_override: unknown };
/** Only known traits with a whole number 0–99 survive. */
export function cleanOverride(v: unknown): Partial<Record<Trait, number>> {
  const o = v && typeof v === "object" ? v as Record<string, unknown> : {};
  return Object.fromEntries(TRAITS.filter(t => Number.isInteger(o[t]) && (o[t] as number) >= 0 && (o[t] as number) <= 99).map(t => [t, o[t] as number]));
}
