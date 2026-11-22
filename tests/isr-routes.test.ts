import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { niches } from "../lib/niche/all";

// Cache guard (owner 2026-11-16: first visits on the v2 sites took 8–49 s). On every v2 site the home, the catalogue, a
// ranking and a product page must be served from a cached page (proxy.ts → app/quick or app/v/…, lib/view-key.ts), and
// those pages must stay ISR: a revalidate time, generateStaticParams, and nothing they import that makes Next render per
// request (next/headers, connection(), noStore, force-dynamic). A new site design that skips this fails here.
const ROOT = resolve(import.meta.dirname, "..");
const V2 = Object.values(niches).filter(n => n.design === "v2").map(n => n.id);
const PAGE: [RegExp, string][] = [
  [/^\/quick\/[^/]+$/, "app/quick/[key]/page.tsx"],
  [/^\/v\/home\/[^/]+$/, "app/v/home/[key]/page.tsx"],
  [/^\/v\/rackets\/[^/]+$/, "app/v/rackets/[key]/page.tsx"],
  [/^\/v\/rankings\/[^/]+\/[^/]+$/, "app/v/rankings/[slug]/[key]/page.tsx"],
  [/^\/v\/racket\/[^/]+\/[^/]+$/, "app/v/racket/[slug]/[key]/page.tsx"],
  // PadelRecs' Thread look (lib/thread/look.ts THREAD_DEFAULT): the same addresses, served from the Thread pages.
  [/^\/thread$/, "app/thread/page.tsx"],
  [/^\/thread\/rackets$/, "app/thread/rackets/page.tsx"],
  [/^\/thread\/rankings\/[^/]+$/, "app/thread/rankings/[slug]/page.tsx"],
  [/^\/thread\/rackets\/[^/]+$/, "app/thread/rackets/[slug]/page.tsx"],
  [/^\/thread\/brands$/, "app/thread/brands/page.tsx"],
  [/^\/thread\/brands\/[^/]+$/, "app/thread/brands/[slug]/page.tsx"],
  // The creator-page preview (?view=creators, lib/thread/sites.ts CREATOR_PAGE_SITES).
  [/^\/thread\/creators\/[^/]+$/, "app/thread/creators/[slug]/page.tsx"],
];
const DYNAMIC: [RegExp, string][] = [
  [/from\s+["']next\/headers["']/, "next/headers"],
  [/\bconnection\(\)/, "connection()"],
  [/unstable_noStore|\bnoStore\(\)/, "noStore()"],
];
// Route segment config counts only in the page file itself (an imported page's own config doesn't carry over).
const SEGMENT: [RegExp, string][] = [
  [/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/, "force-dynamic"],
  [/export\s+const\s+revalidate\s*=\s*0\b/, "revalidate = 0"],
  [/export\s*\{[^}]*\b(?:dynamic|revalidate)\b[^}]*\}\s*from/, "re-exported segment config"],
];

function file(spec: string, from: string): string | null {
  const base = resolve(dirname(from), spec);
  for (const f of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(f) && !f.endsWith("/") && /\.tsx?$/.test(f)) return f;
  return null;
}
/** Every file a page reaches through relative imports (static and dynamic), with the dynamic-rendering calls each holds. */
function dynamicUses(page: string): string[] {
  const seen = new Set<string>(), found: string[] = [], todo = [join(ROOT, page)];
  while (todo.length) {
    const f = todo.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    const src = readFileSync(f, "utf8");
    for (const [re, what] of f === join(ROOT, page) ? [...DYNAMIC, ...SEGMENT] : DYNAMIC) if (re.test(src)) found.push(`${f.slice(ROOT.length + 1)}: ${what}`);
    // Type-only imports never run.
    for (const m of src.matchAll(/(?:import|export)\s+(?!type\b)[^"';]*?from\s+["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
      const next = file(m[1] ?? m[2], f);
      if (next) todo.push(next);
    }
  }
  return found;
}

for (const id of V2) {
  test(`${id}: home, catalogue, ranking and product pages are served from cached (ISR) pages`, () => {
    const out = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "tests/isr/proxy-routes.mts"],
      { cwd: ROOT, env: { ...process.env, NICHE: id }, encoding: "utf8" });
    const routes = JSON.parse(out.trim().split("\n").at(-1)!) as Record<string, string | null>;
    for (const [name, to] of Object.entries(routes)) {
      assert.ok(to, `${id} ${name}: proxy.ts does not rewrite it to a cached view, so it renders on every request`);
      const page = PAGE.find(([re]) => re.test(to))?.[1];
      assert.ok(page, `${id} ${name}: rewritten to ${to}, which is not one of the cached view pages`);
      const src = readFileSync(join(ROOT, page), "utf8");
      assert.match(src, /export\s+const\s+revalidate\s*=\s*[1-9]\d*/, `${page}: needs export const revalidate`);
      // A page without a [param] is built whole with the site; one with a param lists its pages.
      if (page.includes("[")) assert.match(src, /export\s+(?:async\s+)?function\s+generateStaticParams|export\s+const\s+generateStaticParams/, `${page}: needs generateStaticParams`);
    }
  });
}

test("the cached view pages import nothing that forces a render per request", () => {
  for (const page of new Set(PAGE.map(([, p]) => p))) assert.deepEqual(dynamicUses(page), [], page);
});

test("the racket pages' engine items come from one cached address, not inside each page", () => {
  const route = readFileSync(join(ROOT, "app/api/rank-items/route.ts"), "utf8");
  assert.match(route, /export\s+const\s+revalidate\s*=\s*[1-9]\d*/, "app/api/rank-items: needs export const revalidate");
  assert.deepEqual(dynamicUses("app/api/rank-items/route.ts"), []);
  // Built on every site: an attribute-profile site (SkinRecs) has no match context, so it must answer before building one
  // (the SkinRecs production build failed on it, 2026-11-16).
  assert.match(route, /attrProfileFor\(niche\)[^\n]*return Response\.json\(\[\]\)/);
  // A page whose address has picks sends only the server's answer for them (lib/rank-seed.ts), never the items.
  const fit = readFileSync(join(ROOT, "app/rackets/[slug]/racket-fit.tsx"), "utf8");
  assert.doesNotMatch(fit, /<Fit(?:Box|Compare|Alts)\b[^>]*\bitems=/, "the fit components read the items from FitPicks");
  assert.doesNotMatch(fit, /<FitPicks\b[^>]*\bitems=/);
  assert.match(fit, /<FitPicks\b[^>]*seed=\{picked \? rankSeed\(/);
});
