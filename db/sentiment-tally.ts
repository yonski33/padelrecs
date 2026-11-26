// The owner's typed overall tallies (Traits tab, trait_overrides under SENTIMENT_KEY), by product: the Loved it / Mixed /
// Not for me counts a product page shows when one is saved (lib/thread/trait-view.ts tallyWith). Read by the Thread rows
// (app/thread/data.ts) and the match engine (app/match-context.ts), so the page's vote bar and the match % read the same
// counts (owner report 2026-11-26: a racket with 44 votes on its page was scored from its 7 counted reviews). Empty on any
// error, so the pages keep the counted tally.
import { eq } from "drizzle-orm";
import { traitOverrides } from "./schema";
import { database } from "./data";
import { SENTIMENT_KEY } from "../lib/thread/trait-view";

const missingTable = (e: unknown) => [(e as { code?: string })?.code, (e as { cause?: { code?: string } })?.cause?.code].includes("42P01");
export async function sentimentOverrides(): Promise<Map<string, Record<string, number>>> {
  if (!process.env.DATABASE_URL) return new Map();
  try {
    const db = await database();
    const rows = await db.select({ id: traitOverrides.racketId, counts: traitOverrides.reviewCounts }).from(traitOverrides).where(eq(traitOverrides.trait, SENTIMENT_KEY));
    return new Map(rows.flatMap(r => r.counts ? [[r.id, r.counts as Record<string, number>] as const] : []));
  } catch (error) { if (!missingTable(error)) console.error("[sentiment] overrides failed", error); return new Map(); }
}
