import { eq } from "drizzle-orm";
import { z } from "zod";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";
import { rackets } from "./schema";
import { matchVariant } from "../lib/variants";
import type { Niche } from "../lib/niche/types";

/** A variant as posted by the review forms (niche.variants; DiscGolfRecs: the plastic). Blank ("Not sure / other") or
 *  missing is no variant; anything else is checked against the product's list by reviewVariant. */
export const variantInput = z.preprocess(v => typeof v === "string" ? v.trim() || undefined : v ?? undefined, z.string().max(100).optional());

type Reader = Pick<PgDatabase<PgQueryResultHKT, typeof schema>, "select">;
/** The variant to store for a player or web review of an existing product: one of that product's variants (its `core`
 *  list), in the catalogue's spelling; null when the niche has no variants, none was given, or the product doesn't list it. */
export async function reviewVariant(db: Reader, niche: Pick<Niche, "variants">, racketId: string, variant: string | null | undefined) {
  if (!niche.variants || !variant?.trim()) return null;
  const [racket] = await db.select({ core: rackets.core }).from(rackets).where(eq(rackets.id, racketId));
  return matchVariant(niche, racket?.core, variant);
}
