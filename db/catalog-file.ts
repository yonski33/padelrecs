import { readFile } from "node:fs/promises";
import { z } from "zod";
import { slugify } from "../lib/slug";
import { parseSnapshot, snapshotSource, type Snapshot } from "./transfer";

// A niche's researched starter catalog (db/catalogs/<niche>.json): brands and products with the sources each value came from.
const text = z.string().trim().min(1).nullable();
const file = z.object({
  about: z.string(), checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  brands: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) }).strict()),
  paddles: z.array(z.object({
    brand: z.string().min(1), name: z.string().min(1), year: z.number().int().min(1980).max(2100).optional(),
    shape: text, weight: text, core: text, surface: text, swingWeight: text, sources: z.array(z.string().min(1)).min(1),
  }).strict()),
}).strict();
export type CatalogFile = z.infer<typeof file>;

export async function readCatalog(path: string) { return file.parse(JSON.parse(await readFile(path, "utf8"))); }

/** The catalog as a db:import snapshot for one schema: brands and products only, never reviews.
 * With years (padel, pickleball) names end in the model year; without (skincare) the year column holds the year it was checked. */
export function catalogSnapshot(catalog: CatalogFile, schema: string, origin: string, withYears = true): Snapshot {
  const createdAt = `${catalog.checked}T12:00:00Z`;
  return parseSnapshot({
    formatVersion: 1, source: snapshotSource(origin, schema), exportedAt: new Date(`${catalog.checked}T12:00:00Z`).toISOString(),
    tables: {
      brands: catalog.brands.map(b => ({ id: b.id, name: b.name, slug: slugify(b.name) })),
      rackets: catalog.paddles.map(p => {
        if (withYears && p.year === undefined) throw new Error(`${p.name} needs a model year`);
        const year = p.year ?? Number(catalog.checked.slice(0, 4));
        const name = withYears ? `${p.name} ${year}` : p.name, slug = slugify(name);
        if (!catalog.brands.some(b => b.id === p.brand)) throw new Error(`Unknown brand "${p.brand}" for ${name}`);
        return { id: slug, brand_id: p.brand, name, slug, year, image_url: null, shape: p.shape, weight: p.weight, balance: p.swingWeight, surface: p.surface, core: p.core, description: null, created_at: createdAt };
      }),
      reviews: [], external_reviews: [],
    },
  });
}
