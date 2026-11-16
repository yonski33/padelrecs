// The lists behind "Similar products" (app/similar-section.tsx, owner 2026-11-16), as pure functions of plain inputs so tests
// feed them directly. The pages gather the inputs from their own context (app/rackets/[slug]/racket-fit.tsx, app/skin/
// skin-product.tsx, the old product page) and the lists are worked out with the page, so nothing extra ships to the browser.

import { hasAttribution } from "./voice";

/** A card's line in the expert voice (owner 2026-11-16): the clauses before any "some / many players …" one, so "Big distance
 *  once seasoned; many turn it over" reads "Big distance once seasoned." Null when nothing is left. */
const CROWD = /\b(many|some|several|a few|most|users|people|players|drivers|throwers)\b/i;
export function expertLine(text: string | null | undefined): string | null {
  if (!text) return null;
  // Clauses with the punctuation after them ("…; ", "…. "), so what is kept reads as written.
  let out = "";
  for (const m of text.matchAll(/[^;.]+(?:[;.]+\s*|$)/g)) { if (hasAttribution(m[0]) || CROWD.test(m[0])) break; out += m[0]; }
  out = out.trim().replace(/[;,]$/, ".");
  if (out && !/[.!?]$/.test(out)) out += ".";
  return out.length >= 12 ? out : null;
}

/** The tile colours, in order (the mockups' four). */
export const TINTS = ["var(--s-acc)", "#fff", "oklch(0.92 0.13 95)", "oklch(0.9 0.06 230)"] as const;
export const tint = (i: number) => TINTS[i % TINTS.length];
/** The tile's word for types too long for it (48px). */
const SHORT_TAG: Record<string, string> = { "wheelbase": "base", "wheel": "rim", "cockpit": "rig", "shifter / handbrake": "shifter", "balm & ointment": "balm", "eye cream": "eye" };
export const tileWord = (s: string) => SHORT_TAG[s.toLowerCase()] ?? s.toLowerCase();

/** "more power": the trait where `other` is furthest ahead of `me` on the 0–5 dots (0 = not rated), in the site's own words;
 *  "similar feel" when it is ahead nowhere. */
export function aheadWord(me: number[], other: number[], words: string[], same = "similar feel"): string {
  let best = -1, gap = 0;
  other.forEach((v, i) => { const g = v - (me[i] || 0); if (v && me[i] && g > gap) { gap = g; best = i; } });
  return best < 0 ? same : words[best];
}

// ── Disc golf: "Complete your bag" ──────────────────────────────────────────────────────────────────────────────────────
export type Disc = { id: string; kind: string; flight: number[] | null; signal: number | null; levelOk: boolean };
/** Flight numbers "7 / 5 / 0 / 2" → [speed, glide, turn, fade]; null when not four numbers. */
export const flightOf = (s: string[] | string | null | undefined): number[] | null => {
  const parts = (Array.isArray(s) ? s : (s ?? "").split("/")).map(x => Number(String(x).trim()));
  return parts.length === 4 && parts.every(n => Number.isFinite(n)) ? parts : null;
};
/** How a disc flies, from turn + fade: understable ≤ 0, overstable ≥ 3, else straight. */
export const stabilityOf = (f: number[] | null) => !f ? null : f[2] + f[3] >= 3 ? "overstable" : f[2] + f[3] <= 0 ? "understable" : "straight";
const DRIVERS = new Set(["fairway", "distance", "driver"]), APPROACH = new Set(["mid", "midrange", "putter"]);

/** The discs that fill this one's gaps: the best liked disc of each other type at the thrower's level, plus an overstable
 *  approach disc and an understable driver when the bag would lack one. Four at most, each with the gap it fills. */
export function completeBag(me: Disc, all: Disc[], typeWord: (kind: string) => string, n = 4): { id: string; why: string }[] {
  const pool = all.filter(d => d.id !== me.id && d.levelOk && d.kind !== me.kind).sort((a, b) => (b.signal ?? -1) - (a.signal ?? -1));
  const out: { id: string; why: string }[] = [], used = new Set<string>();
  const take = (d: Disc | undefined, why: string) => { if (d && !used.has(d.id) && out.length < n) { used.add(d.id); out.push({ id: d.id, why }); } };
  const mine = stabilityOf(me.flight);
  // The gaps first: an overstable approach disc unless this is one, an understable driver unless this is one.
  if (!(APPROACH.has(me.kind) && mine === "overstable")) take(pool.find(d => APPROACH.has(d.kind) && stabilityOf(d.flight) === "overstable"), "for approaches");
  if (!(DRIVERS.has(me.kind) && mine === "understable")) take(pool.find(d => DRIVERS.has(d.kind) && stabilityOf(d.flight) === "understable"), "understable driver");
  // Then the best of each type the bag has no disc of yet.
  for (const kind of [...new Set(pool.map(d => d.kind))]) if (![...used].some(id => all.find(d => d.id === id)?.kind === kind)) take(pool.find(d => d.kind === kind), `the ${typeWord(kind)}`);
  // A straight midrange before a second disc of a type the bag already has.
  const MID = new Set(["mid", "midrange"]);
  if (!MID.has(me.kind)) take(pool.find(d => MID.has(d.kind) && stabilityOf(d.flight) === "straight"), "the straight mid");
  for (const d of pool) take(d, `the ${typeWord(d.kind)}`);
  return out;
}

// ── SkinRecs: "Pairs well with" ─────────────────────────────────────────────────────────────────────────────────────────
/** The routine's steps by product type (lib/niche/skin.ts typePages shapes): order and the chip's words. */
export const ROUTINE: Record<string, { step: number; word: string }> = {
  "Cleanser": { step: 1, word: "step 1 · cleanse" }, "Toner": { step: 2, word: "step 2 · tone" }, "Serum": { step: 3, word: "step 3 · treat" },
  "Treatment": { step: 3, word: "step 3 · treat" }, "Exfoliant": { step: 3, word: "step 3 · exfoliate" }, "Eye cream": { step: 4, word: "step 4 · eyes" },
  "Moisturizer": { step: 4, word: "step 4 · moisturize" }, "Balm & ointment": { step: 5, word: "last · seal" }, "Sunscreen": { step: 5, word: "last · SPF (day)" },
};
/** Strong actives (retinoids, acids): never two of them in one pairing. */
export const STRONG = new Set(["Treatment", "Exfoliant"]);
/** What each type pairs with, best first. */
const PAIRS: Record<string, string[]> = {
  "Cleanser": ["Moisturizer", "Sunscreen", "Serum", "Toner"], "Toner": ["Serum", "Moisturizer", "Cleanser", "Sunscreen"],
  "Serum": ["Moisturizer", "Sunscreen", "Cleanser", "Toner"], "Treatment": ["Moisturizer", "Cleanser", "Sunscreen", "Balm & ointment"],
  "Exfoliant": ["Moisturizer", "Sunscreen", "Cleanser", "Serum"], "Moisturizer": ["Cleanser", "Sunscreen", "Serum", "Treatment"],
  "Sunscreen": ["Cleanser", "Moisturizer", "Serum", "Toner"], "Balm & ointment": ["Cleanser", "Moisturizer", "Treatment", "Serum"],
  "Eye cream": ["Cleanser", "Moisturizer", "Serum", "Sunscreen"], "Mask": ["Cleanser", "Moisturizer", "Serum", "Sunscreen"],
};
export type SkinItem = { id: string; type: string | null; signal: number | null; /** 0–100 per skin type it suits ("suits_dry" …). */ suits: Record<string, number | null>; gentle: number | null };
/** The skin types a product is good for: its suits scores at 65 or more (4+ dots). */
export const goodFor = (p: SkinItem) => Object.entries(p.suits).filter(([, v]) => (v ?? 0) >= 65).map(([k]) => k);

/** One product from each step this one pairs with, compatible with the skin it suits (a product that suits sensitive skin
 *  only pairs with gentle ones), never a second strong active; best liked first within a step. */
export function routinePairs(me: SkinItem, all: SkinItem[], n = 4): { id: string; why: string }[] {
  const steps = me.type ? PAIRS[me.type] ?? [] : [], need = goodFor(me), sensitive = need.includes("suits_sensitive");
  const out: { id: string; why: string }[] = [];
  let strong = !!me.type && STRONG.has(me.type);
  for (const step of steps) {
    if (out.length >= n) break;
    if (STRONG.has(step) && strong) continue;
    const fits = (p: SkinItem) => p.type === step && p.id !== me.id && (!need.length || need.some(k => (p.suits[k] ?? 0) >= 45)) && (!sensitive || (p.gentle ?? 50) >= 55);
    const pick = all.filter(fits).sort((a, b) => (b.signal ?? -1) - (a.signal ?? -1))[0];
    if (!pick) continue;
    if (STRONG.has(step)) strong = true;
    out.push({ id: pick.id, why: ROUTINE[step]?.word ?? step.toLowerCase() });
  }
  return out;
}

// ── SimRacingRecs: "Works with" ─────────────────────────────────────────────────────────────────────────────────────────
export type RigPart = { id: string; type: string | null; brand: string | null; platforms: string[]; signal: number | null };
const WITH: Record<string, string[]> = {
  "Wheelbase": ["Wheel", "Pedals", "Cockpit", "Shifter / handbrake"], "Wheel": ["Wheelbase", "Pedals", "Cockpit"],
  "Pedals": ["Wheelbase", "Cockpit", "Wheel"], "Cockpit": ["Wheelbase", "Pedals", "Shifter / handbrake"], "Shifter / handbrake": ["Wheelbase", "Cockpit", "Pedals"],
};
/** Rims and bases need the same ecosystem (brand); pedals and shifters fit best in it too; a cockpit fits any. */
const SAME_BRAND = new Set(["Wheel", "Wheelbase"]);
/** Platforms on file ("PC, PlayStation") as a list; empty when unknown, which never rules a product out. */
export const platformsOf = (s: string | null | undefined) => (s ?? "").split(/[,/;]| and /).map(x => x.trim()).filter(Boolean);

export function worksWith(me: RigPart, all: RigPart[], n = 4): { id: string; why: string }[] {
  const out: { id: string; why: string }[] = [];
  for (const type of me.type ? WITH[me.type] ?? [] : []) {
    if (out.length >= n) break;
    const sharePlatform = (p: RigPart) => !me.platforms.length || !p.platforms.length || p.platforms.some(x => me.platforms.includes(x));
    const cands = all.filter(p => p.id !== me.id && p.type === type && sharePlatform(p)).sort((a, b) => (b.signal ?? -1) - (a.signal ?? -1));
    const same = cands.find(p => p.brand && p.brand === me.brand);
    const pick = type === "Cockpit" ? cands[0] : SAME_BRAND.has(type) || SAME_BRAND.has(me.type ?? "") ? same : same ?? cands[0];
    if (!pick) continue;
    out.push({ id: pick.id, why: pick.brand && pick.brand === me.brand ? "same ecosystem" : type === "Cockpit" ? "holds it all" : "fits the setup" });
  }
  return out;
}
