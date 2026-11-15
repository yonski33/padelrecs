// The quick-match home list for every RANK_CASES pick (scripts/home-rank-cases.ts), ranked the way the browser does it: from
// the home payload after a JSON round trip (app/home-payload.ts → lib/home-rank.ts). Diff two dumps to check a change.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/home-rank-dump.mts out.json
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { homePayload } from "../app/home-payload";
import { rankHome } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { RANK_CASES } from "./home-rank-cases";
const payload = await homePayload(), json = JSON.stringify(payload);
const { items, cards } = JSON.parse(json) as typeof payload;
const bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const slugOf = (href: string) => href.split("/").pop();
const out = RANK_CASES.map(({ choice, older }) => {
  const { rows, olderN } = rankHome(items, { ...niche.finder!, levelGate: niche.fit?.levelGate }, bad, choice, older);
  return { choice, older, olderN, rows: rows.map(r => ({ id: r.id, slug: slugOf(cards[r.id].href), pct: r.pct, kind: r.fit?.kind ?? null, short: r.fit?.short ?? null, arm: r.arm })) };
});
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`payload ${json.length} B, gzip ${gzipSync(json).length} B (${items.length} items, ${Object.keys(cards).length} cards)`);
process.exit(0);
