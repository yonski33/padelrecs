// CoffeeRecs release years (2026-11-28): writes the checked years from db/specs/coffee.json (`released`) to coffeerecs.rackets.year.
// The year column can't be null, so products with no checked year keep the old placeholder there; the v3 pages read the
// specs file and show no year for them. Dry run by default (one transaction, rolled back); --apply needs the owner's OK.
//   npx tsx --env-file=.env.local scripts/coffee-years.mts [--apply] [--backup <dir>]
import postgres from "postgres";
import { writeFile } from "node:fs/promises";
import specs from "../db/specs/coffee.json";
const S = specs as Record<string, { released?: number }>;
const apply = process.argv.includes("--apply"), bi = process.argv.indexOf("--backup"), backup = bi > 0 ? process.argv[bi + 1] : null;
const sql = postgres((process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL)!, { prepare: false, max: 1 });
const before = await sql`select id, slug, year from coffeerecs.rackets order by slug`;
if (backup) await writeFile(`${backup}/rackets-years-before.json`, JSON.stringify(before, null, 1), { mode: 0o600 });
const want = before.flatMap(r => { const y = S[r.slug]?.released; return y && y !== r.year ? [{ id: r.id, slug: r.slug, from: r.year, to: y }] : []; });
console.log(`${before.length} products; ${want.length} year changes:`); for (const w of want) console.log(`  ${w.slug}: ${w.from} -> ${w.to}`);
class Rollback extends Error {}
try {
  await sql.begin(async t => {
    let n = 0; for (const w of want) n += (await t`update coffeerecs.rackets set year = ${w.to} where id = ${w.id} and year = ${w.from}`).count;
    const [c] = await t`select count(*)::int total, count(*) filter (where year = 2026)::int still_2026 from coffeerecs.rackets`;
    console.log(`updated ${n}; inside the transaction: ${c.total} products, ${c.still_2026} still 2026`);
    if (n !== want.length) throw new Error(`expected ${want.length} updates, got ${n}`);
    if (!apply) throw new Rollback();
  });
  console.log("APPLIED");
} catch (e) { if (!(e instanceof Rollback)) throw e; console.log("Dry run: rolled back, nothing written."); }
await sql.end();
