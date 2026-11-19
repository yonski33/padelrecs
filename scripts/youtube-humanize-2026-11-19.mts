// One-off (owner 2026-11-19): PadelRecs YouTube summaries humanized by Sonnet, each checked claim by claim against the old
// text by a second Sonnet pass (flags fixed or reviewed by hand). Data: db/fixes/padel-youtube-humanize-2026-11-19.json,
// one row per summary with the old text ("before", the backup) and the new one ("after").
// Dry run by default; --write applies every row in one transaction. A row changes only if its stored summary still equals
// "before" and nobody edited it in the admin since (admin_edited_at is null). Highlights are replaced by phrases of the new text.
//   npx tsx --env-file=.env.local scripts/youtube-humanize-2026-11-19.mts            dry run
//   npx tsx --env-file=.env.local scripts/youtube-humanize-2026-11-19.mts --write    apply
//   npx tsx --env-file=.env.local scripts/youtube-humanize-2026-11-19.mts --revert   put every "before" text back
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { assertDatabaseTarget } from "../lib/deployment-target";
import targets from "../deployment/targets.json" with { type: "json" };

type Row = { id: string; before: string; after: string; highlights_before: string[] | null; highlights_after: string[] };
const rows: Row[] = JSON.parse(readFileSync(new URL("../db/fixes/padel-youtube-humanize-2026-11-19.json", import.meta.url), "utf8"));
const write = process.argv.includes("--write"), revert = process.argv.includes("--revert");
const url = process.env.DATABASE_URL!; assertDatabaseTarget(url, process.env.SUPABASE_PROJECT_REF);
const schema = (targets.nicheSchemas as Record<string, string>).padel;
const sql = postgres(url, { prepare: false, max: 1 });

for (const r of rows) {
  if (/[—–;]/.test(r.after)) throw new Error(`${r.id}: dash or semicolon in new text`);
  if (!r.highlights_after.every(h => r.after.includes(h))) throw new Error(`${r.id}: highlight not in new text`);
}
const cur = await sql.unsafe(`select id, summary, admin_edited_at from ${schema}.external_reviews where source_platform = 'YouTube' and id = any($1)`,
  [rows.map(r => r.id)]) as unknown as { id: string; summary: string; admin_edited_at: string | null }[];
const now = new Map(cur.map(c => [c.id, c]));
const from = (r: Row) => revert ? r.after : r.before, to = (r: Row) => revert ? r.before : r.after;
const hl = (r: Row) => revert ? r.highlights_before : r.highlights_after;
const plan = rows.filter(r => { const c = now.get(r.id); return c && !c.admin_edited_at && c.summary === from(r) && from(r) !== to(r); });
const stale = rows.filter(r => { const c = now.get(r.id); return !c || c.admin_edited_at || c.summary !== from(r); });
const same = rows.length - plan.length - stale.length;
for (const r of stale) console.log(`STALE ${r.id}`);
if ((write || revert) && plan.length) {
  let n = 0;
  await sql.begin(async tx => {
    for (const r of plan) {
      const res = await tx.unsafe(`update ${schema}.external_reviews set summary = $1, highlights = $2 where id = $3 and summary = $4 and admin_edited_at is null`,
        [to(r), hl(r) as any, r.id, from(r)]);
      n += res.count;
    }
    if (n !== plan.length) throw new Error(`expected ${plan.length} updates, got ${n}: rolled back`);
  });
}
console.log({ mode: revert ? "REVERT" : write ? "WRITE" : "dry run", rows: rows.length, [write || revert ? "updated" : "wouldUpdate"]: plan.length, unchangedText: same, stale: stale.length });
await sql.end();
