import { test } from "node:test";
import assert from "node:assert/strict";
import { V11_SITES } from "../lib/v11-site";
import { V11_HEADLINES } from "../lib/v11-words";
import { COFFEE_FIT } from "../lib/coffee-fit";

const cf = V11_SITES.coffee, ok = (t: string) => { assert.ok(t.length <= 105, `${t.length}: ${t}`); assert.ok(!/—/.test(t), `em dash: ${t}`); };

test("coffee v11: per-type bars, setup headline, give-up words for every shown trait", () => {
  const bands = cf.bands as (shape: string | null) => [string, string][];
  assert.deepEqual(bands("Espresso machine").map(b => b[0]), ["quality", "consistency", "steam", "ease", "build", "value"]);
  assert.deepEqual(bands("Grinder").map(b => b[0]), ["quality", "consistency", "retention", "quiet", "ease", "value"]);
  assert.equal(V11_HEADLINES.coffee.no, "Probably not for your setup");
  for (const t of COFFEE_FIT.traits.filter(x => !x.hidden)) assert.ok(cf.giveUp[t.key], t.key);
});

test("coffee build cards: from the maker specs, short, status first", () => {
  const titles = (slug: string, shape: string) => cf.builds({ slug, shape }).map(c => { ok(c.title); ok(c.line); return c.title; });
  assert.deepEqual(titles("lelit-bianca-v3", "Espresso machine").slice(0, 2), ["Dual boiler", "Flow control"]);
  assert.ok(titles("breville-barista-express", "Espresso machine").includes("Built-in grinder"));
  assert.ok(titles("fellow-ode-gen-2", "Grinder").includes("Filter only"));
  assert.equal(titles("decent-bengle", "Espresso machine")[0], "Not shipping yet");
  assert.equal(titles("profitec-go", "Espresso machine")[0], "Discontinued");
  assert.ok(titles("acaia-lunar", "Scale").includes("Fits a drip tray"));
  assert.ok(titles("fellow-clyde", "Kettle").includes("Standard spout"));
});
