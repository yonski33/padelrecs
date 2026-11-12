import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./index";
import { rackets } from "./schema";

/** Saves the photo the live Amazon lookup found, only where the product has none yet, so a manual choice is never overwritten. */
export async function saveAmazonPhoto(racketId: string, asin: string, image: string) {
  await getDb().update(rackets).set({ amazonAsin: asin, amazonImage: image })
    .where(and(eq(rackets.id, racketId), isNull(rackets.amazonImage)));
}
