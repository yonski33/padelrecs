// Read-only dry run (owner 2026-11-18): the Reddit cards each active v11c site's product pages show, as lib/reddit-cards.ts
// picks them from the stored per-comment summaries, and the lines that need a rewrite before they read as card summaries
// (backstory or "who said it" first, too long to keep whole). Writes one CSV of every shown card; changes nothing.
//   npx tsx --env-file=.env.local scripts/reddit-card-summaries.mts out.csv
import { writeFileSync } from "node:fs";
import postgres from "postgres";
import { assertDatabaseTarget } from "../lib/deployment-target";
import { redditPick, cardLine, BACKSTORY, type RedditRow } from "../lib/reddit-cards";
import targets from "../deployment/targets.json" with { type: "json" };

const SITES = ["padel", "pickleball", "discgolf", "simracing", "coffee", "tennis", "skin"];
const url = process.env.DATABASE_URL!; assertDatabaseTarget(url, process.env.SUPABASE_PROJECT_REF);
const sql = postgres(url, { prepare: false, max: 1 });
const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const lines = ["site,product,id,verdict,date,chars,flag,card_text,stored_summary,url"];
for (const site of SITES) {
  const schema = (targets.nicheSchemas as Record<string, string>)[site];
  const rows = await sql.unsafe(`select e.id, e.racket_id "racketId", e.source_platform "sourcePlatform", e.source_url "sourceUrl", e.source_name "sourceName",
    e.source_date "sourceDate", e.summary, e.sentiment, r.slug from ${schema}.external_reviews e join ${schema}.rackets r on r.id = e.racket_id
    where e.source_platform = 'Reddit'`) as unknown as (RedditRow & { slug: string })[];
  const byProduct = new Map<string, (RedditRow & { slug: string })[]>();
  for (const r of rows) byProduct.set(r.racketId, [...byProduct.get(r.racketId) ?? [], r]);
  let cards = 0, who = 0, products = 0, noLine = 0;
  for (const [id, rs] of byProduct) {
    const pick = redditPick(rs, id); if (pick.length) products++;
    for (const { row, text } of pick) {
      cards++; const flag = BACKSTORY.test(text) ? "backstory-first" : ""; if (flag) who++;
      lines.push([site, row.slug, row.id, row.sentiment ?? "", row.sourceDate ?? "", text.length, flag, q(text), q(row.summary ?? ""), row.sourceUrl].join(","));
    }
    noLine += rs.filter(r => !cardLine(r.summary)).length;
  }
  console.log(`${site}: ${rows.length} Reddit rows, ${noLine} without a usable card line; ${products} products show ${cards} cards, ${who} still open with backstory (no other line for that product)`);
}
await sql.end();
if (process.argv[2]) { writeFileSync(process.argv[2], lines.join("\n") + "\n"); console.log(`wrote ${lines.length - 1} cards to ${process.argv[2]}`); }
