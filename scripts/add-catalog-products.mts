// Insert-only catalog adds (PickleballRecs popular paddles, owner OK 2026-11-23): brands and products from an adds file
// shaped like db/catalogs/<niche>.json. Never updates or deletes: a brand or product already in the DB is listed and skipped.
// Dry run by default; --apply writes in one transaction. Back up first (scripts/creator-reviews.mts backup <dir>).
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/add-catalog-products.mts db/catalogs/adds/pickleball-2026-11-23.json [--apply]
//   NICHE=laptop npx tsx --env-file=.env.local scripts/add-catalog-products.mts db/catalogs/adds/laptop-2026-11-24.json [--apply]
// LaptopRecs rows use the catalogue's laptop columns as db/catalogs/laptop.json does (balance = CPU, core = GPU, surface =
// screen), and its product ids are the bare slug, as its catalogue import made them (apple-macbook-neo).
import { readFile } from "node:fs/promises";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { slugify } from "../lib/slug";

type Product = { brand: string; name: string; year: number; shape: string | null; weight: string | null; core: string | null;
  surface: string | null; swingWeight: string | null; balance?: string | null; slug?: string; sources: string[] };
/** Sites whose product ids are the slug with no year (LaptopRecs). */
const SLUG_IDS = new Set(["laptop"]);
const file = process.argv[2], apply = process.argv.includes("--apply");
if (!file) throw new Error("Usage: add-catalog-products.mts <adds.json> [--apply]");
const adds = JSON.parse(await readFile(file, "utf8")) as { brands: { id: string; name: string }[]; products: Product[] };
const S = niche.schema;
const { client } = connect();
try {
  const brandsNow = new Map((await client.unsafe(`select id, slug from "${S}".brands`)).map(b => [b.id as string, b.slug as string]));
  const now = await client.unsafe(`select id, slug from "${S}".rackets`);
  const ids = new Set(now.map(r => r.id as string)), slugs = new Set(now.map(r => r.slug as string));
  const redirects = new Set((await client.unsafe(`select slug from "${S}".racket_slug_redirects`)).map(r => r.slug as string));
  const created = new Date().toISOString();
  const newBrands = adds.brands.filter(b => !brandsNow.has(b.id)).map(b => ({ id: b.id, name: b.name, slug: slugify(b.name) }));
  const problems: string[] = [], rows: Record<string, unknown>[] = [], skipped: string[] = [], seen = new Set<string>();
  for (const p of adds.products) {
    const slug = p.slug ?? slugify(p.name), id = SLUG_IDS.has(niche.id) ? slug : `${slug}-${p.year}`;
    if (!brandsNow.has(p.brand) && !newBrands.some(b => b.id === p.brand)) problems.push(`${p.name}: brand ${p.brand} not in DB or file`);
    if (ids.has(id) || slugs.has(slug)) { skipped.push(`${slug} (already in the DB)`); continue; }
    if (redirects.has(slug)) problems.push(`${slug}: an old URL of another product redirects here`);
    if (seen.has(slug)) problems.push(`${slug}: twice in the file`); seen.add(slug);
    for (const [k, v] of Object.entries(p)) if (typeof v === "string" && /[—–]\s|\bverdict\b/i.test(v) && k !== "weight" && k !== "swingWeight") problems.push(`${slug} ${k}: dash or banned word`);
    rows.push({ id, brand_id: p.brand, name: p.name, slug, year: p.year, image_url: null, shape: p.shape, weight: p.weight,
      balance: p.balance ?? p.swingWeight, surface: p.surface, core: p.core, description: null, created_at: created });
  }
  console.log(`${apply ? "APPLY" : "DRY RUN"} on ${S}: ${rows.length} products to insert, ${newBrands.length} new brands, ${skipped.length} skipped`);
  for (const b of newBrands) console.log(`  + brand ${b.id} "${b.name}" (/${b.slug})`);
  for (const r of rows) console.log(`  + ${String(r.slug).padEnd(34)} ${String(r.name).padEnd(30)} ${r.year} | ${r.shape ?? "-"} | ${r.weight ?? "-"} | SW ${r.balance ?? "-"} | ${r.core ?? "-"} | ${r.surface ?? "-"}`);
  for (const s of skipped) console.log(`  = ${s}`);
  if (problems.length) { console.log("PROBLEMS:"); for (const p of problems) console.log("  -", p); throw new Error("Fix the file first."); }
  if (!apply) { console.log("Dry run only: nothing written."); process.exit(0); }
  await client.begin(async tx => {
    if (newBrands.length) await tx.unsafe(`insert into "${S}".brands (id, name, slug) select id, name, slug from json_populate_recordset(null::"${S}".brands, $1::json) on conflict do nothing`, [JSON.stringify(newBrands)]);
    const res = await tx.unsafe(`insert into "${S}".rackets (id, brand_id, name, slug, year, image_url, shape, weight, balance, surface, core, description, created_at)
      select id, brand_id, name, slug, year, image_url, shape, weight, balance, surface, core, description, created_at
      from json_populate_recordset(null::"${S}".rackets, $1::json) on conflict do nothing returning slug`, [JSON.stringify(rows)]);
    if (res.length !== rows.length) throw new Error(`Inserted ${res.length} of ${rows.length}: rolled back.`);
  });
  const [c] = await client.unsafe(`select (select count(*) from "${S}".rackets) rackets, (select count(*) from "${S}".brands) brands`);
  console.log("Written. In DB now:", c);
} finally { await client.end(); }
process.exit(0);
