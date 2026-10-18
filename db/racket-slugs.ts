import { and, eq, ne } from "drizzle-orm";
import { racketSlugRedirects, rackets } from "./schema";
import { slugify, type CatalogTransaction } from "./racket-selection";
import type { getDb } from "./index";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Turns whatever was typed ("Nox AT10 Genius!") into a URL-safe slug ("nox-at10-genius"). */
export const cleanSlug = (value: string) => slugify(value.trim()).slice(0, 200).replace(/-+$/, "");

/**
 * Point a racket at a new slug. The old slug is kept as a redirect so existing links and search rankings carry over.
 * Returns "unchanged", "changed", "taken" (another racket uses it) or "missing".
 */
export async function changeRacketSlug(tx: CatalogTransaction, racketId: string, requested: string, now = new Date()) {
  const slug = cleanSlug(requested);
  if (!SLUG_PATTERN.test(slug)) return "invalid" as const;
  const [current] = await tx.select({ slug: rackets.slug }).from(rackets).where(eq(rackets.id, racketId));
  if (!current) return "missing" as const;
  if (current.slug === slug) return "unchanged" as const;
  const [clash] = await tx.select({ id: rackets.id }).from(rackets).where(and(eq(rackets.slug, slug), ne(rackets.id, racketId)));
  if (clash) return "taken" as const;
  // A slug that used to redirect somewhere becomes a live page again; the old one starts redirecting here.
  await tx.delete(racketSlugRedirects).where(eq(racketSlugRedirects.slug, slug));
  await tx.insert(racketSlugRedirects).values({ slug: current.slug, racketId, createdAt: now.toISOString() })
    .onConflictDoUpdate({ target: racketSlugRedirects.slug, set: { racketId, createdAt: now.toISOString() } });
  await tx.update(rackets).set({ slug }).where(eq(rackets.id, racketId));
  return "changed" as const;
}

/** Current slug for a retired one, if any. */
export async function redirectedSlug(db: Pick<ReturnType<typeof getDb>, "select">, oldSlug: string) {
  const [row] = await db.select({ slug: rackets.slug }).from(racketSlugRedirects).innerJoin(rackets, eq(rackets.id, racketSlugRedirects.racketId)).where(eq(racketSlugRedirects.slug, oldSlug));
  return row?.slug ?? null;
}

export async function oldSlugs(db: Pick<ReturnType<typeof getDb>, "select">, racketId: string) {
  return (await db.select({ slug: racketSlugRedirects.slug }).from(racketSlugRedirects).where(eq(racketSlugRedirects.racketId, racketId))).map(r => r.slug);
}
