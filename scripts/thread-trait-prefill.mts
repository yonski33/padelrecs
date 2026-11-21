// "How does it play?" prefill (owner 2026-11-19): what reviews already say about each padel racket, per vote group
// (lib/thread/traits.ts), so the grid isn't empty before players vote. Read-only: reads the evidence store, the stored
// review texts and the specs, and writes db/thread/<niche>-traits.json. Nothing goes into the trait-vote table.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/thread-trait-prefill.mts
//   NICHE=pickleball … the same (its own groups: Game type, Spin and Pop, no specs; lib/thread/trait-prefill.ts)
// One source (a review, a web report, a YouTube channel) counts once per group. The rules are in lib/thread/trait-prefill.ts.
import { writeFileSync, mkdirSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index";
import { rackets, reviews, externalReviews } from "../db/schema";
import { evidenceRows } from "../db/evidence";
import { buildPrefill } from "../lib/thread/trait-prefill";
import { niche } from "../lib/niche";

//   NICHE=discgolf … the same (stated level and durability from the evidence; stability, glide, fade and arm speed from the flight
//   numbers, kept apart as specs; lib/thread/trait-prefill.ts discSpecs)
//   NICHE=audio … from the reviews' quick tags and summary words (no evidence store there yet; lib/thread/audio-prefill.ts)
//   NICHE=simracing … the same (its quality and suits rows, per gear type's groups; no specs)
if (!["padel", "pickleball", "skin", "discgolf", "audio", "simracing"].includes(niche.id)) throw new Error("Run with NICHE=padel, pickleball, skin, discgolf, audio or simracing");
if (niche.id === "audio") {
  const [{ audioContext }, { buildAudioPrefill }] = await Promise.all([import("../app/audio/context"), import("../lib/thread/audio-prefill")]);
  const ctx = await audioContext(), d = ctx.data;
  const cat = d.listed.map(r => { const w = ctx.wire.get(r.id)!; return { id: r.id, slug: r.slug, name: r.name, kind: w.kind, wireless: w.wireless, anc: w.anc }; });
  const sources = [
    ...d.reviews.map(r => ({ productId: r.racketId, tags: r.tags ?? [], text: r.reviewText ?? "", negative: r.rating <= 2 })),
    ...d.external.map(e => ({ productId: e.racketId, tags: e.tags ?? [], text: e.summary ?? "", negative: e.sentiment === "negative" })),
  ];
  const out = buildAudioPrefill(cat, sources, new Date().toISOString().slice(0, 10));
  mkdirSync("db/thread", { recursive: true });
  writeFileSync("db/thread/audio-traits.json", JSON.stringify(out, null, 1) + "\n");
  const withAny = Object.values(out.rackets).filter(r => Object.values(r.groups).some(g => Object.values(g).some(n => n >= 5))).length;
  console.log(`audio: ${Object.keys(out.rackets).length} products, ${withAny} with at least one option at 5+ mentions`);
  process.exit(0);
}
if (niche.id === "skin") {
  // SkinRecs: from its own engine's attribute scores (lib/thread/trait-prefill.ts skinGroups). Read-only.
  const { skinContext } = await import("../app/skin/context");
  const { skinGroups } = await import("../lib/thread/trait-prefill");
  const ctx = await skinContext(), out: Record<string, unknown> = {};
  for (const r of [...ctx.data.listed].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const g = skinGroups(ctx.attrs.get(r.id)?.scores ?? {});
    out[r.id] = { slug: r.slug, name: r.name, sources: g.sources, groups: g.groups, spec: {} };
  }
  mkdirSync("db/thread", { recursive: true });
  writeFileSync("db/thread/skin-traits.json", JSON.stringify({ built: new Date().toISOString().slice(0, 10), rule: "Counts from SkinRecs' attribute scores: suits_* plus, gentle plus/minus, texture and finish axis reports.", rackets: out }, null, 1) + "\n");
  console.log(`skin: ${Object.keys(out).length} products, ${Object.values(out).filter(x => Object.keys((x as { groups: object }).groups).length).length} with a prefill`);
  process.exit(0);
}
const db = await getDb();
const [cat, own, ext, ev] = await Promise.all([
  db.select({ id: rackets.id, slug: rackets.slug, name: rackets.name, shape: rackets.shape, core: rackets.core, balance: rackets.balance, weight: rackets.weight }).from(rackets),
  db.select({ id: reviews.id, racketId: reviews.racketId, rating: reviews.rating, text: reviews.reviewText }).from(reviews).where(eq(reviews.status, "approved")),
  db.select({ id: externalReviews.id, racketId: externalReviews.racketId, sentiment: externalReviews.sentiment,
    summary: externalReviews.summary, excerpt: externalReviews.excerpt, translation: externalReviews.excerptTranslation }).from(externalReviews),
  evidenceRows(),
]);
const texts = [
  ...own.map(r => ({ productId: r.racketId, key: `p:${r.id}`, negative: r.rating <= 2, text: r.text })),
  ...ext.map(e => ({ productId: e.racketId, key: `w:${e.id}`, negative: e.sentiment === "negative", text: [e.summary, e.translation ?? e.excerpt].filter(Boolean).join("\n") })),
];
const out = buildPrefill(cat, ev, texts, new Date().toISOString().slice(0, 10), niche.id);
mkdirSync("db/thread", { recursive: true });
writeFileSync(`db/thread/${niche.id}-traits.json`, JSON.stringify(out, null, 1) + "\n");
const withAny = Object.values(out.rackets).filter(r => Object.values(r.groups).some(g => Object.values(g).some(n => n >= 5))).length;
console.log(`${niche.id}: ${Object.keys(out.rackets).length} products, ${withAny} with at least one option at 5+ mentions`);
process.exit(0);
