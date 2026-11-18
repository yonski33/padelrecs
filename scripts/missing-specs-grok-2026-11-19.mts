// Grok's missing-specs job (2026-11-19; grok/missing-specs/results/missing-specs-filled.csv): the specs it found that are the
// maker's own figure or a lab measurement go into the catalog's spec columns, plus three flags it raised. The other 16 rows
// (shop-listing or reviewer guesses: the Thrustmaster torque wheels, Blade 98S V10, Graf Pro / Pro V, Perseus CFS, Scorpeus
// Heat Vision, Encore Pro) stay empty. The spec columns are plain text with no source field, so values are stored plain, in
// the catalog's existing format; the source and whether it is official or measured stay in this file.
//   - Columns are shared: pickleball swing weight = balance, tennis stiffness = surface, simracing torque = weight.
//   - A value already in the DB is replaced (old → new shown); a flag only writes when the DB still has the value Grok flagged.
//   - --merge-xf also merges prokennex-black-ace-xf into prokennex-black-ace-xf-14 (reviews, web reviews, votes and
//     evidence move, /prokennex-black-ace-xf redirects), as in scripts/data-checks-2026-11-19.mts. Without it the XF stays
//     as it is and gets no swing weight: Grok's 101 is the XF 14's figure, and the catalog has the XF as the original
//     thin-core paddle (db/expert-play, db/approval: pulled from the USA Pickleball list in July 2025).
// Dry run by default. --write needs the owner's OK typed in the session; it first saves a backup of every row it touches to
// --backup <dir>, then applies everything in one transaction. Run once per niche (padel, pickleball, tennis, simracing):
//   NICHE=pickleball npx tsx --conditions=react-server --env-file=.env.local scripts/missing-specs-grok-2026-11-19.mts [--merge-xf] [--write --backup <dir>]
import { writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

type Col = "shape" | "weight" | "balance" | "core" | "surface";
// `when`: a flag, written only while the DB value matches it.
type Fix = { slug: string; col: Col; label: string; value: string; kind: "official" | "measured" | "flag"; source: string; when?: RegExp };
const PE = "https://pickleballeffect.com/pickleball-paddle-database/";
const SETS: Record<string, Fix[]> = {
  padel: [
    { slug: "head-evo-speed-2025", col: "weight", label: "weight", value: "350 g", kind: "official", source: "https://www.head.com/product/evo-speed-2025-226405 (one weight, no range; 340–360 g is retailers')" },
    { slug: "head-evo-speed-2025", col: "balance", label: "balance", value: "High (270 mm)", kind: "flag", when: /^\s*(low|medium|mid)/i, source: "https://www.head.com/product/evo-speed-2025-226405 (Head: high balance, 270 mm)" },
    { slug: "oxdog-hyper-tour-2-0-2025", col: "core", label: "core", value: "EVA Medium", kind: "official", source: "https://www.oxdogpadel.uk/rackets/p/hypertour-26 (Oxdog UK: \"Foam: Medium\")" },
  ],
  pickleball: [
    { slug: "vatic-pro-v-sol-pro", col: "balance", label: "swing weight", value: "108", kind: "measured", source: `${PE} (V-Sol Pro Flash)` },
    { slug: "engage-pursuit-pro1-elongated-15-2", col: "balance", label: "swing weight", value: "115", kind: "measured", source: `${PE} (Pursuit Pro1 6.0)` },
    { slug: "selkirk-slk-halo-power-max", col: "balance", label: "swing weight", value: "103", kind: "measured", source: `${PE} (Halo Power Max 2024, 13 mm)` },
    { slug: "selkirk-slk-halo-power-max", col: "core", label: "core thickness", value: "13 mm", kind: "flag", when: /^\s*16\s*mm\s*$/i, source: "Selkirk's current page: 13 mm core" },
    { slug: "prokennex-black-ace-xf", col: "balance", label: "swing weight", value: "101", kind: "measured", source: `${PE} (Black Ace XF 14)` },
    { slug: "diadem-warrior-blucore", col: "balance", label: "swing weight", value: "109.6", kind: "measured", source: "https://www.johnkewpickleball.com/paddle-database (Warrior BluCore Pro 14 mm)" },
    { slug: "diadem-edge-18k-max", col: "balance", label: "swing weight", value: "110", kind: "measured", source: "https://picklefitter.com/paddle/diadem-edge-18k-max (Pickleball Studio, 16 mm)" },
    { slug: "prokennex-black-ace-lg", col: "balance", label: "swing weight", value: "107", kind: "measured", source: "https://picklefitter.com/paddle/prokennex-black-ace-lg-daniel-de-la-rosa (Pickleball Studio)" },
    { slug: "prokennex-black-ace-ovation", col: "balance", label: "swing weight", value: "101", kind: "measured", source: "https://picklefitter.com/paddle/prokennex-black-ace-pro-ovation (Pickleball Studio, 10 mm)" },
  ],
  tennis: [
    { slug: "wilson-clash-108-v1", col: "surface", label: "stiffness", value: "56 RA", kind: "measured", source: "https://www.racquetfinder.com/ (Tennis Warehouse, Clash 108 2019, strung)" },
  ],
  simracing: [
    // No motor, so no torque; never 0 Nm. No digits before "Nm", so the torque parsers read it as no figure.
    { slug: "thrustmaster-t80-ferrari-488-gtb-edition", col: "weight", label: "torque", value: "None (no force feedback)", kind: "official", source: "https://www.thrustmaster.com/en-us/products/t80-ferrari-488-gtb-edition/ (bungee-cord centring)" },
  ],
};
const XF = { from: "prokennex-black-ace-xf", into: "prokennex-black-ace-xf-14" };

const sets = SETS[niche.id];
if (!sets) throw new Error(`NICHE=${Object.keys(SETS).join(" | ")}`);
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
const mergeXf = args.includes("--merge-xf");
if (mergeXf && niche.id !== "pickleball") throw new Error("--merge-xf is for NICHE=pickleball");
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");

const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };
type R = { id: string; slug: string; name: string; shape: string | null; weight: string | null; balance: string | null; core: string | null; surface: string | null; trait_override: unknown };
const all = await rows<R>(sql`select id, slug, name, shape, weight, balance, core, surface, trait_override from ${S}.rackets`);
const bySlug = new Map(all.map(r => [r.slug, r]));
const problems: string[] = [], out: string[] = [], touched = new Set<string>();
const writes: { r: R; s: Fix }[] = [];

out.push(`# ${niche.id} missing specs: ${write ? "WRITE" : "dry run"}${mergeXf ? " with --merge-xf" : ""} (${new Date().toISOString().slice(0, 16)}Z)`, "",
  "| Product | Spec | Old → new | Kind | Source |", "|---|---|---|---|---|");
for (const s of sets) {
  const r = bySlug.get(s.slug);
  if (!r) { problems.push(`not found: ${s.slug}`); continue; }
  const old = r[s.col];
  const row = (change: string) => out.push(`| ${r.name} (\`${r.slug}\`) | ${s.label} (\`${s.col}\`) | ${change} | ${s.kind} | ${s.source} |`);
  if (s.slug === XF.from) { row(`"${old ?? "—"}", left as it is: ${mergeXf ? "merged into the XF 14, which has 101 already" : "101 is the XF 14's figure; no --merge-xf"}`); continue; }
  if (old === s.value) { row(`already "${old}"`); continue; }
  if (s.when && !s.when.test(old ?? "")) { row(`"${old ?? "—"}": not the flagged value, left as it is`); continue; }
  row(`"${old ?? "—"}" → "${s.value}"`);
  writes.push({ r, s }); touched.add(r.id);
}

type Web = { id: string; source_url: string };
let merge: { a: R; b: R; dupes: { drop: Web; keep: Web }[]; fill: Partial<Record<Col, string>> } | null = null;
if (niche.id === "pickleball") {
  const a = bySlug.get(XF.from), b = bySlug.get(XF.into);
  if (!a || !b) problems.push(`not found: ${!a ? XF.from : XF.into}`);
  else {
    const webA = await rows<Web>(sql`select id, source_url from ${S}.external_reviews where racket_id = ${a.id}`);
    const webB = await rows<Web>(sql`select id, source_url from ${S}.external_reviews where racket_id = ${b.id}`);
    const urlB = new Map(webB.map(w => [w.source_url, w]));
    const dupes = webA.filter(w => urlB.has(w.source_url)).map(w => ({ drop: w, keep: urlB.get(w.source_url)! }));
    const n = async (t: string, c = "racket_id") => Number((await rows<{ n: number }>(sql`select count(*)::int as n from ${S}.${sql.identifier(t)} where ${sql.identifier(c)} = ${a.id}`))[0].n);
    const fill: Partial<Record<Col, string>> = {};
    for (const k of ["shape", "weight", "balance", "core", "surface"] as const) if (!b[k] && a[k]) fill[k] = a[k]!;
    const specs = (r: R) => `shape ${r.shape ?? "—"}; weight ${r.weight ?? "—"}; core ${r.core ?? "—"}; swing weight ${r.balance ?? "—"}; surface ${r.surface ?? "—"}`;
    out.push("", `## Proposed merge: ${a.name} (\`${a.slug}\`) into ${b.name} (\`${b.slug}\`) — ${mergeXf ? "ON (--merge-xf)" : "OFF (pass --merge-xf to include it)"}`, "",
      `- ${a.slug}: ${specs(a)}`, `- ${b.slug}: ${specs(b)}`,
      `- Moves: ${await n("reviews")} own reviews, ${webA.length - dupes.length} web reviews, ${await n("product_votes")} votes (a voter on both keeps the XF 14 vote), ${await n("evidence", "product_id")} evidence rows (ones the XF 14 already has are dropped)`,
      `- Web reviews dropped as duplicates (the XF 14 has the same source): ${dupes.length}`, ...dupes.map(d => `  - ${d.drop.source_url}`),
      `- Specs filled on the XF 14 from the XF: ${Object.keys(fill).join(", ") || "none"}; How it plays override moves: ${a.trait_override && !b.trait_override ? "yes" : "no"}`,
      `- Redirects: ${await n("racket_slug_redirects")} old ones repointed; /${a.slug} → /${b.slug} added. Then the XF row and its photo are deleted.`,
      `- Not done by this script: the XF's keys in db/expert-play/pickleball.json and db/approval/pickleball.json ("pulled July 2025") would need removing in the PR.`,
      `- Against merging: the catalog has the XF as the original thin-core (10–11 mm) paddle, approved by USA Pickleball and pulled in July 2025; the XF 14 is not on that list.`);
    if (mergeXf) { merge = { a, b, dupes, fill }; touched.add(a.id); touched.add(b.id); }
  }
}
if (problems.length) out.push("", "## Problems (nothing written while any remain)", ...problems.map(p => `- ${p}`));
console.log(out.join("\n"));
console.log(`\n${writes.length} spec changes${merge ? " and 1 merge" : ""}.`);
if (!write) { console.log("Dry run: nothing written."); process.exit(0); }
if (problems.length) throw new Error("Problems listed above; nothing written.");
if (!touched.size) { console.log("Nothing to write."); process.exit(0); }

mkdirSync(backupDir, { recursive: true });
const ids = [...touched];
const dump = async (table: string, col: string) => rows(sql`select * from ${S}.${sql.identifier(table)} where ${sql.identifier(col)} in (${sql.join(ids.map(i => sql`${i}`), sql`, `)})`);
const backup = { at: new Date().toISOString(), schema: niche.schema, rackets: await dump("rackets", "id"),
  ...(merge ? { reviews: await dump("reviews", "racket_id"), external_reviews: await dump("external_reviews", "racket_id"), product_votes: await dump("product_votes", "racket_id"),
    evidence: await dump("evidence", "product_id"), product_photos: await dump("product_photos", "racket_id"), racket_slug_redirects: await dump("racket_slug_redirects", "racket_id") } : {}) };
const file = `${backupDir}/${niche.id}-missing-specs-${backup.at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup));
console.log(`Backup: ${file} (${backup.rackets.length} products)`);

const now = new Date().toISOString();
await db.transaction(async tx => {
  const x = (q: ReturnType<typeof sql>) => tx.execute(q);
  for (const { r, s } of writes) await x(sql`update ${S}.rackets set ${sql.identifier(s.col)} = ${s.value} where id = ${r.id}`);
  if (merge) {
    const { a, b, dupes, fill } = merge;
    for (const { drop } of dupes) {
      await x(sql`delete from ${S}.evidence where product_id = ${a.id} and (source_ref = ${`w:${drop.id}`} or source_ref like ${`w:${drop.id}#%`})`);
      await x(sql`delete from ${S}.external_reviews where id = ${drop.id}`);
    }
    await x(sql`update ${S}.external_reviews set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`update ${S}.reviews set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.product_votes where racket_id = ${a.id} and voter in (select voter from ${S}.product_votes where racket_id = ${b.id})`);
    await x(sql`update ${S}.product_votes set racket_id = ${b.id} where racket_id = ${a.id}`);
    // Rows the XF 14 already has (same source and attribute, e.g. the spec rows) stay its own; the XF's copies go.
    await x(sql`delete from ${S}.evidence e where e.product_id = ${a.id} and exists (select 1 from ${S}.evidence k where k.product_id = ${b.id}
      and k.source_kind = e.source_kind and k.source_ref = e.source_ref and k.attribute = e.attribute and k.extracted_by is not distinct from e.extracted_by)`);
    await x(sql`update ${S}.evidence set product_id = ${b.id} where product_id = ${a.id}`);
    for (const [k, v] of Object.entries(fill)) await x(sql`update ${S}.rackets set ${sql.identifier(k)} = ${v} where id = ${b.id}`);
    if (a.trait_override && !b.trait_override) await x(sql`update ${S}.rackets set trait_override = ${JSON.stringify(a.trait_override)}::jsonb where id = ${b.id}`);
    await x(sql`update ${S}.racket_slug_redirects set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.product_photos where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.rackets where id = ${a.id}`);
    await x(sql`insert into ${S}.racket_slug_redirects (slug, racket_id, created_at) values (${a.slug}, ${b.id}, ${now}) on conflict (slug) do update set racket_id = excluded.racket_id`);
  }
});
console.log("Written.");
process.exit(0);
