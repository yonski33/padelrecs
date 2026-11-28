import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Banned blog domains per site (db/banned-domains.json: AI-written sites, content farms and shops that don't test; owner
// 2026-11-28). No content file may link to one; scripts/hide-banned-blog-domains.mts takes their reviews out of the database.
const list = JSON.parse(readFileSync("db/banned-domains.json", "utf8")) as Record<string, string[] | string>;
const domains = Object.entries(list).filter(([k]) => !k.startsWith("_")).flatMap(([, v]) => v as string[]);
const esc = (d: string) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LINK = new RegExp(`(^|[^a-z0-9.-])([a-z0-9-]+\\.)*(${domains.map(esc).join("|")})(?=[/?#:"'\\s]|$)`, "i");

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? jsonFiles(p) : p.endsWith(".json") ? [p] : []; });
}

test("the banned-domain list is well formed", () => {
  assert.ok(domains.length >= 50, "domains listed");
  for (const d of domains) assert.match(d, /^[a-z0-9.-]+\.[a-z]{2,}$/, d);
  assert.equal(new Set(domains).size, domains.length, "no duplicates");
});

test("no content file links to a banned domain", () => {
  const files = jsonFiles("db").filter(f => f !== join("db", "banned-domains.json"));
  assert.ok(files.length > 20, "content files found");
  assert.deepEqual(files.filter(f => LINK.test(readFileSync(f, "utf8"))), []);
});

test("the match is by host, so look-alike hosts and plain words stay", () => {
  for (const bad of ["https://www.practicapadel.com/x", "https://newsletter.skincarestacy.com/p/a", "https://paddlereviewhub.pages.dev/reviews/x", "\"https://orneil.com/\""])
    assert.ok(LINK.test(bad), bad);
  for (const ok of ["https://notpracticapadel.com/x", "https://www.3dnews.ru/a", "Practica Padel says", "https://pickleballnationals.org/x"])
    assert.ok(!LINK.test(ok), ok);
});
