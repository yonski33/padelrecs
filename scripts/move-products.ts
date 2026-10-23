import { execFileSync } from "node:child_process";
import postgres from "postgres";
import { niche, niches } from "../lib/niche";
import { assertDatabaseTarget, assertNicheSchema } from "../lib/deployment-target";
import { readCatalog, catalogSnapshot } from "../db/catalog-file";
import { assertSchemaName } from "../db/migrations";

// Moves one category of products, with every review, web review, helpful vote and slug redirect they have, from another
// niche's schema into this one (NICHE). Built for GamingRecs monitors → MonitorRecs (2026-10-23). Ids, slugs, text, dates
// and source URLs are kept as they are; only tags outside this niche's bank are renamed with --tag old=new.
//   NICHE=monitor npx tsx --env-file-if-exists=.env.local scripts/move-products.ts --from gaming --shape Monitor --copy [--apply]
//     Inserts this niche's catalog (db/catalogs/<niche>.json) and copies the products' reviews here. Insert-only.
//   NICHE=monitor npx tsx --env-file-if-exists=.env.local scripts/move-products.ts --from gaming --shape Monitor --remove [--apply]
//     Checks that every row is here unchanged, then deletes the products and their rows from the other schema (and brands
//     left with no products there). Run it only once the other site redirects those pages.
// Without --apply nothing is written. With --apply both schemas are exported to backups/ first.
const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const from = niches[arg("--from") ?? ""], shape = arg("--shape"), apply = process.argv.includes("--apply");
const mode = process.argv.includes("--copy") ? "copy" : process.argv.includes("--remove") ? "remove" : null;
if (!from || !shape || !mode || from.id === niche.id) throw new Error("Usage: NICHE=<to> … scripts/move-products.ts --from <niche> --shape <Category> --copy|--remove [--tag old=new …] [--apply]");
const tagMap = new Map(process.argv.flatMap((a, i) => process.argv[i - 1] === "--tag" ? [a.split("=") as [string, string]] : []));
const src = assertSchemaName(assertNicheSchema(from)), dst = assertSchemaName(assertNicheSchema(niche));
const bank = new Set(niche.tags.map(t => t.label));
const retag = (tags: string[]) => tags.map(t => tagMap.get(t) ?? t);

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Set MIGRATION_DATABASE_URL or DATABASE_URL in .env.local");
assertDatabaseTarget(url, process.env.SUPABASE_PROJECT_REF);
const sql = postgres(url, { prepare: false, max: 1 });
type Row = Record<string, unknown>;
const same = (a: Row, b: Row | undefined) => !!b && Object.keys(a).every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));

try {
  // Everything that belongs to the products being moved, read from the other schema.
  // In the other schema they are found by category; here by id, since this niche files them under its own categories.
  const load = async (schema: string, only?: string[]) => {
    const rackets = only ? await sql<Row[]>`select * from ${sql(schema)}.rackets where id in ${sql(only.length ? only : [""])} order by id`
      : await sql<Row[]>`select * from ${sql(schema)}.rackets where shape = ${shape} order by id`;
    const ids = rackets.map(r => r.id as string);
    const reviews = await sql<Row[]>`select * from ${sql(schema)}.reviews where racket_id in ${sql(ids.length ? ids : [""])} order by id`;
    const external = await sql<Row[]>`select * from ${sql(schema)}.external_reviews where racket_id in ${sql(ids.length ? ids : [""])} order by id`;
    const redirects = await sql<Row[]>`select * from ${sql(schema)}.racket_slug_redirects where racket_id in ${sql(ids.length ? ids : [""])} order by slug`;
    const reviewIds = [...reviews.map(r => `player:${r.id}`), ...external.map(r => `web:${r.id}`)];
    const votes = (await sql<Row[]>`select * from ${sql(schema)}.review_votes order by review_type, review_id, voter`).filter(v => reviewIds.includes(`${v.review_type}:${v.review_id}`));
    return { rackets, reviews, external, redirects, votes };
  };
  const moving = await load(src);
  const counts = (d: Awaited<ReturnType<typeof load>>) => ({ products: d.rackets.length, reviews: d.reviews.length, webReviews: d.external.length, votes: d.votes.length, slugRedirects: d.redirects.length });
  console.log(`${from.site.name} (schema "${src}") ${shape} rows:`, counts(moving));

  const catalog = catalogSnapshot(await readCatalog(`db/catalogs/${niche.id}.json`), dst, `catalog:db/catalogs/${niche.id}.json`, false);
  const catalogIds = new Map(catalog.tables.rackets.map(r => [r.id, r]));
  const missing = moving.rackets.filter(r => catalogIds.get(r.id as string)?.slug !== r.slug);
  if (missing.length) throw new Error(`Not in db/catalogs/${niche.id}.json under the same id and slug: ${missing.map(r => r.name).join(", ")}`);
  const unknownTags = [...new Set([...moving.reviews, ...moving.external].flatMap(r => retag(r.tags as string[])).filter(t => !bank.has(t)))];
  if (unknownTags.length) throw new Error(`Tags outside ${niche.site.name}'s bank: ${unknownTags.join(", ")} (map them with --tag old=new)`);
  const expected = {
    reviews: moving.reviews.map(r => ({ ...r, tags: retag(r.tags as string[]) }) as Row),
    external: moving.external.map(r => ({ ...r, tags: retag(r.tags as string[]) }) as Row),
    redirects: moving.redirects, votes: moving.votes,
  };
  // True when every moved row is in this schema with the same values (tags as renamed).
  const verifyHere = async () => {
    const here = await load(dst, moving.rackets.map(r => r.id as string));
    const by = (rows: Row[], key: (r: Row) => string) => new Map(rows.map(r => [key(r), r]));
    const problems = [
      ...moving.rackets.filter(r => !here.rackets.some(h => h.id === r.id && h.slug === r.slug)).map(r => `product ${r.name}`),
      ...expected.reviews.filter(r => !same(r, by(here.reviews, x => x.id as string).get(r.id as string))).map(r => `review ${r.id}`),
      ...expected.external.filter(r => !same(r, by(here.external, x => x.id as string).get(r.id as string))).map(r => `web review ${r.id}`),
      ...expected.redirects.filter(r => !same(r, by(here.redirects, x => x.slug as string).get(r.slug as string))).map(r => `slug redirect ${r.slug}`),
      ...expected.votes.filter(v => !same(v, by(here.votes, x => `${x.review_type}:${x.review_id}:${x.voter}`).get(`${v.review_type}:${v.review_id}:${v.voter}`))).map(v => `vote on ${v.review_id}`),
    ];
    return { here, problems };
  };

  if (mode === "copy") {
    console.log(`Copy into ${niche.site.name} (schema "${dst}"): ${catalog.tables.brands.length} brands and ${catalog.tables.rackets.length} products from the catalog, plus the rows above. Insert-only.`);
    if (!apply) { console.log("Dry run: nothing changed. Add --apply to back up and copy."); process.exit(0); }
  } else {
    const { problems } = await verifyHere();
    if (problems.length) throw new Error(`Not everything is in "${dst}" yet, nothing deleted: ${problems.slice(0, 10).join("; ")}${problems.length > 10 ? ` (+${problems.length - 10} more)` : ""}`);
    console.log(`Every row is in "${dst}" unchanged. Remove them from "${src}".`);
    if (!apply) { console.log("Dry run: nothing changed. Add --apply to back up and delete from the other schema."); process.exit(0); }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
  for (const n of [from, niche]) {
    const file = `backups/${n.id}-before-move-${mode}-${stamp}.json`;
    execFileSync("npx", ["tsx", "--env-file-if-exists=.env.local", "scripts/export-data.ts", file], { stdio: "inherit", env: { ...process.env, NICHE: n.id } });
  }

  if (mode === "copy") {
    await sql.begin(async tx => {
      const ins = async (table: string, rows: Row[], key: string) => { for (let i = 0; i < rows.length; i += 50) await tx`insert into ${tx(dst)}.${tx(table)} ${tx(rows.slice(i, i + 50))} on conflict (${tx(key)}) do nothing`; };
      await ins("brands", catalog.tables.brands, "id");
      // Products take this catalog's values (category, panel…), so a later catalog import still matches them.
      await ins("rackets", catalog.tables.rackets, "id");
      await ins("reviews", expected.reviews, "id");
      await ins("external_reviews", expected.external, "id");
      await ins("racket_slug_redirects", expected.redirects, "slug");
      for (const v of expected.votes) await tx`insert into ${tx(dst)}.review_votes ${tx(v)} on conflict do nothing`;
    });
    const { here, problems } = await verifyHere();
    if (problems.length) throw new Error(`Copied, but these differ in "${dst}": ${problems.slice(0, 10).join("; ")}`);
    console.log(`Copied and verified. ${niche.site.name} now has`, counts(here), `(moved rows; all products: ${(await sql`select count(*)::int as n from ${sql(dst)}.rackets`)[0].n})`);
  } else {
    const ids = moving.rackets.map(r => r.id as string);
    await sql.begin(async tx => {
      for (const v of moving.votes) await tx`delete from ${tx(src)}.review_votes where review_type = ${v.review_type as string} and review_id = ${v.review_id as string} and voter = ${v.voter as string}`;
      if (ids.length) {
        await tx`delete from ${tx(src)}.external_reviews where racket_id in ${tx(ids)}`;
        await tx`delete from ${tx(src)}.reviews where racket_id in ${tx(ids)}`;
        await tx`delete from ${tx(src)}.racket_slug_redirects where racket_id in ${tx(ids)}`;
        await tx`delete from ${tx(src)}.rackets where id in ${tx(ids)}`;
      }
      const brandIds = [...new Set(moving.rackets.map(r => r.brand_id as string))];
      if (brandIds.length) await tx`delete from ${tx(src)}.brands b where b.id in ${tx(brandIds)} and not exists (select 1 from ${tx(src)}.rackets r where r.brand_id = b.id)`;
    });
    const left = await load(src);
    console.log(`Removed from ${from.site.name}. ${shape} rows left there:`, counts(left), `; products left: ${(await sql`select count(*)::int as n from ${sql(src)}.rackets`)[0].n}, brands left: ${(await sql`select count(*)::int as n from ${sql(src)}.brands`)[0].n}`);
  }
} finally { await sql.end(); }
