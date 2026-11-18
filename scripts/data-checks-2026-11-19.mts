// Fixes from the site-voice data checks (2026-11-19; grok/site-voices/results/DATA-CHECKS-FINDINGS.md, item 3d):
// DiscGolfRecs lists the Discmania Premier Q-Line DD3 twice, as `discmania-dd3` (which already carries Q-Line and 14
// Q-Line/Premier reviews) and as `discmania-premier-dd3`. This merges the second into the first, keeping every review:
//   - web reviews move to the DD3; those with no plastic get variant "Q-Line" (every Premier DD3 is Q-Line);
//   - a web review whose source URL the DD3 already has (8 YouTube videos stored on both) is dropped with its evidence;
//     the DD3 copy takes its plastic when it has none;
//   - own reviews, votes (one per voter) and reader evidence move; the Premier's own maker-spec evidence is dropped,
//     since the DD3 keeps its own;
//   - old redirects follow, /discmania-premier-dd3 redirects to /discmania-dd3, then the Premier row and photo go.
// Dry run by default. --write needs the owner's OK typed in the session; it first saves a backup of every row it touches
// to --backup <dir>, then applies everything in one transaction.
//   NICHE=discgolf npx tsx --conditions=react-server --env-file=.env.local scripts/data-checks-2026-11-19.mts [--write --backup <dir>]
// The Profitec Drive summary (item 2) goes through db/summaries/coffee.json and `npm run db:set-summaries`.
import { writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

const MERGES = [{ from: "discmania-premier-dd3", into: "discmania-dd3", variant: "Q-Line", why: "the Premier DD3 is the Q-Line DD3, already a plastic of the DD3" }];
if (niche.id !== "discgolf") throw new Error("NICHE=discgolf");
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");

const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };
type R = { id: string; slug: string; name: string };
type Web = { id: string; racket_id: string; source_url: string; variant: string | null };
const all = await rows<R>(sql`select id, slug, name from ${S}.rackets`);
const bySlug = new Map(all.map(r => [r.slug, r]));
const problems: string[] = [], out: string[] = [];
const plans: { a: R; b: R; variant: string; moveVariantNull: string[]; dupes: { drop: Web; keep: Web }[]; votes: number; ownReviews: number; readerEvidence: number; dupeEvidence: number; makerEvidence: number; redirects: number }[] = [];
out.push(`# ${niche.id} data-check fixes: ${write ? "WRITE" : "dry run"} (${new Date().toISOString().slice(0, 16)}Z)`, "");
for (const m of MERGES) {
  const a = bySlug.get(m.from), b = bySlug.get(m.into);
  if (!a || !b) { problems.push(`not found: ${!a ? m.from : m.into}`); continue; }
  const webA = await rows<Web>(sql`select id, racket_id, source_url, variant from ${S}.external_reviews where racket_id = ${a.id}`);
  const webB = await rows<Web>(sql`select id, racket_id, source_url, variant from ${S}.external_reviews where racket_id = ${b.id}`);
  const urlB = new Map(webB.map(w => [w.source_url, w]));
  const dupes = webA.filter(w => urlB.has(w.source_url)).map(w => ({ drop: w, keep: urlB.get(w.source_url)! }));
  const dropIds = new Set(dupes.map(d => d.drop.id));
  const moveVariantNull = webA.filter(w => !dropIds.has(w.id) && !w.variant).map(w => w.id);
  const ev = await rows<{ source_kind: string; source_ref: string }>(sql`select source_kind, source_ref from ${S}.evidence where product_id = ${a.id}`);
  const dupeRef = (ref: string) => [...dropIds].some(id => ref === `w:${id}` || ref.startsWith(`w:${id}#`));
  const makerEvidence = ev.filter(e => e.source_kind === "maker").length, dupeEvidence = ev.filter(e => e.source_kind !== "maker" && dupeRef(e.source_ref)).length;
  const n = async (t: string) => Number((await rows<{ n: number }>(sql`select count(*)::int as n from ${S}.${sql.identifier(t)} where racket_id = ${a.id}`))[0].n);
  const p = { a, b, variant: m.variant, moveVariantNull, dupes, votes: await n("product_votes"), ownReviews: await n("reviews"), readerEvidence: ev.length - makerEvidence - dupeEvidence, dupeEvidence, makerEvidence, redirects: await n("racket_slug_redirects") };
  plans.push(p);
  out.push(`## Merge ${a.name} (\`${a.slug}\`) into ${b.name} (\`${b.slug}\`)`, `Why: ${m.why}`, "",
    `- Web reviews: ${webA.length} on the Premier. ${webA.length - dupes.length} move to the DD3 (${moveVariantNull.length} of them get variant "${m.variant}").`,
    `- Dropped as duplicates (the DD3 already has the same source): ${dupes.length}`,
    ...dupes.map(d => `  - ${d.drop.source_url} (Premier ${d.drop.id}, variant ${d.drop.variant ?? "none"}; DD3 copy ${d.keep.id}, variant ${d.keep.variant ?? "none"}${!d.keep.variant && d.drop.variant ? ` → ${d.drop.variant}` : ""})`),
    `- Own reviews moved: ${p.ownReviews}; votes moved: ${p.votes}`,
    `- Evidence: ${p.readerEvidence} reader rows move; ${dupeEvidence} rows of the dropped duplicates and ${makerEvidence} Premier maker-spec rows are deleted`,
    `- Redirects: ${p.redirects} old ones repointed; /${a.slug} → /${b.slug} added`,
    `- Then: the Premier row and its photo are deleted. ${webB.length + webA.length - dupes.length} web reviews on the DD3 afterwards.`, "");
}
if (problems.length) out.push("## Problems (nothing written while any remain)", ...problems.map(p => `- ${p}`));
console.log(out.join("\n"));
if (!write) { console.log("\nDry run: nothing written."); process.exit(0); }
if (problems.length) throw new Error("Problems listed above; nothing written.");

mkdirSync(backupDir, { recursive: true });
const ids = plans.flatMap(p => [p.a.id, p.b.id]);
const dump = async (table: string, col: string) => rows(sql`select * from ${S}.${sql.identifier(table)} where ${sql.identifier(col)} in (${sql.join(ids.map(i => sql`${i}`), sql`, `)})`);
const backup = { at: new Date().toISOString(), schema: niche.schema, rackets: await dump("rackets", "id"), reviews: await dump("reviews", "racket_id"), external_reviews: await dump("external_reviews", "racket_id"),
  product_votes: await dump("product_votes", "racket_id"), evidence: await dump("evidence", "product_id"), product_photos: await dump("product_photos", "racket_id"), racket_slug_redirects: await dump("racket_slug_redirects", "racket_id") };
const file = `${backupDir}/${niche.id}-data-checks-${backup.at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup));
console.log(`Backup: ${file} (${backup.rackets.length} products, ${backup.external_reviews.length} web reviews, ${backup.evidence.length} evidence rows)`);

const now = new Date().toISOString();
await db.transaction(async tx => {
  const x = (q: ReturnType<typeof sql>) => tx.execute(q);
  for (const { a, b, variant, moveVariantNull, dupes } of plans) {
    for (const { drop, keep } of dupes) {
      if (!keep.variant && drop.variant) await x(sql`update ${S}.external_reviews set variant = ${drop.variant} where id = ${keep.id}`);
      await x(sql`delete from ${S}.evidence where product_id = ${a.id} and (source_ref = ${`w:${drop.id}`} or source_ref like ${`w:${drop.id}#%`})`);
      await x(sql`delete from ${S}.external_reviews where id = ${drop.id}`);
    }
    for (const id of moveVariantNull) await x(sql`update ${S}.external_reviews set variant = ${variant} where id = ${id}`);
    await x(sql`update ${S}.external_reviews set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`update ${S}.reviews set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.product_votes where racket_id = ${a.id} and voter in (select voter from ${S}.product_votes where racket_id = ${b.id})`);
    await x(sql`update ${S}.product_votes set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.evidence where product_id = ${a.id} and source_kind = 'maker'`);
    // A reader row that already exists on the DD3 (same source, attribute and reader) stays there once.
    await x(sql`delete from ${S}.evidence e where e.product_id = ${a.id} and exists (select 1 from ${S}.evidence k where k.product_id = ${b.id} and k.source_kind = e.source_kind and k.source_ref = e.source_ref and k.attribute = e.attribute and k.extracted_by = e.extracted_by)`);
    await x(sql`update ${S}.evidence set product_id = ${b.id} where product_id = ${a.id}`);
    await x(sql`update ${S}.racket_slug_redirects set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.product_photos where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.rackets where id = ${a.id}`);
    await x(sql`insert into ${S}.racket_slug_redirects (slug, racket_id, created_at) values (${a.slug}, ${b.id}, ${now}) on conflict (slug) do update set racket_id = excluded.racket_id`);
  }
});
console.log("Written.");
process.exit(0);
