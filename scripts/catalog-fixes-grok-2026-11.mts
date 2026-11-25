// PadelRecs / PickleballRecs catalog fixes from Grok's blind scoring (2026-11-18; owner: "all of his findings look correct").
// Names, years, specs and duplicate merges (padel: grok/padel-play-scores/results/CATALOG-FIXES-padel.md sections 2–6; the
// slug clashes in section 1 are a CSV artefact, SLUG-CLASH-REPORT.md. Pickleball: AFTER-RESET.md item 12).
// Dry run by default: prints every change. --write needs the owner's OK typed in the session; it first saves a backup of
// every row it touches (rackets, reviews, external reviews, votes, evidence, photos, redirects) to --backup <dir>, then
// applies all changes in one transaction.
//   - A rename keeps the slug unless the slug carries a wrong year (padel); a changed slug keeps the old one as a redirect.
//   - A merge moves reviews, web reviews, votes and evidence to the surviving product, fills its blank specs from the other,
//     points the dropped slug (and its old redirects) at the survivor, then deletes the dropped row.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/catalog-fixes-grok-2026-11.mts [--write --backup <dir>]
import { writeFileSync, mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";

type Spec = Partial<Record<"shape" | "weight" | "balance" | "core" | "surface", string>>;
type Fix = { slug: string; name?: string; year?: number; newSlug?: string; set?: Spec; why: string };
type Merge = { from: string; into: string; why: string };

const PADEL: { fixes: Fix[]; merges: Merge[] } = {
  fixes: [
    // Names (section 3)
    { slug: "nox-at10-genius-12k-alum-xtrem-lite-2026", name: "Nox AT10 Genius 12K Alum XTREM Lite 2026", why: "same casing as the 2027 Lite and the non-Lite" },
    { slug: "siux-fenix-pro-6-2026", name: "Siux Fenix Pro 2026", why: "the 2026 model is the Fenix Pro (no 6)" },
    { slug: "siux-electra-pro-st5-2026", name: "Siux Electra Pro 2026", why: "the 2026 model is the Electra Pro" },
    { slug: "siux-trilogy-pro-2026", name: "Siux Trilogy 6 Pro 2026", why: "maker's name" },
    { slug: "siux-beat-hybrid-3-2026", name: "Siux Beat Play Hybrid 3 2026", why: "maker's name" },
    { slug: "siux-beat-control-3-2026", name: "Siux Beat Play Control 3 2026", why: "maker's name" },
    { slug: "babolat-air-veron-2025", name: "Babolat Air Veron 2.5 2025", why: "the 2025 model is the Air Veron 2.5" },
    { slug: "babolat-technical-origin-2026", name: "Babolat Technical Origin+ 2026", set: { balance: "High" }, why: "maker's name (Origin+); it is head-heavy" },
    { slug: "adidas-metalbone-pro-edt-2025", name: "Adidas Metalbone Pro Edition 2025", why: "\"Pro EDT\" is Pro Edition" },
    { slug: "adidas-metalbone-pro-edt-2026", name: "Adidas Metalbone Pro Edition 2026", why: "\"Pro EDT\" is Pro Edition" },
    { slug: "adidas-cross-it-light-pro-edt-2026", name: "Adidas Cross It Light Pro Edition 2026", why: "\"Pro EDT\" is Pro Edition" },
    { slug: "adidas-arrow-hit-pro-edt-2026", name: "Adidas Arrow Hit Pro Edition 2026", why: "\"Pro EDT\" is Pro Edition" },
    // The 2026 Adidas "3.5" renames (Metalbone, Cross It) were wrong and are undone: owner wants the full model name
    // ("Adidas Metalbone 3.5"), 2026-11-25. scripts/restore-adidas-3-5-names.mts puts them back.
    { slug: "bullpadel-neuron-02-comfort-2027", name: "Bullpadel Neuron 02 Edge Comfort 2027", why: "maker's name" },
    { slug: "bullpadel-xplo-comfort-2025", name: "Bullpadel Xplo CMF 2025", set: { balance: "Medium" }, why: "maker's name (CMF); medium balance" },
    { slug: "bullpadel-xplo-comfort-2026", name: "Bullpadel Xplo CMF 2026", why: "maker's name (CMF)" },
    { slug: "bullpadel-vertex-05-women-2026", name: "Bullpadel Vertex 05 W 2026", set: { balance: "Medium" }, why: "maker's name (W); medium balance" },
    { slug: "bullpadel-vertex-05-women-2027", name: "Bullpadel Vertex 05 W 2027", set: { balance: "Medium" }, why: "maker's name (W); medium balance" },
    // Years (section 5): the slug carries the year, so it changes and the old one redirects.
    { slug: "wilson-bela-v3-2026", name: "Wilson Bela V3 2025", year: 2025, newSlug: "wilson-bela-v3-2025", why: "the Bela V3 is a 2025 racket" },
    { slug: "wilson-blade-v3-2025", name: "Wilson Blade V3 2024", year: 2024, newSlug: "wilson-blade-v3-2024", why: "the Blade V3 is a 2024 racket" },
    { slug: "wilson-blade-pro-v3-2025", name: "Wilson Blade Pro V3 2024", year: 2024, newSlug: "wilson-blade-pro-v3-2024", why: "the Blade Pro V3 is a 2024 racket" },
    { slug: "kuikma-power-pro-2026", name: "Kuikma Power Pro 2025", year: 2025, newSlug: "kuikma-power-pro-2025", why: "a 2025 model still sold in 2026" },
    { slug: "kuikma-control-pro-2026", name: "Kuikma Control Pro 2025", year: 2025, newSlug: "kuikma-control-pro-2025", why: "a 2025 model still sold in 2026" },
    { slug: "head-evo-extreme-2026", name: "Head Evo Extreme 2025", year: 2025, newSlug: "head-evo-extreme-2025", why: "the 2025 model carried over" },
    // Specs (section 6)
    { slug: "siux-pegasus-elite-4-2026", set: { shape: "Hybrid" }, why: "a hybrid shape" },
    { slug: "babolat-air-viper-2025", set: { shape: "Teardrop" }, why: "a teardrop" },
    { slug: "bullpadel-hack-04-hybrid-2025", set: { balance: "Medium-low" }, why: "the Hybrid's \"High\" balance is really medium–low" },
    { slug: "siux-trilogy-pro-5-2025", set: { balance: "Medium" }, why: "medium balance" },
    { slug: "bullpadel-icon-2026", set: { balance: "Medium" }, why: "medium balance" },
    { slug: "bullpadel-hack-05-hybrid-2027", set: { balance: "Medium" }, why: "medium balance" },
    { slug: "nox-vk10-ventus-control-12k-2026", set: { balance: "Medium" }, why: "medium balance" },
    { slug: "head-evo-speed-2025", set: { balance: "Low", weight: "340–360 g", surface: "Innegra / fiberglass" }, why: "low balance, 340–360 g, Innegra/fiberglass face" },
    { slug: "head-one-ultralight-2024", set: { balance: "Low", weight: "300–345 g" }, why: "low balance, 300–345 g" },
    { slug: "head-radical-motion-2026", set: { surface: "3K carbon" }, why: "a 3K carbon face" },
  ],
  merges: [
    { from: "babolat-technical-viper-3-0-2026", into: "babolat-viper-juan-lebron-3-0-2026", why: "Technical Viper 3.0 = Viper Juan Lebrón 3.0" },
    { from: "babolat-technical-veron-3-0-2026", into: "babolat-veron-juan-lebron-3-0-2026", why: "Technical Veron 3.0 = Veron Juan Lebrón 3.0" },
    { from: "babolat-technical-viper-soft-3-0-2026", into: "babolat-viper-soft-juan-lebron-3-0-2026", why: "Technical Viper Soft 3.0 = Viper Soft Juan Lebrón 3.0" },
    { from: "nox-ventus-attack-12k-xtrem-2027", into: "nox-ea10-ventus-attack-12k-xtrem-2026", why: "the \"2027 Ventus Attack 12K XTREM\" is the EA10 2026" },
    { from: "head-extreme-motion-2025", into: "head-extreme-motion-2026", why: "there is no 2025 Extreme Motion; it is the 2026" },
  ],
};

const PICKLEBALL: { fixes: Fix[]; merges: Merge[] } = {
  fixes: [
    // Years (slugs carry no year here, so URLs don't change)
    ...["friday-fever-101-elongated", "friday-fever-102-elongated", "friday-fever-102-widebody"].map(slug => ({ slug, year: 2025, why: "Fever 101/102 are 2025 paddles" })),
    { slug: "prokennex-black-ace-ovation", year: 2022, why: "released late 2022" },
    { slug: "helios-the-athos", year: 2025, why: "Athos and Astraeus years were swapped" },
    { slug: "helios-the-astraeus", year: 2024, why: "Athos and Astraeus years were swapped" },
    { slug: "paddletek-bantam-esq-c", year: 2024, set: { weight: "7.6–7.9 oz" }, why: "a late-2024 release; 7.6–7.9 oz" },
    { slug: "paddletek-bantam-tko-cx", year: 2024, why: "a late-2024 release" },
    // Names (the slug stays, so no URL changes)
    { slug: "diadem-edge-18k-power", name: "Diadem Edge 18K Power Pro", why: "maker's name" },
    { slug: "luzz-probladz-2", name: "Luzz Pro Blade 2", why: "maker's name" },
    { slug: "holbrook-arma-x", name: "Holbrook Arma Metallic X", why: "maker's name" },
    { slug: "luzz-cannon", name: "Luzz Pro Cannon", why: "maker's name" },
    // Specs
    { slug: "holbrook-pro-aero-x", set: { shape: "Elongated" }, why: "an elongated shape" },
    { slug: "head-radical-pro-ex15", set: { weight: "8.13 oz (230 g)" }, why: "weighs 8.13 oz" },
    { slug: "vatic-pro-prism-flash", set: { core: "16 mm", weight: "7.9–8.2 oz" }, why: "16 mm only" },
    { slug: "six-zero-black-opal-14mm", set: { surface: "Raw carbon fiber with Diamond Tough grit coating" }, why: "\"Diamond Tough\" is the grit coating, not the carbon" },
    { slug: "six-zero-black-opal-14mm-elongated", set: { surface: "Raw carbon fiber with Diamond Tough grit coating" }, why: "\"Diamond Tough\" is the grit coating, not the carbon" },
    { slug: "pickleball-apes-pulse", set: { core: "16.5 mm" }, why: "a 16.5 mm core" },
  ],
  merges: [
    { from: "joola-graf-pro-v", into: "joola-agassi-pro-v", why: "Graf Pro V = Agassi Pro V" },
    { from: "joola-graf-edge", into: "joola-agassi-edge", why: "Graf Edge = Agassi Edge" },
  ],
};

// TennisRecs (Grok's scoring pass 2026-11-19, grok/tennis-play-scores/results/CATALOG-FIXES-tennis.md): only the flags that
// tennis-warehouse.com confirmed. Columns here: weight = strung weight, balance = strung balance, surface = stiffness (RA).
const TENNIS: { fixes: Fix[]; merges: Merge[] } = {
  fixes: [
    { slug: "wilson-burn-100s-v6", set: { surface: "71 RA" }, why: "TW lists 71 (73 was copied from the V5)" },
    { slug: "head-instinct-pwr-110-2025", name: "Head PWR 110 2025", set: { weight: "278 g strung", surface: "65 RA" }, why: "sold as Head PWR 110; TW: 278 g strung, 65 stiffness" },
    { slug: "head-instinct-pwr-115-2025", name: "Head PWR 115 2025", why: "sold as Head PWR 115 (specs already match TW)" },
    { slug: "yonex-ezone-98-tour-8th-gen", set: { balance: "4 pts HL strung", surface: "62 RA" }, why: "TW: 4 pts HL, 62 stiffness" },
    { slug: "prince-ripstick-100-280g", name: "Prince Ripstick 100 280g 2025", why: "the current version is the 2025 (TW); tells it apart from the 2021" },
  ],
  merges: [],
};
const PLAN = niche.id === "padel" ? PADEL : niche.id === "pickleball" ? PICKLEBALL : niche.id === "tennis" ? TENNIS : null;
if (!PLAN) throw new Error("NICHE=padel, pickleball or tennis");
const args = process.argv.slice(2), write = args.includes("--write"), backupDir = args[args.indexOf("--backup") + 1];
if (write && (!args.includes("--backup") || !backupDir)) throw new Error("--write needs --backup <dir>");

const db = await database(), S = sql.identifier(assertSchemaName(niche.schema));
const rows = async <T,>(q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: T[] }).rows ?? (r as unknown as T[])); };
type R = { id: string; slug: string; name: string; year: number; shape: string | null; weight: string | null; balance: string | null; core: string | null; surface: string | null; trait_override: unknown };
const all = await rows<R>(sql`select id, slug, name, year, shape, weight, balance, core, surface, trait_override from ${S}.rackets`);
const redirects = await rows<{ slug: string; racket_id: string }>(sql`select slug, racket_id from ${S}.racket_slug_redirects`);
const bySlug = new Map(all.map(r => [r.slug, r]));
const count = async (table: string, col: string, id: string) => Number((await rows<{ n: string }>(sql`select count(*)::int as n from ${S}.${sql.identifier(table)} where ${sql.identifier(col)} = ${id}`))[0]?.n ?? 0);

const problems: string[] = [], out: string[] = [];
const touched = new Set<string>();
out.push(`# ${niche.id} catalog fixes: ${write ? "WRITE" : "dry run"} (${new Date().toISOString().slice(0, 16)}Z)`, "", "## Renames, years and specs", "", "| Product | Change | Why |", "|---|---|---|");
for (const f of PLAN.fixes) {
  const r = bySlug.get(f.slug);
  if (!r) { problems.push(`not found: ${f.slug}`); continue; }
  const ch: string[] = [];
  if (f.name && f.name !== r.name) ch.push(`name "${r.name}" → "${f.name}"`);
  if (f.year && f.year !== r.year) ch.push(`year ${r.year} → ${f.year}`);
  if (f.newSlug && f.newSlug !== r.slug) {
    if (bySlug.has(f.newSlug) || redirects.some(x => x.slug === f.newSlug && x.racket_id !== r.id)) problems.push(`slug taken: ${f.newSlug}`);
    ch.push(`URL /${f.slug} → /${f.newSlug} (old URL redirects)`);
  }
  for (const [k, v] of Object.entries(f.set ?? {})) if (v !== r[k as keyof Spec]) ch.push(`${k} "${r[k as keyof Spec] ?? "—"}" → "${v}"`);
  if (!ch.length) { out.push(`| ${r.name} | already right | ${f.why} |`); continue; }
  touched.add(r.id);
  out.push(`| ${r.name} (\`${r.slug}\`) | ${ch.join("; ")} | ${f.why} |`);
}
out.push("", "## Duplicates merged (reviews kept)", "", "| Dropped | Kept | Moves | Specs filled | Why |", "|---|---|---|---|---|");
const mergeInfo: { from: R; into: R; fill: Spec }[] = [];
for (const m of PLAN.merges) {
  const a = bySlug.get(m.from), b = bySlug.get(m.into);
  if (!a || !b) { problems.push(`merge: not found ${!a ? m.from : m.into}`); continue; }
  const n = { reviews: await count("reviews", "racket_id", a.id), web: await count("external_reviews", "racket_id", a.id), votes: await count("product_votes", "racket_id", a.id), evidence: await count("evidence", "product_id", a.id) };
  const fill: Spec = {}; for (const k of ["shape", "weight", "balance", "core", "surface"] as const) if (!b[k] && a[k]) fill[k] = a[k]!;
  mergeInfo.push({ from: a, into: b, fill }); touched.add(a.id); touched.add(b.id);
  out.push(`| ${a.name} (\`${a.slug}\`) | ${b.name} (\`${b.slug}\`) | ${n.reviews} reviews, ${n.web} web reviews, ${n.votes} votes, ${n.evidence} evidence rows; /${a.slug} redirects | ${Object.keys(fill).join(", ") || "none"} | ${m.why} |`);
}
if (problems.length) out.push("", "## Problems (nothing written while any remain)", ...problems.map(p => `- ${p}`));
console.log(out.join("\n"));
if (!write) { console.log("\nDry run: nothing written."); process.exit(0); }
if (problems.length) throw new Error("Problems listed above; nothing written.");

// Backup: every row the write touches.
mkdirSync(backupDir, { recursive: true });
const ids = [...touched];
const dump = async (table: string, col: string) => rows(sql`select * from ${S}.${sql.identifier(table)} where ${sql.identifier(col)} in (${sql.join(ids.map(i => sql`${i}`), sql`, `)})`);
const backup = { at: new Date().toISOString(), schema: niche.schema, rackets: await dump("rackets", "id"), reviews: await dump("reviews", "racket_id"), external_reviews: await dump("external_reviews", "racket_id"),
  product_votes: await dump("product_votes", "racket_id"), evidence: await dump("evidence", "product_id"), product_photos: await dump("product_photos", "racket_id"), racket_slug_redirects: await dump("racket_slug_redirects", "racket_id") };
const file = `${backupDir}/${niche.id}-catalog-fixes-${backup.at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup));
console.log(`Backup: ${file} (${backup.rackets.length} products, ${backup.reviews.length} reviews, ${backup.external_reviews.length} web reviews, ${backup.evidence.length} evidence rows)`);

const now = new Date().toISOString();
await db.transaction(async tx => {
  const x = (q: ReturnType<typeof sql>) => tx.execute(q);
  for (const f of PLAN.fixes) {
    const r = bySlug.get(f.slug)!;
    const set = { ...(f.name ? { name: f.name } : {}), ...(f.year ? { year: f.year } : {}), ...(f.set ?? {}) };
    for (const [k, v] of Object.entries(set)) await x(sql`update ${S}.rackets set ${sql.identifier(k)} = ${v} where id = ${r.id}`);
    if (f.newSlug && f.newSlug !== r.slug) {
      await x(sql`update ${S}.rackets set slug = ${f.newSlug} where id = ${r.id}`);
      await x(sql`insert into ${S}.racket_slug_redirects (slug, racket_id, created_at) values (${r.slug}, ${r.id}, ${now}) on conflict (slug) do update set racket_id = excluded.racket_id`);
    }
  }
  for (const { from: a, into: b, fill } of mergeInfo) {
    await x(sql`update ${S}.reviews set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`update ${S}.external_reviews set racket_id = ${b.id} where racket_id = ${a.id}`);
    // A voter who voted on both keeps the vote on the kept product.
    await x(sql`delete from ${S}.product_votes where racket_id = ${a.id} and voter in (select voter from ${S}.product_votes where racket_id = ${b.id})`);
    await x(sql`update ${S}.product_votes set racket_id = ${b.id} where racket_id = ${a.id}`);
    // Rows the kept product already has (same source and attribute, e.g. the maker's spec rows) stay its own; the duplicates go.
    await x(sql`delete from ${S}.evidence e where e.product_id = ${a.id} and exists (select 1 from ${S}.evidence k where k.product_id = ${b.id}
      and k.source_kind = e.source_kind and k.source_ref = e.source_ref and k.attribute = e.attribute and k.extracted_by is not distinct from e.extracted_by)`);
    await x(sql`update ${S}.evidence set product_id = ${b.id} where product_id = ${a.id}`);
    for (const [k, v] of Object.entries(fill)) await x(sql`update ${S}.rackets set ${sql.identifier(k)} = ${v} where id = ${b.id}`);
    // The dropped product's hand-set How it plays / expert values move only where the kept one has none.
    if (a.trait_override && !b.trait_override) await x(sql`update ${S}.rackets set trait_override = ${JSON.stringify(a.trait_override)}::jsonb where id = ${b.id}`);
    await x(sql`update ${S}.racket_slug_redirects set racket_id = ${b.id} where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.product_photos where racket_id = ${a.id}`);
    await x(sql`delete from ${S}.rackets where id = ${a.id}`);
    await x(sql`insert into ${S}.racket_slug_redirects (slug, racket_id, created_at) values (${a.slug}, ${b.id}, ${now}) on conflict (slug) do update set racket_id = excluded.racket_id`);
  }
});
console.log("Written.");
process.exit(0);
