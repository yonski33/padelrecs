import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { revalidationAuthorized } from "../lib/revalidate-secret";

type Rule = { source: string; destination?: string; has?: { type: string; key: string }[]; missing?: { type: string; key: string }[]; headers?: { key: string; value: string }[] };

// next.config.ts reads NICHE when it loads; import it fresh per niche.
async function configFor(niche: string) {
  const before = process.env.NICHE;
  process.env.NICHE = niche;
  try { return (await import(`../next.config.ts?cache=${niche}`)).default; }
  finally { if (before === undefined) delete process.env.NICHE; else process.env.NICHE = before; }
}

test("filtered and sorted home, catalogue and type pages go to their dynamic twins; plain addresses stay static", async () => {
  const config = await configFor("skin");
  const { beforeFiles } = await config.rewrites() as { beforeFiles: Rule[] };
  const target = (source: string, key: string) => beforeFiles.find(r => r.source === source && r.has?.[0]?.key === key)?.destination;
  assert.equal(target("/", "source"), "/filtered");
  assert.equal(target("/", "show"), "/filtered");
  assert.equal(target("/products", "brand"), "/filtered/catalog");
  assert.equal(target("/products", "sort"), "/filtered/catalog");
  assert.equal(target("/cleansers", "sort"), "/filtered/types/cleansers");
  // Every rewrite needs a query parameter, so plain (or ?utm_…) visits are served from the static page.
  assert(beforeFiles.every(r => r.has?.length === 1 && r.has[0].type === "query"));
  assert(!beforeFiles.some(r => r.has?.[0]?.key.startsWith("utm")));
  // Product pages are never rewritten: their ?source=/?sort= are read in the browser.
  assert(!beforeFiles.some(r => r.source.includes(":")));
});

test("only dynamic responses get the CDN header; static pages keep Next's own cache headers", async () => {
  for (const niche of ["padel", "pickleball"]) {
    const config = await configFor(niche);
    const headers = await config.headers() as Rule[];
    assert(headers.every(h => h.has?.[0]?.type === "query" || ["/add-review", "/api/racket-search"].includes(h.source)), niche);
    assert(headers.every(h => h.missing?.some(m => m.key === "rsc")), niche);
    assert(!headers.some(h => h.source.includes(":slug")), niche);
  }
});

test("public pages are static with a 5-minute revalidate, and the layout no longer forces dynamic rendering", async () => {
  const cached = ["app/page.tsx", "app/rackets/page.tsx", "app/rackets/[slug]/page.tsx", "app/rackets/[slug]/opengraph-image.tsx", "app/brands/page.tsx", "app/brands/[slug]/page.tsx", "app/types/[slug]/page.tsx", "app/sitemap.ts"];
  for (const file of cached) {
    const source = await readFile(file, "utf8");
    assert.match(source, /export const revalidate = 300;/, file);
    assert.doesNotMatch(source, /force-dynamic|searchParams\b(?!=)/, file);
  }
  assert.doesNotMatch(await readFile("app/layout.tsx", "utf8"), /force-dynamic|cookies\(|headers\(/);
  // Per-visitor pages stay dynamic.
  for (const file of ["app/admin/page.tsx", "app/admin/edit-review/page.tsx", "app/add-review/page.tsx", "app/api/racket-search/route.ts"]) assert.match(await readFile(file, "utf8"), /force-dynamic/, file);
});

test("the proxy (a Frankfurt function) only runs on signed-in paths", async () => {
  const source = await readFile("proxy.ts", "utf8");
  assert.match(source, /matcher:\["\/admin\/:path\*","\/auth\/:path\*","\/api\/admin\/:path\*"\]/);
});

test("revalidation needs the exact bearer secret", () => {
  assert.equal(revalidationAuthorized("Bearer s3cret", "s3cret"), true);
  assert.equal(revalidationAuthorized("Bearer s3cret", undefined), false);
  assert.equal(revalidationAuthorized("Bearer s3cret", ""), false);
  assert.equal(revalidationAuthorized("Bearer wrong", "s3cret"), false);
  assert.equal(revalidationAuthorized("s3cret", "s3cret"), false);
  assert.equal(revalidationAuthorized(null, "s3cret"), false);
});
