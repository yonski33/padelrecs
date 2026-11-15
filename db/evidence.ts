import { sql } from "drizzle-orm";
import { database } from "./data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "./migrations";
import type { EvidenceRow } from "../lib/evidence";

/** The active niche's evidence rows (migration 0023, lib/evidence.ts), for the trait scores. Empty when the table is missing
 *  (a niche not migrated yet) or holds nothing, so callers fall back to counting tags. Spec rows are left out (the specs
 *  are read from the catalog). */
export async function evidenceRows(): Promise<EvidenceRow[]> {
  try {
    const db = await database();
    const res = await db.execute(sql`select product_id, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by
      from ${sql.identifier(assertSchemaName(niche.schema))}.evidence where niche = ${niche.id} and attribute not like 'spec:%'`);
    const list = (res as unknown as { rows?: Row[] }).rows ?? (res as unknown as Row[]);
    return list.map(r => ({ productId: r.product_id, sourceKind: r.source_kind as EvidenceRow["sourceKind"], sourceRef: r.source_ref, authorKey: r.author_key, attribute: r.attribute,
      value: r.value === null ? null : Number(r.value), valueText: r.value_text, strength: Number(r.strength) as EvidenceRow["strength"], quote: r.quote, saidAt: r.said_at, extractedBy: r.extracted_by }));
  } catch { return []; }
}
type Row = { product_id: string; source_kind: string; source_ref: string; author_key: string | null; attribute: string; value: number | string | null; value_text: string | null; strength: number | string; quote: string | null; said_at: string | null; extracted_by: string };
