import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAttribution } from "../lib/voice";
import { skinPages, skinTags, skinMatters, sourceKinds, splitMark } from "../lib/skin-page";
import { readSkinChoice } from "../lib/skin-choice";
import { slugify } from "../lib/slug";
import catalog from "../db/catalogs/skin.json";

const pages = skinPages();
const slugs = new Set((catalog as { products: { name: string; slug?: string }[] }).products.map(p => p.slug ?? slugify(p.name)));
const lines = (slug: string) => { const e = pages[slug];
  return [e.bottom, ...[...e.yes, ...e.no].flatMap(x => [x.title, x.t, x.tip?.t, x.alt?.t])].filter((t): t is string => !!t); };

// Owner 2026-11-16: skin advice in the expert voice, as for padel (#383): plain statements, no "N users said", no medical claims.
test("skin page copy says things plainly, cosmetically, and with no counts", () => {
  const bad: string[] = [];
  const BAN = /reddit|% (liked|loved)|\bwe\b|\bour\b|\btested\b|\bcures?\b|\btreats?\b|\bheals?\b|prescription|clinical|dermatologist|doctor|eczema|rosacea|psoriasis|dermatitis|acne-prone/i;
  for (const slug of Object.keys(pages)) for (const t of lines(slug)) {
    if (hasAttribution(t) || /\b(people|users|reviewers)\s+(say|find|report|call)\b/i.test(t)) bad.push(`${slug} (who said it): ${t}`);
    if (BAN.test(t.replace(/==/g, ""))) bad.push(`${slug} (banned word): ${t}`);
  }
  assert.deepEqual(bad, []);
});

test("skin page entries: real products, the shape the page shows, every line backed by 2+ reports", () => {
  const bad: string[] = [];
  for (const [slug, e] of Object.entries(pages)) {
    if (!slugs.has(slug)) bad.push(`${slug}: not in the catalog`);
    const sents = e.bottom.split(/(?<=[.!?])\s+/);
    if (sents.length > 3 || sents.some(s => s.length > 105)) bad.push(`${slug}: bottom line`);
    for (const side of [e.yes, e.no]) {
      if (side.length < 1 || side.length > 4) bad.push(`${slug}: ${side.length} items`);
      for (const it of side) {
        if (it.t.split("==").length !== 3) bad.push(`${slug}: one highlight: ${it.t}`);
        if (it.t.replace(/==/g, "").length > 105) bad.push(`${slug}: long: ${it.t}`);
        for (const [what, src] of [["item", it.src], ["tip", it.tip?.src], ["alt", it.alt?.src]] as const)
          if (src && new Set(src).size < 2) bad.push(`${slug}: ${what} needs 2+ sources: ${it.title}`);
        if (it.alt && (!slugs.has(it.alt.slug) || it.alt.slug === slug)) bad.push(`${slug}: try instead ${it.alt.slug} isn't another catalog product`);
      }
    }
    if (/value|cheap|price|afford/i.test(e.yes[0]?.title ?? "")) bad.push(`${slug}: price leads Why yes`);
  }
  assert.deepEqual(bad, []);
});

test("skin picks become item tags; 'for your skin' goes to the items that meet them", () => {
  const types = [{ slug: "moisturizers", shape: "Moisturizer" }];
  assert.deepEqual(skinTags(readSkinChoice({ skin: "oily", goal: "clear", sens: "1" }, types)), ["oily", "sensitive", "acne", "clear"]);
  const items = [{ title: "A", t: "x", src: [], for: ["dry" as const] }, { title: "B", t: "x", src: [], for: ["oily" as const, "acne" as const] }, { title: "C", t: "x", src: [], for: ["clear" as const] }];
  assert.deepEqual([...skinMatters(items, ["oily", "acne", "clear"])], ["B", "C"]);
  assert.equal(sourceKinds(["a", "b", "c"], id => ({ a: "Reddit", b: "YouTube", c: "Blog" })[id]), "from forums, YouTube & blogs");
  assert.equal(sourceKinds(["a", "b"], () => "Reddit"), "from forums");
  assert.deepEqual(splitMark("Leaves ==dry skin soft== by morning."), { pre: "Leaves ", hl: "dry skin soft", post: " by morning." });
});
