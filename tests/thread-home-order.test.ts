import { test } from "node:test";
import assert from "node:assert/strict";
import { familyRowIds } from "../lib/compare-pairs";

// Regression (owner 2026-11-19): the Thread home and lists showed superseded years (Siux Electra Pro ST4 2025 at #1) that
// the classic pages hide. Both now use one rule (lib/compare-pairs.ts familyRowIds) and the home uses the classic order.
const p = (id: string, name: string, year: number) => ({ id, name, year, brandId: "b", slug: id }) as never;

test("one row per model: the newest year with enough reports, else the newest", () => {
  const listed = [p("st4-25", "Siux Electra Pro ST4", 2025), p("st4-26", "Siux Electra Pro ST4", 2026), p("ctrl-26", "Adidas Metalbone CTRL", 2026), p("ctrl-25", "Adidas Metalbone CTRL", 2025)];
  const reports: Record<string, number> = { "st4-25": 120, "st4-26": 40, "ctrl-26": 2, "ctrl-25": 60 };
  const ids = familyRowIds(listed, (x: { id: string }) => (reports[x.id] ?? 0) >= 10);
  assert.deepEqual([...ids].sort(), ["ctrl-25", "st4-26"]);
});

test("the Thread home top 10 is the classic home's top 10, every one a current row", { skip: !process.env.DATABASE_URL && "needs the database" }, async () => {
  const [{ homePayload, defaultHomeIds, homeSeed }, { threadRows, homeTop }, { DEFAULT_CHOICE }] = await Promise.all([import("../app/home-payload"), import("../app/thread/data"), import("../lib/quick-match")]);
  const [payload, { rows }] = await Promise.all([homePayload(), threadRows()]);
  const classic = homeSeed(payload, DEFAULT_CHOICE, false).rows.slice(0, 10).map(r => r.id);
  const thread = homeTop(rows, defaultHomeIds(payload, DEFAULT_CHOICE)).map(r => r.id);
  assert.deepEqual(thread, classic);
  for (const id of thread) assert.equal(rows.get(id)?.current, true, rows.get(id)?.name);
});
