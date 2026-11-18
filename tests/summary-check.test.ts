import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSummary, nameWords, sharedRuns } from "../lib/summary-check";

const sync = "Owners are consistently enthusiastic about the Synchronika II. They praise the tank-like build, and many chose it over a Micra with no regrets.";

test("name-like words are mid-sentence capitals and words with digits, not sentence starts", () => {
  assert.deepEqual(nameWords("Owners like it. Many chose it over a Micra and the E61 group, unlike the Bianca's."), ["Micra", "E61", "Bianca"]);
  assert.deepEqual(nameWords("Most players find it straight."), []);
});

test("shared runs of 8+ words are found once, grown to their full length", () => {
  const drive = "Owners are very happy with the Drive, and many chose it over a Micra with no regrets.";
  assert.deepEqual(sharedRuns(drive, sync), ["and many chose it over a micra with no regrets"]);
  assert.deepEqual(sharedRuns("A short line about grinding.", sync), []);
});

test("a summary copied from another product is flagged; one grounded in its own reviews is not", () => {
  const drive = { slug: "profitec-drive", name: "Drive", brand: "Profitec", summary: "Owners are very happy with the Drive, and many chose it over a Micra with no regrets.", reviews: ["Chose the Drive over the Micra."] };
  assert.deepEqual(checkSummary(drive, [{ slug: "ecm-synchronika-ii", summary: sync }]), ['shares "and many chose it over a micra with no regrets" with ecm-synchronika-ii']);
  const wrong = { ...drive, summary: "Owners love the Drive, though it is slower than a Bianca.", reviews: ["Great machine."] };
  assert.deepEqual(checkSummary(wrong, []), ["names not found in its own name or reviews: Bianca"]);
  assert.deepEqual(checkSummary({ ...drive, summary: "Owners like the steam." }, []), ["does not name the product (Drive)"]);
});

test("names match without accents and with plus written either way", () => {
  const alva = { slug: "kastaplast-alva", name: "Älva", brand: "Kastaplast", summary: "Players see the Alva as flippy, more so in K1 Grind.", reviews: ["K1 Grind is more understable."] };
  assert.deepEqual(checkSummary(alva, []), []);
  const v = { slug: "baratza-virtuoso", name: "Virtuoso", brand: "Baratza", summary: "Some love the Virtuoso+ for filter.", reviews: ["My Virtuoso Plus is great."] };
  assert.deepEqual(checkSummary(v, []), []);
  assert.deepEqual(checkSummary({ ...v, reviews: ["My Virtuoso is great."] }, []), ["names not found in its own name or reviews: Virtuoso+"]);
});
