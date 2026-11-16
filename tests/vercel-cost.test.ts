import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Vercel cost cuts (owner 2026-11-16): previews only on request, long cache times with on-demand refresh.
const ROOT = resolve(import.meta.dirname, "..");
const builds = (env: Record<string, string>) => spawnSync("bash", ["scripts/vercel-ignore.sh"], { cwd: ROOT, env: { PATH: process.env.PATH!, ...env } }).status === 1;

test("previews build only on request (preview/… branch or [preview]), and only PadelRecs; production only the kept sites", () => {
  assert.equal(builds({ NICHE: "padel", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "fix-x", VERCEL_GIT_COMMIT_MESSAGE: "Fix x" }), false);
  assert.equal(builds({ NICHE: "padel", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "preview/fix-x", VERCEL_GIT_COMMIT_MESSAGE: "Fix x" }), true);
  assert.equal(builds({ NICHE: "padel", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "fix-x", VERCEL_GIT_COMMIT_MESSAGE: "Fix x [preview]" }), true);
  assert.equal(builds({ NICHE: "skin", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "preview/x", VERCEL_GIT_COMMIT_MESSAGE: "x" }), false);
  for (const n of ["padel", "pickleball", "tennis", "simracing", "discgolf", "skin"]) assert.equal(builds({ NICHE: n, VERCEL_ENV: "production" }), true, n);
  assert.equal(builds({ NICHE: "golf", VERCEL_ENV: "production" }), false);
});

test("cached pages refresh every 6–24 hours, never on a short timer", () => {
  for (const f of ["app/quick/[key]/page.tsx", "app/v/home/[key]/page.tsx", "app/v/rackets/[key]/page.tsx", "app/v/rankings/[slug]/[key]/page.tsx",
    "app/v/type/[slug]/[key]/page.tsx", "app/v/brand/[slug]/[key]/page.tsx", "app/v/racket/[slug]/[key]/page.tsx", "app/api/rank-items/route.ts", "app/api/racket-search/route.ts"]) {
    const s = Number(/export\s+const\s+revalidate\s*=\s*(\d+)/.exec(readFileSync(join(ROOT, f), "utf8"))?.[1]);
    assert.ok(s >= 6 * 3600 && s <= 24 * 3600, `${f}: revalidate ${s}`);
  }
});

test("/api/refresh refuses calls without the secret", async () => {
  const { POST } = await import("../app/api/refresh/route");
  const before = process.env.REFRESH_SECRET;
  process.env.REFRESH_SECRET = "s3cret";
  try {
    assert.equal((await POST(new Request("https://x.test/api/refresh", { method: "POST" }))).status, 401);
    assert.equal((await POST(new Request("https://x.test/api/refresh", { method: "POST", headers: { authorization: "Bearer nope" } }))).status, 401);
  } finally { if (before === undefined) delete process.env.REFRESH_SECRET; else process.env.REFRESH_SECRET = before; }
});
