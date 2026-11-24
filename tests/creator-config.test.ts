import { test } from "node:test";
import assert from "node:assert/strict";
import { configAxisFor, configCell, configGroupOf, configGroups, configLine, configSite, OTHER_GROUP } from "../lib/thread/creator-config";
import { attrsFor, howTitleFor, measuredLine, type ReviewConfig } from "../lib/thread/creators";
import { reviewFromRow, configFromRow } from "../db/creator-reviews";
import { creatorPlainSite, creatorPageOn } from "../lib/thread/sites";
import tldrs from "../db/creators/tldrs.json";
import wrapups from "../db/creators/reviewer-wrapups.json";
import laptopPages from "../db/creators/laptop-pages.json";
import axes from "../db/creators/laptop-config-axes.json";

const cfg = (label: string | null, fields: Record<string, string | null> = {}, group: string | null = null): ReviewConfig => ({ label, note: null, group, fields: Object.fromEntries(Object.entries(fields).filter(([, v]) => v)) as Record<string, string> });

test("laptop config: every card says what it covered", () => {
  assert.equal(configLine(cfg("Core Ultra 7 258V / 32GB / OLED")), "Reviewed: Core Ultra 7 258V / 32GB / OLED");
  assert.equal(configLine(cfg(null)), "Reviewed: config not stated");
  assert.equal(configLine(null), "Reviewed: config not stated");
  assert.equal(configCell(cfg("  ")), "Not stated");
  assert.ok(configSite("laptop") && !configSite("pickleball") && !configSite("skin"));
});

// The pilot models of CONFIG-GROUPING-PROPOSAL.md, with config labels as the staged cards give them.
test("laptop config: the pilot axes sort the staged configs into groups", () => {
  const t14s = configAxisFor("laptop", "lenovo-thinkpad-t14s-gen-6");
  const of = (a: typeof t14s, label: string, f: Record<string, string | null> = {}) => configGroupOf(cfg(label, f), a);
  assert.equal(of(t14s, "Snapdragon X Elite X1E-78-100 / 32GB / IPS", { cpu: "Snapdragon X Elite X1E-78-100" }), "Snapdragon");
  assert.equal(of(t14s, "Ryzen AI 7 Pro 360 / 32GB", { cpu: "Ryzen AI 7 Pro 360" }), "AMD");
  assert.equal(of(t14s, "Core Ultra 5 228V / 32GB / IPS", { cpu: "Core Ultra 5 228V" }), "Intel");
  const g14 = configAxisFor("laptop", "asus-rog-zephyrus-g14-2025");
  assert.equal(of(g14, "HX 370 / RTX 5070 Ti", { gpu: "RTX 5070 Ti 110W, 12GB VRAM" }), "RTX 5070 Ti");
  assert.equal(of(g14, "RTX 5080", { gpu: "RTX 5080" }), "RTX 5080");
  const um = configAxisFor("laptop", "asus-zenbook-14-oled-um3406");
  assert.equal(of(um, "Ryzen 7 8840HS / 16GB", { cpu: "Ryzen 7 8840HS" }), "Ryzen 7 8840HS");
  assert.equal(of(um, "Ryzen 7 350", { cpu: "Ryzen 7 350" }), "Ryzen AI 300");
  assert.equal(of(um, "Ryzen AI 7 350 / 32GB / OLED", { cpu: "Ryzen AI 7 350" }), "Ryzen AI 300");
  assert.equal(configGroupOf(cfg(null), um), OTHER_GROUP);
  // A hand-set group (creator_reviews.config_group) wins when it names one of the axis groups.
  assert.equal(configGroupOf(cfg("Ryzen 7 8840HS", { cpu: "Ryzen 7 8840HS" }, "Ryzen AI 300"), um), "Ryzen AI 300");
  assert.equal(configGroupOf(cfg("x"), null), null);
  assert.equal(configAxisFor("laptop", "apple-macbook-air-13-m4"), null);
  assert.equal(configAxisFor("pickleball", "lenovo-thinkpad-t14s-gen-6"), null);
});

test("laptop config: the chips show only with two or more groups, in the axis order, Other last", () => {
  const um = configAxisFor("laptop", "asus-zenbook-14-oled-um3406");
  const rs = [cfg("Ryzen AI 7 350 / 16GB", { cpu: "Ryzen AI 7 350" }), cfg("Ryzen 7 8840HS", { cpu: "Ryzen 7 8840HS" }), cfg(null), cfg("Ryzen 7 350", { cpu: "Ryzen 7 350" })].map(config => ({ config }));
  assert.deepEqual(configGroups(rs, um), [{ label: "Ryzen 7 8840HS", n: 1 }, { label: "Ryzen AI 300", n: 2 }, { label: OTHER_GROUP, n: 1 }]);
  assert.deepEqual(configGroups(rs.slice(0, 1), um), []);
  assert.deepEqual(configGroups(rs, null), []);
  for (const [slug, a] of Object.entries(axes)) {
    assert.ok((laptopPages as string[]).includes(slug), slug);
    for (const g of a.groups) assert.doesNotThrow(() => new RegExp(g.match, "i"), `${slug} ${g.label}`);
  }
});

test("laptop creator page: its own trait words, not paddle words", () => {
  assert.deepEqual(attrsFor("laptop").map(([k]) => k), ["performance", "thermals", "battery", "display", "keyboard", "build", "portability", "value"]);
  assert.deepEqual(attrsFor("pickleball").map(([k]) => k), ["power", "control", "spin", "pop", "sweet", "comfort", "durability"]);
  assert.equal(howTitleFor("laptop"), "How it holds up");
  assert.equal(howTitleFor("pickleball"), "How it plays");
  assert.equal(howTitleFor("skin"), "How it works");
  assert.equal(measuredLine({ "Battery, looped movie at 200 nits": "almost 19 hours", "Sustained power draw": "32 W" }, "laptop"),
    "Battery, looped movie at 200 nits: almost 19 hours · Sustained power draw: 32 W");
  assert.equal(measuredLine({ "Battery, looped movie at 200 nits": "almost 19 hours", swing_weight: 111 }, "pickleball"), "Swing weight 111");
  assert.ok(creatorPlainSite("laptop") && creatorPageOn("laptop") && !creatorPlainSite("pickleball") && !creatorPlainSite("skin"));
});

test("laptop creator rows: the 0041 config columns become the card's config; other rows have none", () => {
  const base = { id: "cr_1", racket_id: "r1", url: "https://example.com/r", platform: "blog", review_type: "review", creator: "A Reviewer",
    stance: "pos", summary: "Long battery life. A dim screen.", attributes: { battery: "Excellent", display: "Okay", power: "Great" } };
  const plain = reviewFromRow(base);
  assert.equal("config" in plain, false);
  const row = { ...base, config: JSON.stringify({ cpu: "Ryzen 7 350", gpu: null, ram: "16GB" }), config_label: "Ryzen 7 350 / 16GB", config_note: null, config_group: null };
  assert.deepEqual(configFromRow(row), { label: "Ryzen 7 350 / 16GB", note: null, group: null, fields: { cpu: "Ryzen 7 350", ram: "16GB" } });
  assert.deepEqual(reviewFromRow(row).config, configFromRow(row));
});

test("laptop page text: TL;DRs and wrap-ups cover most listed products and keep the copy rules", () => {
  const t = (tldrs as Record<string, Record<string, string>>).laptop!, w = (wrapups as Record<string, Record<string, unknown>>).laptop!;
  assert.ok(Object.keys(t).length >= 80 && Object.keys(w).length >= 80);
  // A few written pages are for models not in the catalogue yet (2026 models); they wait for the catalogue.
  assert.ok((laptopPages as string[]).filter(slug => t[slug]).length >= 75);
  const text = JSON.stringify([t, w]);
  assert.doesNotMatch(text, /[—–]/);
  assert.doesNotMatch(text, /\bverdict\b/i);
  assert.doesNotMatch(text, /\b(we|us|our)\b/i);
  // The other sites' entries are untouched by the laptop ones.
  assert.ok(Object.keys((tldrs as Record<string, unknown>).pickleball as object).length > 0);
});
