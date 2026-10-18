import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { fixture } from "./fixture";
import { parseSnapshot, importSnapshot, verifySnapshot } from "../db/transfer";
import { rackets } from "../db/schema";
import { changeRacketSlug, cleanSlug, oldSlugs, redirectedSlug } from "../db/racket-slugs";
import type { getDb } from "../db/index";

type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const file of (await readdir("drizzle")).filter(f => f.endsWith(".sql")).sort()) await engine.exec(await readFile(`drizzle/${file}`, "utf8"));
  const db = drizzle(engine) as unknown as Database;
  await importSnapshot(db, parseSnapshot(fixture));
  await db.insert(rackets).values({ id: "racket-other", brandId: "brand-nox", name: "Nox Other 2025", slug: "nox-other-2025", year: 2025, createdAt: "2026-10-01T00:00:00Z" });
  return { engine, db };
}
const slugOf = async (db: Database, id: string) => (await db.select({ slug: rackets.slug }).from(rackets).where(eq(rackets.id, id)))[0].slug;

test("changing a racket slug keeps the old address as a redirect, and changing back restores it", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(cleanSlug("  Nox Test 2025 — Fixed! "), "nox-test-2025-fixed");
    assert.equal(await db.transaction(tx => changeRacketSlug(tx, "racket-nox", "Nox Test Fixed 2025")), "changed");
    assert.equal(await slugOf(db, "racket-nox"), "nox-test-fixed-2025");
    assert.equal(await redirectedSlug(db, "nox-test-2025"), "nox-test-fixed-2025");
    assert.deepEqual(await oldSlugs(db, "racket-nox"), ["nox-test-2025"]);
    assert.equal(await db.transaction(tx => changeRacketSlug(tx, "racket-nox", "nox-test-fixed-2025")), "unchanged");
    assert.equal(await db.transaction(tx => changeRacketSlug(tx, "racket-nox", "nox-test-2025")), "changed");
    assert.equal(await redirectedSlug(db, "nox-test-2025"), null);
    assert.equal(await redirectedSlug(db, "nox-test-fixed-2025"), "nox-test-2025");
  } finally { await engine.close(); }
});

test("a slug used by another racket or with nothing usable is refused", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(await db.transaction(tx => changeRacketSlug(tx, "racket-nox", "nox-other-2025")), "taken");
    assert.equal(await db.transaction(tx => changeRacketSlug(tx, "racket-nox", "!!!")), "invalid");
    assert.equal(await db.transaction(tx => changeRacketSlug(tx, "missing", "anything")), "missing");
    assert.equal(await slugOf(db, "racket-nox"), "nox-test-2025");
  } finally { await engine.close(); }
});

test("slug redirects survive export snapshots", async () => {
  const { engine, db } = await setup();
  try {
    const snapshot = parseSnapshot({ ...structuredClone(fixture), tables: { ...structuredClone(fixture).tables, racket_slug_redirects: [{ slug: "old-nox-test", racket_id: "racket-nox", created_at: "2026-10-18T00:00:00Z" }] } });
    await importSnapshot(db, snapshot);
    assert.equal(await redirectedSlug(db, "old-nox-test"), "nox-test-2025");
    assert.equal((await verifySnapshot(db, snapshot)).slugRedirects, 1);
    assert.throws(() => parseSnapshot({ ...structuredClone(fixture), tables: { ...structuredClone(fixture).tables, racket_slug_redirects: [{ slug: "x", racket_id: "nope", created_at: "2026-10-18T00:00:00Z" }] } }), /missing racket/);
  } finally { await engine.close(); }
});
