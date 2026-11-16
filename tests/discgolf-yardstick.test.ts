import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { discgolf } from "../lib/niche/discgolf";
import { yardstickResults, readPick, type Yardstick } from "../lib/discgolf-yardstick";
import { rankHome, type RankItem } from "../lib/home-rank";

// DiscGolfRecs' quick match on the shared engine (PM 2026-11-16, option A): the home's own ranking over the stored items
// (tests/fixtures/engine-discgolf.json, scripts/discgolf-engine-fixture.mts --write) must hold the disc golf yardstick
// (tests/fixtures/engine-yardstick-discgolf.json: a draft for the owner / expert to correct).
const fx = JSON.parse(readFileSync(new URL("./fixtures/engine-discgolf.json", import.meta.url), "utf8")) as { names: Record<string, string>; items: RankItem[] };
const Y = JSON.parse(readFileSync(new URL("./fixtures/engine-yardstick-discgolf.json", import.meta.url), "utf8")) as Yardstick;
const setup = { ...discgolf.finder!, levelGate: discgolf.fit?.levelGate, engine: discgolf.fit?.engine };
const BAD = discgolf.tags.filter(t => t.tone === "neg").map(t => t.label);

test("disc golf: the yardstick holds on the home ranking", () => {
  const res = yardstickResults(fx.items, setup, BAD, Y, id => fx.names[id] ?? id);
  const bad = res.filter(r => !r.ok).map(r => r.what);
  assert.deepEqual(bad, []);
});

test("disc golf: a picked type is a hard filter", () => {
  for (const kind of ["putter", "midrange", "fairway", "distance"]) {
    const { rows } = rankHome(fx.items, setup, BAD, readPick(`${kind}.-.any.0`), false);
    assert.ok(rows.length > 0, kind);
    const byId = new Map(fx.items.map(x => [x.id, x]));
    assert.ok(rows.every(r => byId.get(r.id)?.kind === kind), `${kind}: only ${kind}s`);
  }
});
