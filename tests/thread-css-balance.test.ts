// thread.css is one file every Thread PR appends to, so rebases keep hitting the same end-of-file conflict. A lost "}" there
// silently turns the rest of the file into a media query (2026-11-21: desktop catalogue unstyled on a preview). Guard it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("thread.css: every { has its }, and no conflict markers", () => {
  const css = readFileSync("app/thread/thread.css", "utf8"), code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const ch of code) { if (ch === "{") depth++; else if (ch === "}") { depth--; assert.ok(depth >= 0, "a } with no {"); } }
  assert.equal(depth, 0, "an unclosed { (a rule or @media block)");
  assert.doesNotMatch(css, /^(<{7}|={7}|>{7})( |$)/m, "a merge conflict marker");
});
