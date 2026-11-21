import { test } from "node:test";
import assert from "node:assert/strict";
import { PADEL_COPY } from "../lib/thread/copy";
import { infoV3, V3_SWAPS, V3_DROP } from "../lib/thread/info-v3";

// PadelRecs info pages v3: every swap still matches today's copy, and no 0-100 score is left on the v3 pages.
test("info v3: score lines reworded, nothing else lost", () => {
  for (const key of ["about", "affiliate"] as const) {
    const c = PADEL_COPY.INFO.find(x => x.key === key)!, all = [...c.intro, ...c.sections.flatMap(s => s.body)].join("\n");
    for (const [from] of V3_SWAPS[key]) assert.ok(all.includes(from), `${key}: ${from}`);
    const v = infoV3(c), out = [...v.intro, ...v.sections.flatMap(s => s.body)].join("\n");
    assert.doesNotMatch(out, /\bscores?\b|0 to 100/i, key);
    assert.equal(v.sections.length, c.sections.length - (V3_DROP[key]?.length ?? 0));
  }
  const contact = PADEL_COPY.INFO.find(x => x.key === "contact")!;
  assert.deepEqual(infoV3(contact).intro, contact.intro);
});
