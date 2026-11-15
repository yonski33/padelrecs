// Checks quick-take blocks against the live reports and, with --write, saves them to rackets.quick_take. Dry run by default.
//   NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/save-quicktake.mts <file-or-dir>… [--write]
// Each file is one block named <slug>.json (a directory: every .json in it). A block that fails any check is never saved.
// --clear <slug> removes a product's block (its page goes back to the normal product page). See scripts/QUICK-TAKE.md.
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { checkQuickTake } from "../lib/quick-take-check";
import { quickTakeReports } from "./quicktake-reports";

const args = process.argv.slice(2), write = args.includes("--write");
const clearAt = args.indexOf("--clear"), clear = clearAt >= 0 ? args[clearAt + 1] : null;
const inputs = args.filter((a, i) => !a.startsWith("--") && !(clearAt >= 0 && i === clearAt + 1));
const schema = assertSchemaName(niche.schema);
const { client } = connect();
try {
  if (clear) {
    const done = await client.unsafe(`update "${schema}".rackets set quick_take = null where slug = $1 returning slug`, [clear]);
    console.log(done.length ? `Cleared ${clear}.` : `Unknown slug ${clear}.`);
    process.exit(0);
  }
  if (!inputs.length) { console.error("Usage: save-quicktake.mts <file-or-dir>… [--write] | --clear <slug>"); process.exit(1); }
  const files: string[] = [];
  for (const p of inputs) {
    if ((await stat(p)).isDirectory()) files.push(...(await readdir(p)).filter(f => f.endsWith(".json")).sort().map(f => join(p, f)));
    else files.push(p);
  }
  const slugs = new Set((await client.unsafe(`select r.slug from "${schema}".rackets r`) as unknown as { slug: string }[]).map(r => r.slug));
  let failed = 0, saved = 0;
  for (const file of files) {
    const slug = basename(file, ".json");
    const [racket] = await client.unsafe(`select id from "${schema}".rackets where slug = $1`, [slug]) as unknown as { id: string }[];
    if (!racket) { console.log(`✗ ${slug}: no product with this slug`); failed++; continue; }
    let block: unknown;
    try { block = JSON.parse(await readFile(file, "utf8")); } catch (e) { console.log(`✗ ${slug}: not JSON (${e})`); failed++; continue; }
    const reports = await quickTakeReports(client, schema, racket.id);
    const res = checkQuickTake(block, reports, { knownSlugs: slugs, selfSlug: slug });
    console.log(`${res.ok ? "✓" : "✗"} ${slug}: ${reports.length} reports, ${res.errors.length} errors, ${res.warnings.length} warnings`);
    for (const e of res.errors) console.log(`    error   ${e}`);
    for (const w of res.warnings) console.log(`    warning ${w}`);
    if (!res.ok) { failed++; continue; }
    if (write) {
      await client.unsafe(`update "${schema}".rackets set quick_take = $2::jsonb where id = $1`, [racket.id, JSON.stringify(res.block)]);
      saved++;
    }
  }
  console.log(write ? `Saved ${saved}, failed ${failed}.` : `Dry run: ${files.length - failed} pass, ${failed} fail. Add --write to save the passing blocks.`);
  if (failed) process.exitCode = 1;
} finally { await client.end(); }
