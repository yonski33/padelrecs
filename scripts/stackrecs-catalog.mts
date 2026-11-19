// Writes db/catalogs/stackrecs.json from lib/stack/catalog.ts, the one list the pages and the database share. Names and
// vendor sites only; prices stay in the code file (unchecked, never seeded). Then the usual path imports it:
//   NICHE=stackrecs npx tsx scripts/catalog-snapshot.ts backups/stackrecs-catalog.json
//   NICHE=stackrecs npm run db:import -- backups/stackrecs-catalog.json           (validation only)
//   NICHE=stackrecs npm run db:import -- backups/stackrecs-catalog.json --apply   (owner's typed OK)
import { writeFile } from "node:fs/promises";
import { STACK_TOOLS } from "../lib/stack/catalog";
import { slugify } from "../lib/slug";

const vendors = [...new Map(STACK_TOOLS.map(t => [slugify(t.vendor), t.vendor])).entries()].map(([id, name]) => ({ id, name }));
const out = {
  about: "StackRecs pilot catalog (plan PR #517, owner sign-off 2026-11-19): 24 Build and 15 Grow tools. Generated from lib/stack/catalog.ts.",
  checked: "2026-11-19",
  brands: vendors,
  products: STACK_TOOLS.map(t => ({ id: t.slug, slug: t.slug, brand: slugify(t.vendor), name: t.name, shape: t.category, weight: null, core: null, surface: null,
    sources: [t.website], website: t.website })),
};
await writeFile("db/catalogs/stackrecs.json", `${JSON.stringify(out, null, 1)}\n`);
console.log(`${vendors.length} vendors, ${out.products.length} tools written to db/catalogs/stackrecs.json`);
