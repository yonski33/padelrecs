import { eq } from "drizzle-orm";
import { slugify } from "../lib/slug";
import { rackets } from "./schema";
import { verifySnapshot, type Snapshot } from "./transfer";
import { changeRacketSlug } from "./racket-slugs";
import type { CatalogTransaction } from "./racket-selection";

// For a niche that stops putting model years in product names (PickleballRecs, 2026-10-22):
// "Vatic Pro Prism 2023" → "Vatic Pro Prism", /paddles/vatic-pro-prism-2023 → /paddles/vatic-pro-prism.
// Ids and the year column keep their values; each old slug becomes a redirect to the product.
export type NameYearRename = { id: string; oldName: string; newName: string; oldSlug: string; newSlug: string };

/** The renames for a snapshot of the live schema, problems that must stop the write, and the snapshot as it should look afterwards. */
export function planNameYears(snapshot: Snapshot, now: Date) {
  const { rackets, racket_slug_redirects: redirects = [] } = snapshot.tables;
  const renames: NameYearRename[] = [];
  for (const r of rackets) {
    const suffix = ` ${r.year}`;
    if (!r.name.endsWith(suffix)) continue;
    const newName = r.name.slice(0, -suffix.length).trim();
    renames.push({ id: r.id, oldName: r.name, newName, oldSlug: r.slug, newSlug: slugify(newName) });
  }
  const problems: string[] = [];
  const renamed = new Set(renames.map(r => r.id));
  const taken = new Map(rackets.filter(r => !renamed.has(r.id)).map(r => [r.slug, r.name]));
  const newSlugs = new Map<string, string>();
  for (const r of renames) {
    if (!r.newSlug) problems.push(`"${r.oldName}" has nothing left for a URL`);
    if (r.oldSlug !== slugify(r.oldName)) problems.push(`"${r.oldName}" has a hand-picked slug "${r.oldSlug}"; rename it in admin instead`);
    const other = taken.get(r.newSlug) ?? newSlugs.get(r.newSlug);
    if (other) problems.push(`"${r.oldName}" → ${r.newSlug} collides with "${other}"`);
    newSlugs.set(r.newSlug, r.oldName);
    const redirect = redirects.find(d => d.slug === r.newSlug && d.racket_id !== r.id);
    if (redirect) problems.push(`${r.newSlug} already redirects to another product (${redirect.racket_id})`);
  }
  const byId = new Map(renames.map(r => [r.id, r]));
  const createdAt = now.toISOString();
  const after: Snapshot = {
    ...snapshot, exportedAt: createdAt,
    tables: {
      ...snapshot.tables,
      rackets: rackets.map(r => { const n = byId.get(r.id); return n ? { ...r, name: n.newName, slug: n.newSlug } : r; }),
      racket_slug_redirects: [
        // A new slug that used to redirect to the same product is a live page again.
        ...redirects.filter(d => !renames.some(r => r.newSlug === d.slug)),
        ...renames.map(r => ({ slug: r.oldSlug, racket_id: r.id, created_at: createdAt })),
      ],
    },
  };
  return { renames, problems, after };
}

/** Applies planned renames inside a transaction, then checks every product and redirect against the planned snapshot (throws, so nothing is written, on any mismatch). */
export async function applyNameYears(tx: CatalogTransaction, plan: Pick<ReturnType<typeof planNameYears>, "renames" | "after">, now: Date) {
  for (const r of plan.renames) {
    const result = await changeRacketSlug(tx, r.id, r.newSlug, now);
    if (result !== "changed") throw new Error(`${r.oldName}: slug change ${result}`);
    await tx.update(rackets).set({ name: r.newName }).where(eq(rackets.id, r.id));
  }
  return verifySnapshot(tx, { ...plan.after, tables: { ...plan.after.tables, reviews: [], external_reviews: [] } });
}
