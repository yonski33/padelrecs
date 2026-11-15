// Exports what a quick-take writer reads for one or more products: the product, its counts, every stored report (web
// reports and approved reviews posted here) and the catalog's slugs for rivals. Read-only.
//   NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/export-quicktake-input.mts <dir> <slug>…
//   … scripts/export-quicktake-input.mts <dir> --top 10      (the most-reported products with 20+ reports)
// Writes <dir>/<slug>.json. See scripts/QUICK-TAKE.md.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { displayName } from "../lib/brand-name";
import { gateFor } from "../lib/quick-take";
import { quickTakeReports } from "./quicktake-reports";

const [dir, ...rest] = process.argv.slice(2);
if (!dir || !rest.length) { console.error("Usage: export-quicktake-input.mts <dir> <slug>… | --top N"); process.exit(1); }
const schema = assertSchemaName(niche.schema);
const { client } = connect();
try {
  const rackets = await client.unsafe(`select r.id, r.slug, r.name, r.year, r.shape, r.weight, r.balance, r.core, r.surface, b.name as brand,
      (select count(*) from "${schema}".external_reviews e where e.racket_id = r.id)::int
      + (select count(*) from "${schema}".reviews v where v.racket_id = r.id and v.status = 'approved')::int as reports
    from "${schema}".rackets r join "${schema}".brands b on b.id = r.brand_id order by reports desc, r.slug`) as unknown as
    { id: string; slug: string; name: string; year: number; shape: string | null; weight: string | null; balance: string | null; core: string | null; surface: string | null; brand: string; reports: number }[];
  const slugs = rest[0] === "--top" ? rackets.filter(r => r.reports >= 20).slice(0, Number(rest[1]) || 10).map(r => r.slug) : rest;
  const catalog = rackets.filter(r => r.reports > 0).map(r => ({ slug: r.slug, name: displayName(r.name, r.brand), reports: r.reports }));
  await mkdir(dir, { recursive: true });
  for (const slug of slugs) {
    const r = rackets.find(x => x.slug === slug);
    if (!r) { console.error(`Unknown slug: ${slug}`); continue; }
    const reports = await quickTakeReports(client, schema, r.id);
    const count = (k: string) => reports.filter(x => x.sentiment === k).length;
    const dates = reports.map(x => x.date).filter(Boolean).sort() as string[];
    const out = {
      product: { id: r.id, slug: r.slug, name: displayName(r.name, r.brand), year: r.year, shape: r.shape, specs: { weight: r.weight, balance: r.balance, core: r.core, surface: r.surface } },
      gate: gateFor(reports.length),
      counts: { reports: reports.length, positive: count("positive"), mixed: count("mixed"), negative: count("negative") },
      dates: { from: dates[0]?.slice(0, 7) ?? null, to: dates[dates.length - 1]?.slice(0, 7) ?? null },
      reports,
      catalog: catalog.filter(c => c.slug !== slug),
    };
    await writeFile(join(dir, `${slug}.json`), JSON.stringify(out, null, 1));
    console.log(`${slug}: ${reports.length} reports (${out.gate ?? "below the gate"}) → ${join(dir, `${slug}.json`)}`);
  }
} finally { await client.end(); }
