import { test } from "node:test";
import assert from "node:assert/strict";
import padel from "../db/racket-page/padel.json";
import pickleball from "../db/racket-page/pickleball.json";
import type { PageContent } from "../lib/racket-page";

// Research content (owner 2026-11-16): products with under 4 player reports, written from published reviews and specs. Every
// line cites 2+ web pages on distinct domains (never a homepage or search page); player-report content never holds URLs.
const dom = (u: string) => new URL(u).hostname.replace(/^(www|m)\./, "").split(".").slice(-2).join(".");
test("research rows cite 2+ distinct-domain web pages per line; player rows never cite URLs", () => {
  for (const [slug, v] of Object.entries({ ...(padel as Record<string, PageContent>), ...(pickleball as Record<string, PageContent>) })) {
    for (const i of [...v.yes, ...v.no]) {
      const urls = i.src.filter(s => /^https?:\/\//.test(s));
      if (v.source === "research") {
        assert.equal(urls.length, i.src.length, `${slug}: research sources must be URLs: ${i.title}`);
        assert.ok(new Set(urls.map(dom)).size >= 2, `${slug}: needs 2+ distinct domains: ${i.title}`);
        for (const u of urls) {
          assert.ok(new URL(u).pathname.length > 1 || /youtu/.test(u), `${slug}: a homepage is not a source: ${u}`);
          assert.ok(!/google\.|bing\.|[?&](q|query|search_query)=/.test(u), `${slug}: a search page is not a source: ${u}`);
        }
      } else assert.equal(urls.length, 0, `${slug}: player-report content must cite report ids, not URLs`);
    }
  }
});
