import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { niches, selectNiche, niche } from "../lib/niche";
import { arts } from "../app/art";
import { assertNicheSchema } from "../lib/deployment-target";
import { forSchema, migrationSql, migrationsTable, SOURCE_SCHEMA } from "../db/migrations";
import { snapshotSchema, snapshotSource } from "../db/transfer";
import { catalogSchema } from "../db/schema";
import targets from "../deployment/targets.json";

const columns = ["powerRating", "controlRating", "maneuverabilityRating", "comfortRating", "forgivenessRating"];
const unique = (values: string[]) => new Set(values).size === values.length;

test("NICHE selects the site config; unset means padel and unknown values fail loudly", () => {
  assert.equal(selectNiche(undefined).id, "padel");
  assert.equal(selectNiche("").id, "padel");
  assert.equal(selectNiche(" Padel ").id, "padel");
  assert.throws(() => selectNiche("curling"), /Unknown NICHE "curling"/);
  assert.throws(() => selectNiche("toString"), /Unknown NICHE/);
  // The test run has no NICHE set, so everything here is padel, stored in the original schema.
  assert.equal(niche.id, "padel");
  assert.equal(niche.schema, "padelrecs");
  assert.equal(catalogSchema.schemaName, "padelrecs");
});

test("padel keeps its exact wording, options and visuals", () => {
  const padel = niches.padel;
  assert.equal(padel.site.name, "PadelRecs");
  assert.equal(padel.site.domain, "padelrecs.com");
  assert.deepEqual(padel.words, { one: "racket", many: "rackets", One: "Racket", Many: "Rackets" });
  assert.deepEqual(padel.categories.map(c => c.label), ["Power", "Control", "Maneuverability", "Comfort", "Forgiveness"]);
  assert.deepEqual(padel.profile.playingSide.options.map(o => o.value), ["Left", "Right", "Both"]);
  assert.deepEqual(padel.profile.playerLevel.options.map(o => o.value), ["Beginner", "Intermediate", "Advanced", "Competitive"]);
  assert.deepEqual(padel.specs.map(s => s.column), ["shape", "weight", "balance", "core", "surface"]);
  assert.equal(padel.tags.length, 16);
  assert.equal(padel.theme["--green"], "#1b6b43");
  assert.equal(padel.seo.homeTitle, "PadelRecs – Real Player Reviews of Padel Rackets");
});

test("every niche config is complete and consistent", async () => {
  const css = await readFile("app/globals.css", "utf8");
  // Tokens the stylesheet uses but does not define must come from the niche theme.
  const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]));
  const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const runtime = new Set(["--r", "--c", "--font-display", "--font-sans"]);
  const needed = [...used].filter(name => !defined.has(name) && !runtime.has(name));
  assert(needed.includes("--green") && needed.includes("--score-on"));
  const schemas: string[] = [];
  for (const [id, n] of Object.entries(niches)) {
    assert.equal(n.id, id);
    assert.match(n.schema, /^[a-z][a-z0-9_]*$/);
    schemas.push(n.schema);
    for (const name of needed) assert(n.theme[name as `--${string}`], `${id} theme is missing ${name}`);
    assert(n.categories.length > 0 && n.categories.every(c => columns.includes(c.column)), `${id} categories must use review rating columns`);
    assert(unique(n.categories.map(c => c.column)), `${id} maps two categories onto one column`);
    for (const [field, profile] of Object.entries(n.profile)) {
      if (typeof profile === "string") continue;
      assert(profile.options.length > 0 && unique(profile.options.map(o => o.value)), `${id} ${field} options`);
    }
    assert(unique(n.specs.map(s => s.column)), `${id} spec columns`);
    assert(unique(n.tags.map(t => t.label)), `${id} tags`);
    assert.deepEqual(Object.keys(n.ratingWords).sort(), ["1", "2", "3", "4", "5"]);
    assert(n.sourcePlatforms.length > 0);
    assert(Object.hasOwn(arts, id) && typeof arts[id].ProductIcon === "function" && typeof arts[id].LogoIcon === "function", `${id} needs app/art/${id}.tsx registered in app/art/index.ts`);
    assert.equal((targets.nicheSchemas as Record<string, string>)[id], n.schema, `${id} must be recorded in deployment/targets.json`);
  }
  assert(unique(schemas), "two niches share a schema");
});

test("database connections refuse a niche whose schema is not recorded for it", () => {
  assert.equal(assertNicheSchema(), "padelrecs");
  assert.throws(() => assertNicheSchema({ id: "pickleball", schema: "pickleballrecs" }, { padel: "padelrecs" }), /not recorded/);
  assert.throws(() => assertNicheSchema({ id: "padel", schema: "otherrecs" }, { padel: "padelrecs" }), /not recorded/);
  assert.throws(() => assertNicheSchema({ id: "pickleball", schema: "padelrecs" }, { padel: "padelrecs", pickleball: "padelrecs" }), /another niche/);
});

test("migrations rewrite to any niche schema and leave padel untouched", async () => {
  const original = await readFile("drizzle/0000_noisy_natasha_romanoff.sql", "utf8");
  assert.equal(forSchema(original, SOURCE_SCHEMA), original);
  assert.equal(migrationsTable("padelrecs"), "__drizzle_migrations");
  assert.equal(migrationsTable("pickleballrecs"), "__drizzle_migrations_pickleballrecs");
  assert.throws(() => forSchema(original, 'x"; drop schema padelrecs; --'), /Invalid Postgres schema/);
  const engine = new PGlite();
  try {
    // Two niches side by side in one database, as in the shared Supabase project.
    for (const statement of migrationSql("padelrecs")) await engine.exec(statement);
    for (const statement of migrationSql("testrecs")) await engine.exec(statement);
    const tables = await engine.query<{ schemaname: string; tablename: string; rowsecurity: boolean }>("select schemaname, tablename, rowsecurity from pg_tables where schemaname in ('padelrecs','testrecs') order by 1, 2");
    const of = (schema: string) => tables.rows.filter(r => r.schemaname === schema).map(r => r.tablename);
    assert.equal(of("testrecs").length, 6);
    assert.deepEqual(of("testrecs"), of("padelrecs"));
    assert(tables.rows.every(r => r.rowsecurity));
    // Foreign keys stay inside their own schema.
    const fks = await engine.query<{ def: string }>("select pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_namespace n on n.oid = c.connamespace where n.nspname = 'testrecs' and c.contype = 'f'");
    assert(fks.rows.length > 0 && fks.rows.every(r => r.def.includes("testrecs.") && !r.def.includes("padelrecs")));
  } finally { await engine.close(); }
});

test("snapshots record their schema; older ones count as padel", () => {
  assert.equal(snapshotSource("supabase:ref", "pickleballrecs"), "supabase:ref#pickleballrecs");
  assert.equal(snapshotSchema({ source: "supabase:ref#pickleballrecs" }), "pickleballrecs");
  assert.equal(snapshotSchema({ source: "supabase:myauwuulzvkdsinfcfbc" }), "padelrecs");
});

test("pickleball: paddles under /paddles, spin stored in the comfort column, DUPR hints, own schema", () => {
  const p = selectNiche("pickleball");
  assert.equal(p.schema, "pickleballrecs");
  assert.equal(p.productPath, "paddles");
  assert.equal(p.words.many, "paddles");
  assert.deepEqual(p.categories.map(c => `${c.label}:${c.column}`), ["Power:powerRating", "Control:controlRating", "Spin:comfortRating", "Forgiveness:forgivenessRating", "Maneuverability:maneuverabilityRating"]);
  assert.deepEqual(p.profile.playingSide.options.map(o => o.value), ["Singles", "Doubles", "Both"]);
  assert(p.profile.playerLevel.options.every(o => o.hint?.startsWith("DUPR")));
  assert.equal(niches.padel.productPath, "rackets");
  // Rating images are valid data URIs like padel's: only <, > and # escaped.
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(p.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("every niche has its tab and home-screen icons", async () => {
  const { access } = await import("node:fs/promises");
  for (const id of Object.keys(niches)) for (const file of ["favicon.ico", "icon.svg", "apple-icon.png"]) await access(`public/niches/${id}/${file}`);
});

test("every niche has a recorded Vercel project", () => {
  const projects = (targets as { vercelProjects: Record<string, { name: string; id: string }> }).vercelProjects;
  for (const id of Object.keys(niches)) assert.match(projects[id]?.id ?? "", /^prj_/, `${id} needs a Vercel project in deployment/targets.json`);
  assert.equal(projects.padel.id, targets.vercelProjectId);
});
