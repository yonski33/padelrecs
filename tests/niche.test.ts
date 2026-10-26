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

test("pickleball: paddles under /paddles, no model years, spin stored in the comfort column, DUPR hints, own schema", () => {
  const p = selectNiche("pickleball");
  assert.equal(p.schema, "pickleballrecs");
  assert.equal(p.productYears, false);
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

test("live sites have their Vercel project recorded", () => {
  // A niche gets its entry once its Vercel project exists.
  const projects = (targets as { vercelProjects: Record<string, { name: string; id: string }> }).vercelProjects;
  for (const id of ["padel", "pickleball", "skin", "tennis", "running"]) assert.match(projects[id]?.id ?? "", /^prj_/, `${id} needs a Vercel project in deployment/targets.json`);
  for (const [id, project] of Object.entries(projects)) assert(Object.hasOwn(niches, id) && /^prj_/.test(project.id), `bad vercelProjects entry ${id}`);
  assert.equal(projects.padel.id, targets.vercelProjectId);
});

test("skin: products without years, users instead of players, skincare profile", () => {
  const n = selectNiche("skin");
  assert.equal(n.schema, "skinrecs");
  assert.equal(n.productPath, "products");
  assert.equal(n.productYears, false);
  assert.equal(n.people.many, "users");
  assert.deepEqual(n.categories.map(c => c.label), ["Results", "Texture", "Gentleness", "Scent", "Value"]);
  assert.deepEqual(n.profile.playerLevel.options.map(o => o.value), ["Dry", "Oily", "Combination", "Normal", "Sensitive"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Type", "Size", "Key ingredients", "Skin types", "Fragrance"]);
  assert(n.copy.about.sections.some(s => s.heading === "Not medical advice"));
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
  // Sports sites keep their wording.
  assert.equal(niches.padel.people.many, "players");
  assert.equal(niches.padel.copy.ui.whoUsesIt, "Who's playing it");
  assert.notEqual(niches.padel.productYears, false);
});

test("tennis: rackets named by generation (no years), NTRP hints, backhand, spin in the forgiveness column", () => {
  const n = selectNiche("tennis");
  assert.equal(n.schema, "tennisrecs");
  assert.equal(n.productPath, "rackets");
  assert.equal(n.productYears, false);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Power:powerRating", "Control:controlRating", "Spin:forgivenessRating", "Comfort:comfortRating", "Maneuverability:maneuverabilityRating"]);
  assert(n.profile.playerLevel.options.every(o => o.hint?.startsWith("NTRP")));
  assert.deepEqual(n.profile.playingSide.options.map(o => o.value), ["One-handed", "Two-handed"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Head size", "Weight", "Balance", "String pattern", "Stiffness"]);
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("running: shoes named by version (no years), mileage hints, gait, cushioning in the forgiveness column, category type pages", async () => {
  const n = selectNiche("running");
  assert.equal(n.schema, "runningrecs");
  assert.equal(n.productPath, "shoes");
  assert.equal(n.productYears, false);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Cushioning:forgivenessRating", "Responsiveness:powerRating", "Stability:controlRating", "Comfort & fit:comfortRating", "Durability:maneuverabilityRating"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Weight", "Stack height", "Drop", "Plate"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  const { shapeOf } = await import("../app/art/running");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["daily", "max", "stability", "tempo", "racing", "trail"]);
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("golf: drivers named by generation (no years), handicap hints, swing speed, distance in the power column, category type pages", async () => {
  const n = selectNiche("golf");
  assert.equal(n.schema, "golfrecs");
  assert.equal(n.productPath, "drivers");
  assert.equal(n.productYears, false);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Distance:powerRating", "Accuracy:controlRating", "Forgiveness:forgivenessRating", "Feel & sound:comfortRating", "Looks:maneuverabilityRating"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Lofts", "Head size", "Stock shaft", "Adjustable hosel"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  const { shapeOf } = await import("../app/art/golf");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["lowspin", "max", "draw", "light", "mini"]);
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("gaming: gear named by generation (no years), four category pages that each pick a drawing, gamer profile, keycap rating icons", async () => {
  const n = selectNiche("gaming");
  assert.equal(n.schema, "gamingrecs");
  assert.equal(n.productPath, "gear");
  assert.equal(n.productYears, false);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Performance:powerRating", "Comfort:comfortRating", "Build quality:controlRating", "Software & features:maneuverabilityRating", "Value:forgivenessRating"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Weight", "Connection", "Key specs", "Form factor"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["mice", "keyboards", "headsets", "controllers"]);
  const { shapeOf } = await import("../app/art/gaming");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["mouse", "keyboard", "headset", "controller"]);
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("discgolf: discs named by mold (no years), throw and distance profile, distance in the power column, one page per disc type", async () => {
  const n = selectNiche("discgolf");
  assert.equal(n.schema, "discgolfrecs");
  assert.equal(n.productPath, "discs");
  assert.equal(n.productYears, false);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Distance:powerRating", "Accuracy:controlRating", "Forgiveness:forgivenessRating", "Grip & feel:comfortRating", "Versatility:maneuverabilityRating"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Type", "Flight numbers", "Rim width", "Plastics", "Max weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["distance-drivers", "fairway-drivers", "midranges", "putters"]);
  const { shapeOf } = await import("../app/art/discgolf");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["distance", "fairway", "midrange", "putter"]);
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("simracing: gear named by generation (no years), five category pages that each pick a drawing, driver profile, steering-wheel rating icons", async () => {
  const n = selectNiche("simracing");
  assert.equal(n.schema, "simracingrecs");
  assert.equal(n.productPath, "gear");
  assert.equal(n.productYears, false);
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => c.label), ["Performance", "Feel & ergonomics", "Build quality", "Software & compatibility", "Value"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["wheelbases", "wheels", "pedals", "cockpits", "shifters-handbrakes"]);
  const { shapeOf } = await import("../app/art/simracing");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["wheelbase", "wheel", "pedals", "cockpit", "shifter"]);
  assert.equal(n.topLists?.length, 6);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /sim-racing/, `${list.slug}: niche keyword in the slug`);
    assert.match(list.title, /Sim Racing/, `${list.slug}: niche keyword in the title`);
    for (const f of list.filters ?? []) for (const shape of f.include ?? []) assert(n.shapeFilter.includes(shape), `${list.slug}: unknown category ${shape}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("cycling: bikes named by model and frame tier (no years), road/gravel/mountain pages that each pick a drawing, rider profile, wheel rating icons", async () => {
  const n = selectNiche("cycling");
  assert.equal(n.schema, "cyclingrecs");
  assert.equal(n.productPath, "bikes");
  assert.equal(n.productYears, false);
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => c.label), ["Speed & efficiency", "Comfort & fit", "Handling", "Parts & spec", "Value"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["road-bikes", "gravel-bikes", "mountain-bikes"]);
  const { shapeOf } = await import("../app/art/cycling");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["road", "gravel", "mountain"]);
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("audio: headphones, IEMs and earbuds named by generation (no years), three category pages that each pick a drawing, listener profile, headphone rating icons", async () => {
  const n = selectNiche("audio");
  assert.equal(n.schema, "audiorecs");
  assert.equal(n.productPath, "gear");
  assert.equal(n.productYears, false);
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => c.label), ["Sound", "Comfort & fit", "Build quality", "Features", "Value"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["headphones", "iems", "earbuds"]);
  const { shapeOf } = await import("../app/art/audio");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["headphones", "iem", "earbuds"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /headphones|iems|earbuds/, `${list.slug}: niche keyword in the slug`);
    for (const tag of list.trait?.tags ?? []) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("monitor: monitors named by model number (no years), five category pages that each pick a drawing, owner profile, monitor rating icons", async () => {
  const n = selectNiche("monitor");
  assert.equal(n.schema, "monitorrecs");
  assert.equal(n.productPath, "monitors");
  assert.equal(n.productYears, false);
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Panel", "Screen", "Inputs", "Weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["gaming-monitors", "ultrawide-monitors", "productivity-monitors", "mac-monitors", "portable-monitors"]);
  const { shapeOf } = await import("../app/art/monitor");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["gaming", "ultrawide", "productivity", "creator", "portable"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /monitors/, `${list.slug}: niche keyword in the slug`);
    assert.match(list.title, /Monitors/, `${list.slug}: niche keyword in the title`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("gaming: every moved monitor page 301s to the same page on MonitorRecs", async () => {
  const { movedMonitorSlugs, movedMonitorBrandSlugs } = await import("../lib/niche/gaming-moved");
  const n = selectNiche("gaming");
  const moved = new Map((n.movedAway ?? []).filter(m => !m.query).map(m => [m.source, m.destination]));
  assert.equal(movedMonitorSlugs.length, 88);
  for (const slug of movedMonitorSlugs) assert.equal(moved.get(`/gear/${slug}`), `https://www.monitorrecs.com/monitors/${slug}`);
  for (const slug of movedMonitorBrandSlugs) assert.equal(moved.get(`/brands/${slug}`), `https://www.monitorrecs.com/brands/${slug}`);
  assert.equal(moved.get("/monitors"), "https://www.monitorrecs.com/gaming-monitors");
  assert(!n.typePages?.some(t => t.slug === "monitors"));
  assert(!n.shapeFilter.includes("Monitor"));
  // Monitor-only brands never reappear on GamingRecs while their pages redirect.
  const { readCatalog } = await import("../db/catalog-file");
  const gaming = await readCatalog("db/catalogs/gaming.json");
  assert(!gaming.brands.some(b => movedMonitorBrandSlugs.includes(b.id)));
  assert(!gaming.products.some(p => p.shape === "Monitor"));
});

test("camera: cameras named by generation (no years), four category pages that each pick a drawing, photographer profile, camera rating icons", async () => {
  const n = selectNiche("camera");
  assert.equal(n.schema, "camerarecs");
  assert.equal(n.productPath, "cameras");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-QKXR6JZF5L");
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => c.label), ["Image quality", "Autofocus & speed", "Handling & build", "Video & features", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Sensor", "Resolution", "Mount / lens", "Weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["mirrorless-cameras", "compact-cameras", "vlogging-cameras", "action-cameras"]);
  const { shapeOf } = await import("../app/art/camera");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["mirrorless", "compact", "vlogging", "action"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /cameras/, `${list.slug}: niche keyword in the slug`);
    assert.match(list.title, /Cameras/, `${list.slug}: niche keyword in the title`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("ultralight: gear named without years, eight category pages that each pick a drawing, hiker profile, tent rating icons", async () => {
  const n = selectNiche("ultralight");
  assert.equal(n.schema, "ultralightrecs");
  assert.equal(n.productPath, "gear");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-D9N3940RRH");
  assert.equal(n.tags.length, 22);
  assert.deepEqual(n.categories.map(c => c.label), ["Weight & packability", "Comfort", "Performance", "Durability", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Type", "Capacity / warmth / size", "Material", "Weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["tents", "backpacks", "sleeping-pads", "quilts", "cook-kits", "water-filters", "trekking-poles", "rain-jackets"]);
  const { shapeOf } = await import("../app/art/ultralight");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["shelter", "backpack", "pad", "quilt", "cook", "filter", "poles", "jacket"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /ultralight|trekking-pole|freestanding/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("badminton: rackets named without years, series as the catalogue shape, singles/doubles profile, shuttlecock rating icons", async () => {
  const n = selectNiche("badminton");
  assert.equal(n.schema, "badmintonrecs");
  assert.equal(n.site.domain, "badmintonrecs.com");
  assert.equal(n.productPath, "rackets");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-P4JEKN83JF");
  assert.equal(n.words.one, "racket");
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Power:powerRating", "Control:controlRating", "Speed:maneuverabilityRating", "Forgiveness:forgivenessRating", "Feel:comfortRating"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Series", "Weight", "Balance", "Flex", "String tension"]);
  assert.deepEqual(n.profile.playingSide.options.map(o => o.value), ["Singles", "Doubles", "Mixed", "All of them"]);
  const { shapeOf } = await import("../app/art/badminton");
  assert(n.specs[0].options!.every(s => shapeOf(s) === "racket"));
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /badminton/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("fragrance: fragrances named by line and concentration (no years), For as the catalogue shape with three type pages, bottle rating icons", async () => {
  const n = selectNiche("fragrance");
  assert.equal(n.schema, "fragrancerecs");
  assert.equal(n.site.domain, "fragrancerecs.com");
  assert.equal(n.productPath, "fragrances");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-VB88Q9X0X1");
  assert.equal(n.words.one, "fragrance");
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => `${c.label}:${c.column}`), ["Scent:comfortRating", "Longevity:controlRating", "Projection:powerRating", "Versatility:maneuverabilityRating", "Value:forgivenessRating"]);
  assert.deepEqual(n.specs.map(s => s.label), ["For", "Concentration", "Sizes", "Notes", "Fragrance family"]);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["mens-fragrances", "womens-fragrances", "unisex-fragrances"]);
  const { shapeOf } = await import("../app/art/fragrance");
  for (const t of n.typePages ?? []) assert.notEqual(shapeOf(t.shape), "unknown", `${t.shape}: no drawing`);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /fragrances/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
    for (const f of list.filters ?? []) for (const v of f.include ?? []) assert(n.typePages!.some(t => t.shape === v), `${list.slug}: unknown For value ${v}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("coffee: gear named without years, five category pages that each pick a drawing, home barista profile, bean rating icons", async () => {
  const n = selectNiche("coffee");
  assert.equal(n.schema, "coffeerecs");
  assert.equal(n.productPath, "gear");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-T3KLFWDEQB");
  assert.equal(n.tags.length, 16);
  assert.deepEqual(n.categories.map(c => c.label), ["Coffee quality", "Ease of use", "Consistency", "Build quality", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Type", "Key specs", "Material", "Weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["espresso-machines", "grinders", "brewers", "kettles", "scales"]);
  const { shapeOf } = await import("../app/art/coffee");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["espresso", "grinder", "brewer", "kettle", "scale"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /coffee|espresso/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("climbing: gear named without years, six category pages that each pick a drawing, climber profile, hold rating icons", async () => {
  const n = selectNiche("climbing");
  assert.equal(n.schema, "climbingrecs");
  assert.equal(n.productPath, "gear");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-LDTENY2PVS");
  assert.equal(n.tags.length, 17);
  assert.deepEqual(n.categories.map(c => c.label), ["Performance", "Comfort", "Ease of use", "Durability", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Type", "Key specs", "Material", "Weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["climbing-shoes", "harnesses", "belay-devices", "ropes", "chalk-bags", "crash-pads"]);
  const { shapeOf } = await import("../app/art/climbing");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["shoe", "harness", "belay", "rope", "chalk", "pad"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /climbing|belay|chalk|crash/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("nails: products named without years, six category pages that each pick a drawing, nails profile, nail rating icons", async () => {
  const n = selectNiche("nails");
  assert.equal(n.schema, "nailsrecs");
  assert.equal(n.productPath, "products");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-K6TCLCXZX6");
  assert.equal(n.tags.length, 19);
  for (const tag of ["long-lasting", "chips easily", "glossy", "easy to apply", "streaky", "opaque in one coat", "quick drying", "strong smell", "gentle on nails"]) assert(n.tags.some(t => t.label === tag), tag);
  assert.deepEqual(n.categories.map(c => c.label), ["Wear", "Application", "Finish", "Nail health", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Type", "Key specs", "Formula", "Size"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["nail-polish", "gel-polish", "base-and-top-coats", "press-on-nails", "nail-treatments", "cuticle-oils"]);
  const { shapeOf } = await import("../app/art/nails");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["polish", "gel", "coat", "press", "treatment", "oil"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /nail|cuticle|press-on/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("kitchen: appliances named without years, six category pages that each pick a drawing, kitchen profile, cooking-pot rating icons", async () => {
  const n = selectNiche("kitchen");
  assert.equal(n.schema, "kitchenrecs");
  assert.equal(n.productPath, "appliances");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-S1MRX3VYPL");
  assert.equal(n.tags.length, 19);
  for (const tag of ["crispy results", "smooth blends", "easy to clean", "hard to clean", "coating peeled", "loud", "great value"]) assert(n.tags.some(t => t.label === tag), tag);
  assert.deepEqual(n.categories.map(c => c.label), ["Results", "Ease of use", "Cleaning", "Build quality", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Type", "Capacity", "Model number", "Power"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["air-fryers", "countertop-ovens", "blenders", "stand-mixers", "food-processors", "multicookers"]);
  const { shapeOf } = await import("../app/art/kitchen");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["airfryer", "oven", "blender", "mixer", "processor", "multicooker"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /air-fryer|oven|blender|mixer|processor|multicooker|kitchen/, `${list.slug}: niche keyword in the slug`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("snowboard: boards named with model years, four category pages that each pick a drawing, rider profile, snowflake rating icons", async () => {
  const n = selectNiche("snowboard");
  assert.equal(n.schema, "snowboardrecs");
  assert.equal(n.productPath, "snowboards");
  assert.notEqual(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-7EGLY6ZMS1");
  assert.equal(n.tags.length, 20);
  for (const tag of ["poppy", "great edge hold", "floats in powder", "catchy", "washes out", "great value"]) assert(n.tags.some(t => t.label === tag), tag);
  assert.deepEqual(n.categories.map(c => c.label), ["Pop", "Carving", "Playfulness", "Stability", "Forgiveness"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Terrain", "Profile", "Shape", "Flex"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["all-mountain-snowboards", "freestyle-snowboards", "freeride-snowboards", "splitboards"]);
  const { shapeOf } = await import("../app/art/snowboard");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["allmountain", "freestyle", "freeride", "split"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /snowboard|splitboard/, `${list.slug}: niche keyword in the slug`);
    assert.equal(list.maxAgeYears, 2, `${list.slug}: keeps to recent model years`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("tabletennis: equipment named without years, three type pages that each pick a drawing, grip and style profile, ball rating icons", async () => {
  const n = selectNiche("tabletennis");
  assert.equal(n.schema, "tabletennisrecs");
  assert.equal(n.productPath, "equipment");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-VLT8WJNTN2");
  assert.equal(n.tags.length, 21);
  for (const tag of ["spinny", "great control", "too fast", "loses grip fast", "high throw", "great value"]) assert(n.tags.some(t => t.label === tag), tag);
  assert.deepEqual(n.categories.map(c => c.label), ["Speed", "Spin", "Control", "Forgiveness", "Feel"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Type", "Class", "Construction", "Sponge", "Weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["blades", "rubbers", "pre-assembled-rackets"]);
  const { shapeOf } = await import("../app/art/tabletennis");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["blade", "rubber", "racket"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /table-tennis/, `${list.slug}: niche keyword in the slug`);
    assert.equal(list.maxAgeYears, undefined, `${list.slug}: no model years here`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});

test("homegym: equipment named without years, seven category pages that each pick a drawing, training profile, plate rating icons", async () => {
  const n = selectNiche("homegym");
  assert.equal(n.schema, "homegymrecs");
  assert.equal(n.productPath, "equipment");
  assert.equal(n.productYears, false);
  assert.equal(n.site.analyticsId, "G-FJCY7164W9");
  assert.equal(n.tags.length, 21);
  for (const tag of ["solid build", "stable", "quick to adjust", "wobbly", "needs a tall ceiling", "great value"]) assert(n.tags.some(t => t.label === tag), tag);
  assert.deepEqual(n.categories.map(c => c.label), ["Build quality", "Ease of use", "Space", "Stability", "Value"]);
  assert.deepEqual(n.specs.map(s => s.label), ["Category", "Type", "Load", "Build", "Item weight"]);
  assert.deepEqual(n.typePages?.map(t => t.shape), n.shapeFilter);
  assert.deepEqual(n.typePages?.map(t => t.slug), ["dumbbells", "racks", "benches", "barbells", "plates", "machines", "cardio"]);
  const { shapeOf } = await import("../app/art/homegym");
  assert.deepEqual(n.shapeFilter.map(s => shapeOf(s)), ["dumbbell", "rack", "bench", "barbell", "plates", "machine", "cardio"]);
  for (const list of n.topLists ?? []) {
    assert.match(list.slug, /home-gym|dumbbells|power-racks/, `${list.slug}: niche keyword in the slug`);
    assert.equal(list.maxAgeYears, undefined, `${list.slug}: no model years here`);
    for (const tag of [...list.trait?.tags ?? [], ...list.trait?.against ?? []]) assert(n.tags.some(t => t.label === tag), `${list.slug}: unknown tag ${tag}`);
  }
  for (const key of ["--score-on", "--score-off", "--score-pick-on", "--score-pick-off"] as const) {
    assert.match(n.theme[key], /^url\("data:image\/svg\+xml,%3Csvg [^"<>#]*%3C\/svg%3E"\)$/);
  }
});
