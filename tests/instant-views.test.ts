import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { viewKey, readViewKey, SKIN_HOME_VIEW, SKIN_PRODUCT_VIEW, SKIN_CATALOG_VIEW } from "../lib/view-key";
import { readSkinChoice, skinQuery, SKIN_TYPES, GOALS, TEXTURES, BUDGETS } from "../lib/skin-choice";
import { attrMatch, type ProductAttrs } from "../lib/attr-score";
import { attrProfileFor } from "../lib/attr-profile";
import { rankSkin, wireCtx, type SkinWire } from "../app/skin/rank";
import { productView, type ProductInput } from "../app/skin/product-view";
import { skin } from "../lib/niche/skin";

// Filter, sort and pick changes are instant on every site (owner 2026-11-15 padel, 2026-11-16 SkinRecs; lib/niche/README.md
// "Filters and picks are client-side"): a tap changes the view in the browser with app/instant-view.ts and never asks the server, and each
// filter address is served from a cached page per view (proxy.ts → app/v/…, lib/view-key.ts).

/** A server round trip per tap: a Next <Link scroll={false}> (re-renders the page on the server), router.push / router.replace
 *  to a new query, or reading the query with useSearchParams (which re-renders from it). */
const ROUND_TRIP: [RegExp, string][] = [[/scroll=\{false\}/, "<Link scroll={false}>"], [/router\.(push|replace)\(/, "router.push/replace"], [/useSearchParams\(/, "useSearchParams()"]];
/** Taps that still ask the server, outside the home / catalogue / rankings / product-page filters: review lists and their
 *  "load more", padel's brands sort, the classic and light looks' forms and tabs. Each moves to useInstantView when it is
 *  redesigned. Nothing new joins this list: a new design uses app/instant-view.ts. */
const LEGACY = new Set(["app/auto-submit.tsx", "app/brands/brands-v2.tsx", "app/cat-radios.tsx", "app/home-board.tsx", "app/load-more.tsx", "app/page.tsx",
  "app/rackets/[slug]/review-list.tsx", "app/reviews/latest-v2.tsx", "app/reviews/page.tsx"]);
const PRIVATE = /^app\/(funtimes|auth|api)\//;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : []; });
}
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

test("no filter or pick asks the server on a tap: every new design uses app/instant-view.ts", () => {
  const bad: string[] = [];
  for (const f of files("app")) {
    if (PRIVATE.test(f) || LEGACY.has(f)) continue;
    const src = code(readFileSync(f, "utf8"));
    for (const [re, what] of ROUND_TRIP) if (re.test(src)) bad.push(`${f}: ${what}`);
  }
  assert.deepEqual(bad, [], "Filters and picks change the view in the browser (useInstantView, app/instant-view.ts), not with a server round trip");
  // The legacy list only shrinks: a file that no longer needs it comes off.
  for (const f of LEGACY) assert.ok(ROUND_TRIP.some(([re]) => re.test(code(readFileSync(f, "utf8")))), `${f} no longer asks the server: take it off LEGACY`);
});

test("the instant filter UIs all go through the shared hook", () => {
  for (const f of ["app/home-match.tsx", "app/rackets/catalog-browser.tsx", "app/rankings/[slug]/ranking-picks.tsx", "app/rackets/[slug]/fit-live.tsx",
    "app/skin/home-match-skin.tsx", "app/skin/catalog-skin-browser.tsx", "app/skin/skin-product-live.tsx", "app/skin/brands-sort.tsx"]) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /useInstantView(<[^>]*>)?\(/, `${f} uses useInstantView`);
    assert.doesNotMatch(code(src), /history\.(push|replace)State/, `${f} writes the address only through the hook`);
  }
});

test("SkinRecs: every address its picks and filters write is a cached view, on its own keys", () => {
  const types = skin.typePages ?? [];
  const choices = [{}, ...SKIN_TYPES.map(s => ({ skin: s })), ...GOALS.map(g => ({ skin: "dry", goal: g })), { skin: "oily", sens: "1", acne: "1", finish: "matte", ff: "1" },
    { nc: "1", skin: "normal" }, ...TEXTURES.map(t => ({ tex: t, skin: "dry", goal: "hydrate" })), ...BUDGETS.map(b => ({ budget: b, skin: "combination" })),
    ...types.map(t => ({ type: t.slug, skin: "dry" }))].map(q => readSkinChoice(q, types));
  for (const c of choices) {
    const q = skinQuery(c), k = viewKey(q, SKIN_HOME_VIEW);
    assert.ok(k, `home ${q}`); assert.deepEqual(readViewKey(k!, SKIN_HOME_VIEW), Object.fromEntries(q));
    const p = skinQuery({ ...c, type: null, typeSlug: null });
    assert.ok(viewKey(p, SKIN_PRODUCT_VIEW), `product ${p}`);
  }
  for (const q of ["", "type=moisturizers", "skin=dry&sens=1&acne=1&finish=matte&texture=light&price=%24%24&ff=1&sort=reviews&show=40", "price=%24%24%24"])
    assert.ok(viewKey(new URLSearchParams(q), SKIN_CATALOG_VIEW), `catalogue ?${q}`);
  // Padel's picks are not SkinRecs' (the padel views 500'd there, #374), and free text is never cached.
  assert.equal(viewKey(new URLSearchParams("style=power&level=beginner"), SKIN_HOME_VIEW), null);
  assert.equal(viewKey(new URLSearchParams("q=cerave"), SKIN_CATALOG_VIEW), null);
});

// The browser ranks the rows a page sends with the server's functions: same order, same %, same product-page answers.
const profile = attrProfileFor(skin)!;
const sc = (score: number, n: number, plus?: number, minus?: number) => ({ score, n, plus, minus });
const attrs = (o: Record<string, ReturnType<typeof sc> | null>, facts: ProductAttrs["facts"] = {}): ProductAttrs => ({ scores: o, facts });
const products: { id: string; shape: string; name: string; signal: number | null; a: ProductAttrs }[] = [
  { id: "a", shape: "Moisturizer", name: "Alpha Cream", signal: 88, a: attrs({ suits_dry: sc(82, 14, 12, 1), suits_oily: sc(40, 8, 3, 4), hydration: sc(85, 20, 18, 2), gentle: sc(70, 9, 7, 2), texture: sc(80, 10), finish: null }, { fragrance_free: "free", price: "$$" }) },
  { id: "b", shape: "Moisturizer", name: "Beta Gel", signal: 81, a: attrs({ suits_oily: sc(78, 12, 10, 1), suits_dry: sc(45, 7, 3, 3), hydration: sc(60, 9, 6, 3), texture: sc(15, 12), breakouts: sc(70, 6, 5, 1) }, { price: "$" }) },
  { id: "c", shape: "Moisturizer", name: "Gamma Balm", signal: null, a: attrs({ suits_dry: sc(70, 3, 2, 0), gentle: sc(90, 4, 4, 0) }, { fragrance_free: "free", price: "$$$" }) },
  { id: "d", shape: "Serum", name: "Delta Serum", signal: 75, a: attrs({ suits_sensitive: sc(80, 9, 8, 1), gentle: sc(82, 11, 10, 1) }) },
];
const server = { data: { listed: products }, profile, attrs: new Map(products.map(p => [p.id, p.a])), signal: (id: string) => products.find(p => p.id === id)!.signal,
  match: (id: string, c: Parameters<typeof attrMatch>[4]) => { const p = products.find(x => x.id === id)!; return attrMatch(profile, p.a, p.shape, p.signal, c); } };
// What a page sends, as JSON (empty scores dropped, as app/skin/payload.ts does).
const wire: SkinWire[] = JSON.parse(JSON.stringify(products.map(p => ({ id: p.id, shape: p.shape, name: p.name, signal: p.signal,
  attrs: { scores: Object.fromEntries(Object.entries(p.a.scores).filter(([, v]) => v)), facts: p.a.facts } }))));

test("SkinRecs: the browser's ranking is the server's, for every pick", () => {
  const types = skin.typePages ?? [];
  const browser = wireCtx(profile, wire);
  for (const q of [{}, { skin: "dry" }, { skin: "oily", goal: "clear" }, { skin: "dry", goal: "hydrate", tex: "rich" }, { sens: "1" }, { skin: "combination", ff: "1" }, { budget: "$" }, { type: "moisturizers", skin: "oily" }]) {
    const c = readSkinChoice(q, types);
    const a = rankSkin(server, c).map(x => [x.r.id, x.pct, x.reason]), b = rankSkin(browser, c).map(x => [x.r.id, x.pct, x.reason]);
    assert.deepEqual(b, a, JSON.stringify(q));
  }
});

test("SkinRecs product page: the answers come from the picks alone", () => {
  const types = skin.typePages ?? [];
  const input: ProductInput = { self: wire[0], peers: wire.slice(1, 3), peerCards: { b: { short: "Beta Gel", photo: null, href: "/moisturizers/beta", total: 30 }, c: { short: "Gamma Balm", photo: null, href: "/moisturizers/gamma", total: 4 } },
    here: "/moisturizers/alpha", type: { slug: "moisturizers", label: "Moisturizers" }, catalogPath: "/products", many: "products", counts: { n: 40, positive: 30, mixed: 6, negative: 4 },
    page: null };
  const none = productView(profile, input, readSkinChoice({}, types));
  assert.equal(none.answered, false); assert.equal(none.pct, null); assert.equal(none.backHref, "/moisturizers");
  const dry = productView(profile, input, readSkinChoice({ skin: "dry", goal: "hydrate" }, types));
  assert.equal(dry.answered, true); assert.ok(dry.pct !== null && dry.pct >= 75, String(dry.pct)); assert.equal(dry.kind, "good");
  assert.equal(dry.backHref, "/?skin=dry&goal=hydrate#match");
  assert.ok(dry.yesL[0].forYou, "a 'for your skin' reason first");
  assert.equal(dry.tabs[0].href.endsWith("?skin=dry&goal=hydrate"), true);
  // The same picks give the same answers, however they arrive.
  assert.deepEqual(productView(profile, JSON.parse(JSON.stringify(input)), readSkinChoice({ goal: "hydrate", skin: "dry" }, types)), dry);
});

// Owner 2026-11-16: the advice is the product's written content in the expert voice; no counts in it.
test("SkinRecs product page: written content drives why yes / why not and the match box, with no counts", () => {
  const types = skin.typePages ?? [];
  const item = (title: string, t: string, f: string[], extra = {}) => ({ title, t, src: ["x1", "x2"], for: f as never, proof: "from forums & YouTube", ...extra });
  const base: ProductInput = { self: wire[0], peers: wire.slice(1, 3), peerCards: { b: { short: "Beta Gel", photo: null, href: "/moisturizers/beta", total: 30 }, c: { short: "Gamma Balm", photo: null, href: "/moisturizers/gamma", total: 4 } },
    here: "/moisturizers/alpha", type: { slug: "moisturizers", label: "Moisturizers" }, catalogPath: "/products", many: "products", counts: { n: 40, positive: 30, mixed: 6, negative: 4 }, page: null };
  const input: ProductInput = { ...base, page: { bottom: "A rich cream for dry skin. Oily skin should skip it.",
    yes: [item("Seals in moisture", "Leaves ==dry patches soft by morning==.", ["dry", "hydrate"]), item("Fragrance-free", "No scent, ==easy on reactive skin==.", ["sensitive"])],
    no: [item("Heavy on oily skin", "==Feels greasy by noon== on oily skin.", ["oily"], { alt: { slug: "beta", t: "The lighter gel.", src: ["x3", "x4"] }, altCard: { name: "Beta Gel", href: "/moisturizers/beta" } }),
      item("Can clog pores", "Breaks some people out, ==mostly with thick layers==.", ["acne"], { tip: { t: "Use a thin layer.", src: ["x1", "x5"] } })] } };
  const none = productView(profile, input, readSkinChoice({}, types));
  assert.equal(none.bottom, "A rich cream for dry skin. Oily skin should skip it.");
  assert.deepEqual(none.yesL.map(x => x.hl), ["dry patches soft by morning", "easy on reactive skin"]);
  const oily = productView(profile, input, readSkinChoice({ skin: "oily", goal: "clear" }, types));
  assert.equal(oily.noL[0].title, "Heavy on oily skin"); assert.ok(oily.noL[0].forYou);
  assert.equal(oily.consider, "Heavy on oily skin: feels greasy by noon on oily skin.");
  assert.deepEqual(oily.considerAlt, { name: "Beta Gel", href: "/moisturizers/beta" });
  const acne = productView(profile, input, readSkinChoice({ acne: "1" }, types));
  assert.ok(acne.noL.find(x => x.title === "Can clog pores")?.tip);
  // No entry: lines from the scores, worded without numbers; under 6 reports, "few reports so far".
  for (const q of [{}, { skin: "dry", goal: "hydrate" }, { skin: "oily", sens: "1" }]) {
    const v = productView(profile, base, readSkinChoice(q, types));
    for (const t of [v.why, v.consider, ...v.yesL.flatMap(x => [x.pre + x.hl + x.post, x.proof]), ...v.noL.flatMap(x => [x.pre + x.hl + x.post, x.proof]), ...v.self.map(x => x.note)])
      assert.ok(!t || !/\d/.test(t.replace(/SPF \d+/g, "")), `a count in: ${t}`);
  }
  const few = productView(profile, { ...base, counts: { n: 4, positive: 3, mixed: 1, negative: 0 } }, readSkinChoice({}, types));
  assert.equal(few.few, true); assert.deepEqual(few.yesL, []);
});
