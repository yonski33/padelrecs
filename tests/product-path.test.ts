import { test } from "node:test";
import assert from "node:assert/strict";

// next.config.ts reads NICHE when it loads; import it fresh per niche.
async function configFor(niche: string | undefined) {
  const before = process.env.NICHE;
  if (niche) process.env.NICHE = niche; else delete process.env.NICHE;
  try { return (await import(`../next.config.ts?niche=${niche ?? "default"}`)).default; }
  finally { if (before === undefined) delete process.env.NICHE; else process.env.NICHE = before; }
}

test("padel serves /rackets with no redirects; only icons are mapped", async () => {
  const config = await configFor(undefined);
  assert.equal(config.env.NICHE, "padel");
  const icons = (niche: string) => ["favicon.ico", "icon.svg", "apple-icon.png"].map(file => ({ source: `/${file}`, destination: `/niches/${niche}/${file}` }));
  assert.deepEqual(await config.rewrites(), icons("padel"));
  assert.deepEqual(await config.redirects(), []);
  const cached = (await config.headers()).map((h: { source: string }) => h.source);
  assert(cached.includes("/rackets") && cached.includes("/rackets/:slug*"));
});

test("pickleball serves /paddles and redirects old /rackets addresses", async () => {
  const config = await configFor("pickleball");
  assert.equal(config.env.NICHE, "pickleball");
  const icons = ["favicon.ico", "icon.svg", "apple-icon.png"].map(file => ({ source: `/${file}`, destination: `/niches/pickleball/${file}` }));
  assert.deepEqual(await config.rewrites(), [...icons, { source: "/paddles", destination: "/rackets" }, { source: "/paddles/:path*", destination: "/rackets/:path*" }]);
  const redirects = await config.redirects();
  assert(redirects.some((r: { source: string; destination: string; permanent: boolean }) => r.source === "/rackets/:slug" && r.destination === "/paddles/:slug" && r.permanent));
  // Share images keep their generated /rackets/<slug>/opengraph-image address, so no catch-all redirect.
  assert(!redirects.some((r: { source: string }) => r.source.includes(":path")));
  const cached = (await config.headers()).map((h: { source: string }) => h.source);
  assert(cached.includes("/paddles") && cached.includes("/paddles/:slug*"));
});

test("an unknown NICHE fails at config load", async () => {
  await assert.rejects(configFor("curling"), /Unknown NICHE/);
});
