import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { fixture } from "./fixture";
import { parseSnapshot, importSnapshot, verifySnapshot } from "../db/transfer";
import { rackets } from "../db/schema";
import { redirectedSlug } from "../db/racket-slugs";
import { planNameYears, applyNameYears } from "../db/name-years";
import type { getDb } from "../db/index";

const other = { ...fixture.tables.rackets[0], id: "racket-other", name: "Nox Other", slug: "nox-other", year: 2024 };
const snapshot = parseSnapshot({ ...fixture, tables: { ...fixture.tables, rackets: [...fixture.tables.rackets, other], racket_slug_redirects: [] } });
const now = new Date("2026-10-22T12:00:00Z");

test("dropping name years: names and slugs lose the year, ids and years stay, old slugs redirect", async () => {
  const plan = planNameYears(snapshot, now);
  assert.deepEqual(plan.problems, []);
  assert.deepEqual(plan.renames, [{ id: "racket-nox", oldName: "Nox Test 2025", newName: "Nox Test", oldSlug: "nox-test-2025", newSlug: "nox-test" }], "names without a year are left alone");
  const engine = new PGlite();
  try {
    for (const file of (await readdir("drizzle")).filter(f => f.endsWith(".sql")).sort()) await engine.exec(await readFile(`drizzle/${file}`, "utf8"));
    const db = drizzle(engine) as unknown as ReturnType<typeof getDb>;
    await importSnapshot(db, snapshot);
    await db.transaction(tx => applyNameYears(tx, plan, now));
    const rows = await db.select({ id: rackets.id, name: rackets.name, slug: rackets.slug, year: rackets.year }).from(rackets);
    assert.deepEqual(rows.find(r => r.id === "racket-nox"), { id: "racket-nox", name: "Nox Test", slug: "nox-test", year: 2025 });
    assert.equal(await redirectedSlug(db, "nox-test-2025"), "nox-test");
    await verifySnapshot(db, plan.after);
    // Run again: nothing left to rename.
    assert.deepEqual(planNameYears(plan.after, now).renames, []);
  } finally { await engine.close(); }
});

test("dropping name years refuses collisions and hand-picked slugs", () => {
  const clash = parseSnapshot({ ...snapshot, tables: { ...snapshot.tables, rackets: [...snapshot.tables.rackets, { ...other, id: "racket-plain", name: "Nox Test", slug: "nox-test" }] } });
  assert.match(planNameYears(clash, now).problems.join(), /collides with "Nox Test"/);
  const twoYears = parseSnapshot({ ...snapshot, tables: { ...snapshot.tables, rackets: [...snapshot.tables.rackets, { ...other, id: "racket-2026", name: "Nox Test 2026", slug: "nox-test-2026", year: 2026 }] } });
  assert.match(planNameYears(twoYears, now).problems.join(), /collides with "Nox Test 2025"/);
  const custom = parseSnapshot({ ...snapshot, tables: { ...snapshot.tables, rackets: [{ ...snapshot.tables.rackets[0], slug: "nox-special" }] } });
  assert.match(planNameYears(custom, now).problems.join(), /hand-picked slug/);
});
