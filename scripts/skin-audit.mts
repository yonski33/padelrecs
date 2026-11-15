// Read-only audit of SkinRecs for the engine profile (ENGINE-PLAN step 6). NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-audit.mts
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
if (niche.id !== "skin") throw new Error("NICHE=skin");
const d = await catalog();
const c = (xs: (string | null | undefined)[]) => { const m = new Map<string, number>(); for (const x of xs) m.set(x ?? "(none)", (m.get(x ?? "(none)") ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
console.log("products all/listed", d.rackets.length, d.listed.length, "brands", d.listedBrands.length);
console.log("types (listed)", c(d.listed.map(r => r.shape)));
console.log("own reviews", d.reviews.length, "external", d.external.length);
console.log("platforms", c(d.external.map(e => e.sourcePlatform)).slice(0, 15));
console.log("sentiment", c(d.external.map(e => e.sentiment)));
console.log("own skin type", c(d.reviews.map(r => r.playerLevel)));
const tags = new Map<string, number>(); for (const x of [...d.reviews, ...d.external]) for (const t of x.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
console.log("tags", [...tags].sort((a, b) => b[1] - a[1]));
const withTags = [...d.reviews, ...d.external].filter(x => x.tags.length).length;
console.log("reports with any tag", withTags);
// Skin type stated in text
const re: Record<string, RegExp> = { dry: /\bdry (skin|face)|\bmy skin is (very )?dry|\bdry[- ]skinned/i, oily: /\boily (skin|face|t-?zone)|\bmy skin is (very )?oily/i, sensitive: /\bsensitive skin|\bmy skin is (very )?sensitive|\brosacea|\beczema/i, acne: /\bacne[- ]prone|\bbreakouts?\b|\bacne\b/i, combination: /\bcombination skin|\bcombo skin/i };
const txt = (e: any) => [e.summary, e.excerptTranslation ?? e.excerpt, e.reviewText].filter(Boolean).join(" ");
const all = [...d.reviews, ...d.external];
for (const [k, r] of Object.entries(re)) console.log("text mentions", k, all.filter(x => r.test(txt(x))).length);
// per product counts
const per = new Map<string, { n: number; yt: number; blog: number }>();
for (const r of d.listed) per.set(r.id, { n: 0, yt: 0, blog: 0 });
for (const x of d.reviews) { const p = per.get(x.racketId); if (p) p.n++; }
for (const e of d.external) { const p = per.get(e.racketId); if (!p) continue; p.n++; if (e.sourcePlatform === "YouTube") p.yt++; else if (!/reddit/i.test(e.sourcePlatform)) p.blog++; }
const ns = [...per.values()].map(p => p.n).sort((a, b) => a - b);
console.log("reports per product: min/p25/median/p75/max", ns[0], ns[Math.floor(ns.length / 4)], ns[Math.floor(ns.length / 2)], ns[Math.floor(3 * ns.length / 4)], ns.at(-1));
console.log("products <10 reports", ns.filter(n => n < 10).length, "<25", ns.filter(n => n < 25).length);
console.log("products with YouTube", [...per.values()].filter(p => p.yt).length, "with non-Reddit non-YT source", [...per.values()].filter(p => p.blog).length);
console.log("surface (skin types) filled", d.listed.filter(r => r.surface).length, "balance (fragrance) filled", d.listed.filter(r => r.balance).length, "core filled", d.listed.filter(r => r.core).length);
console.log("fragrance", c(d.listed.map(r => r.balance)));
console.log("SPF in name", d.listed.filter(r => /spf/i.test(r.name)).length, "sunscreens", d.listed.filter(r => r.shape === "Sunscreen").length);
console.log("sample external", JSON.stringify(d.external.find(e => e.sourcePlatform === "YouTube"))?.slice(0, 600));
console.log("sample blog", JSON.stringify(d.external.find(e => !/reddit|youtube/i.test(e.sourcePlatform)))?.slice(0, 600));
process.exit(0);
