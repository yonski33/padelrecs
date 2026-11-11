// One-off for the 2026-11 redesign (owner request, 2026-11-12), run once after the redesign is deployed:
//  1. Web reviews filed under "Other" (blogs and websites) become "Blog", the label the sites now use.
//  2. With --normalize-ratings, user reviews' 1–5 ratings become the three verdicts' stored values: 1–2 → 1 (negative),
//     3 stays 3 (mixed), 4–5 → 5 (positive). The sites already read 1–5 that way (lib/verdict.ts), so this changes nothing
//     on the pages; it only drops the old star detail from the data.
// Every niche schema in the database, live and pending reviews alike. Dry run unless --apply.
//   npx tsx --env-file=.env.local scripts/verdicts-and-blogs.ts [--normalize-ratings] [--apply]
import postgres from "postgres";
import { assertDatabaseTarget } from "../lib/deployment-target";

const apply = process.argv.includes("--apply"), normalize = process.argv.includes("--normalize-ratings");
const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Set MIGRATION_DATABASE_URL or DATABASE_URL in .env.local");
assertDatabaseTarget(url, process.env.SUPABASE_PROJECT_REF);
const sql = postgres(url, { prepare: false, max: 1 });
try {
  const schemas = (await sql`select schema_name from information_schema.schemata where schema_name ~ '^[a-z]+recs$' order by 1`).map(r => r.schema_name as string);
  let blogs = 0, ratings = 0;
  for (const s of schemas) {
    const [{ n: other }] = await sql.unsafe(`select count(*)::int n from "${s}".external_reviews where source_platform = 'Other'`);
    const [{ n: off }] = normalize ? await sql.unsafe(`select count(*)::int n from "${s}".reviews where rating in (2, 4)`) : [{ n: 0 }];
    blogs += other; ratings += off;
    if (!other && !off) continue;
    console.log(`${s}: ${other} "Other" → "Blog"${normalize ? `, ${off} ratings of 2 or 4 → 1 or 5` : ""}`);
    if (!apply) continue;
    await sql.begin(async tx => {
      await tx.unsafe(`update "${s}".external_reviews set source_platform = 'Blog' where source_platform = 'Other'`);
      if (normalize) await tx.unsafe(`update "${s}".reviews set rating = case when rating <= 2 then 1 when rating = 3 then 3 else 5 end where rating in (2, 4)`);
    });
  }
  console.log(`${apply ? "Updated" : "Would update"}: ${blogs} web reviews to "Blog"${normalize ? `, ${ratings} user ratings` : ""}.${apply ? "" : " Dry run; add --apply to write."}`);
} finally { await sql.end(); }
