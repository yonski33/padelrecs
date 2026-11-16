#!/usr/bin/env node
// Warms a site's page cache after a production deploy (owner 2026-11-16: first visits after a merge took 8–49 s on the v2
// sites, because a new deployment starts with an empty cache). Reads the site's sitemap, picks its top pages by priority
// (home, catalogue, rankings, then products) and visits each once, so the next visitor gets the cached copy.
//   node scripts/warm.mjs https://www.pickleballrecs.com [limit=50]
// The quick-match home views (/?level=…) are built at deploy time already, so they are skipped. The first page goes alone
// (it loads the catalogue into one server instance); the rest go a few at a time, so few instances pay that load.

const PARALLEL = 3, TIMEOUT_MS = 90_000;

/** The sitemap's pages, best first: the site's own pages (home, catalogue, rankings, type pages) before product pages, then
 *  higher priority, then sitemap order. Quick-match home views and other hosts are dropped. */
export function pickPages(xml, origin, limit) {
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m, i) => {
    const loc = /<loc>([^<]+)<\/loc>/.exec(m[1])?.[1]?.replaceAll("&amp;", "&");
    const priority = Number(/<priority>([^<]+)<\/priority>/.exec(m[1])?.[1] ?? 0.5);
    return { loc, priority, i };
  }).filter(e => e.loc && e.loc.startsWith(origin + "/"));
  const quick = (loc) => { const u = new URL(loc); return u.pathname === "/" && u.search !== "" && !u.searchParams.has("type"); };
  const group = (loc) => { const p = new URL(loc).pathname.split("/").filter(Boolean); return p.length <= 1 || p[0] === "rankings" ? 0 : 1; };
  return entries.filter(e => !quick(e.loc)).sort((a, b) => group(a.loc) - group(b.loc) || b.priority - a.priority || a.i - b.i).slice(0, limit).map(e => e.loc);
}

async function visit(url) {
  const t = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "recs-cache-warm/1" } });
    await res.arrayBuffer();
    return { url, status: res.status, cache: res.headers.get("x-vercel-cache") ?? "-", ms: Date.now() - t };
  } catch (e) { return { url, status: 0, cache: String(e?.name ?? e), ms: Date.now() - t }; }
}

async function main() {
  const [base, limitArg] = process.argv.slice(2);
  if (!base || !/^https:\/\/[a-z0-9.-]+$/.test(base)) { console.error("usage: node scripts/warm.mjs https://www.<site>.com [limit]"); process.exit(2); }
  const LIMIT = Number(limitArg ?? 50);
  const res = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) { console.error(`sitemap: HTTP ${res.status}`); process.exit(1); }
  const pages = pickPages(await res.text(), base, LIMIT);
  const out = [await visit(pages[0])];
  for (let i = 1; i < pages.length; i += PARALLEL) out.push(...await Promise.all(pages.slice(i, i + PARALLEL).map(visit)));
  for (const r of out) console.log(`${String(r.status).padEnd(4)}${r.cache.padEnd(10)}${String(r.ms).padStart(6)} ms  ${r.url.slice(base.length) || "/"}`);
  const failed = out.filter(r => r.status !== 200);
  console.log(`${out.length} pages warmed on ${base}, ${failed.length} not 200`);
  // A failed page is reported, not fatal: the warm-up only saves the next visitor a wait.
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
