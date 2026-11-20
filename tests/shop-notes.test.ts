import { test } from "node:test";
import assert from "node:assert/strict";
import searchOnly from "../db/shop/amazon-search-only.json";
import specNotes from "../db/shop/spec-notes.json";
import { niches } from "../lib/niche/all";

// Owner audit 2026-11-20: buy buttons that must stay a name search, and sourced extra spec rows.
const sites = new Set(Object.values(niches).map(n => n.id));
const copyOk = (t: string) => !/[—–]/.test(t) && !/\$\s?\d/.test(t) && !/\b(we|us|our|verdict)\b/i.test(t);

test("Amazon search-only lists name real sites, without repeats", () => {
  for (const [site, names] of Object.entries(searchOnly).filter(([k]) => !k.startsWith("_"))) {
    assert.ok(sites.has(site), site);
    const list = names as string[];
    assert.equal(new Set(list.map(n => n.toLowerCase())).size, list.length, site);
  }
});

test("spec notes are short label/value pairs in plain site copy", () => {
  for (const [site, bySlug] of Object.entries(specNotes).filter(([k]) => !k.startsWith("_"))) {
    assert.ok(sites.has(site), site);
    for (const rows of Object.values(bySlug as unknown as Record<string, [string, string][]>))
      for (const [label, value] of rows) { assert.ok(label.length <= 20 && value.length <= 110, value); assert.ok(copyOk(label) && copyOk(value), value); }
  }
});
