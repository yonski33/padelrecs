import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rankSkin, wireCtx, shrink, EVERYTHING_SKIP, type SkinWire } from "../app/skin/rank";
import { attrProfileFor } from "../lib/attr-profile";
import { readSkinChoice } from "../lib/skin-choice";
import { withSafety } from "../lib/skin-safety";
import { skinPage } from "../lib/skin-page";
import { skin } from "../lib/niche/skin";

// SkinRecs match tuning pass (owner OK 2026-11-17): the audit's engine tests (skinrecs-match-audit.md "Engine tests"), on a
// snapshot of the real catalogue's ranking inputs (tests/fixtures/skin-match-snapshot.json, scripts/skin-snapshot.mts,
// 2026-11-17), with the site's own ranking.
const snap = JSON.parse(readFileSync("tests/fixtures/skin-match-snapshot.json", "utf8")) as (SkinWire & { slug: string })[];
const items: SkinWire[] = snap.map(x => ({ ...x, attrs: withSafety(x.attrs, x.name, x.shape, (skinPage(x.slug)?.no ?? []).map(n => n.title)) }));
const ctx = wireCtx(attrProfileFor(skin)!, items);
const types = skin.typePages ?? [];
const rank = (q: Record<string, string>) => rankSkin(ctx, readSkinChoice(q, types));
const scored = (q: Record<string, string>) => rank(q).filter(r => r.pct !== null);
const byName = (re: RegExp) => { const x = items.find(i => re.test(i.name)); assert.ok(x, String(re)); return x!; };
const pctIn = (q: Record<string, string>, id: string) => rank(q).find(r => r.r.id === id)?.pct ?? null;
const SENS: Record<string, string>[] = [{ sens: "1" }, ...types.map(t => ({ sens: "1", type: t.slug })), { sens: "1", skin: "dry" }, { sens: "1", skin: "oily" }, { sens: "1", acne: "1" }];

test("1 sensitive_low_gentle_cap: gentle < 45 from 8+ voices stays at 60 or below", () => {
  for (const q of SENS) for (const r of scored(q)) { const g = r.r.attrs.scores.gentle; if (g && g.score < 45 && g.n >= 8) assert.ok(r.pct! <= 60, `${r.r.name} ${r.pct} ${JSON.stringify(q)}`); }
  assert.ok((pctIn({ sens: "1" }, byName(/AHA 30%/).id) ?? 0) <= 60);
});

test("2 sensitive_fragrance_cap: fragranced or essential-oil products stay at 74 or below", () => {
  for (const q of SENS) for (const r of scored(q)) if (["fragrance", "oils"].includes(String(r.r.attrs.facts.fragrance_free))) assert.ok(r.pct! <= 74, `${r.r.name} ${r.pct}`);
  assert.ok((pctIn({ sens: "1" }, byName(/Tatcha The Water Cream/).id) ?? 0) <= 74);
});

test("3 sensitive_strong_active: no strong product in the treatments top 3, none at 75+", () => {
  const rows = scored({ type: "treatments", sens: "1" });
  assert.ok(rows.slice(0, 3).every(r => r.r.attrs.facts.strength !== "strong"), rows.slice(0, 3).map(r => r.r.name).join(", "));
  for (const re of [/Drying Lotion/, /U\.F\.O/, /CeraVe Resurfacing Retinol/]) assert.ok((pctIn({ type: "treatments", sens: "1" }, byName(re).id) ?? 0) < 75, String(re));
});

test("4 thin_below_thick: a few voices count for less; mixsoon is not #1 for dry skin", () => {
  assert.ok(shrink(96, 3) < shrink(86, 39));
  assert.ok(!/mixsoon/i.test(scored({ skin: "dry" })[0].r.name));
});

test("5 goal_missing_not_free: no product without a hydration score in the dry + hydrate top 5", () => {
  for (const r of scored({ skin: "dry", goal: "hydrate" }).slice(0, 5)) assert.ok(r.r.attrs.scores.hydration, r.r.name);
});

test("6 goal_hydrate_treatments_scored: treatments + hydrate has 5+ rows with a %", () => {
  assert.ok(scored({ type: "treatments", goal: "hydrate" }).length >= 5);
});

test("7 normal_skin_scored: normal-skin cleansers have a %, and it isn't just the user score", () => {
  const rows = scored({ type: "cleansers", skin: "normal" });
  assert.ok(rows.length >= 5);
  assert.ok(rows.some(r => r.pct !== r.signal));
});

test("8 ff_integrity: fragrance-free never lists the products with essential oils in their INCI", { todo: "passes once the owner-OKed fragrance fix (Cicapair, Pink Drink, Haruharu toner → oils) is written and the snapshot refreshed" }, () => {
  const names = rank({ ff: "1", skin: "dry" }).map(r => r.r.name).join(" | ");
  for (const re of [/Cicapair/, /Pink Drink/, /Haruharu Wonder Black Rice Hyaluronic Toner/]) assert.doesNotMatch(names, re);
});

test("9 acid_fact: leave-on acid toners carry the acid fact, so the sensitive rules catch them; TO Glycolic 7% is body-first or strong", () => {
  for (const re of [/Green Plum.*AHA/, /AHA\/BHA Clarifying/, /PHA\+BHA Pore-Tight/, /INKEY List PHA Toner/, /Glycolic Acid 7%/]) assert.ok(byName(re).attrs.facts.acid, String(re));
  const g = byName(/Glycolic Acid 7%/);
  assert.ok(g.attrs.facts.strength === "strong" || g.attrs.facts.use === "body-first");
  assert.ok((pctIn({ sens: "1", type: "toners" }, g.id) ?? 0) <= 60);
});

function grid() {
  const top1: number[] = [], firsts = new Map<string, number>(); let rows8 = 0, hi = 0, n = 0;
  for (const s of ["", "dry", "oily", "combination", "normal"]) for (const g of ["", "hydrate", "calm", "clear"]) for (const sens of ["", "1"]) for (const acne of ["", "1"]) for (const t of ["", "moisturizers", "serums", "cleansers", "sunscreens", "toners", "treatments"]) {
    if (!s && !g && !sens && !acne) continue;
    const q = Object.fromEntries(Object.entries({ skin: s, goal: g, sens, acne, type: t }).filter(([, v]) => v));
    const rows = scored(q); n++;
    if (rows[0]) { top1.push(rows[0].pct!); firsts.set(rows[0].r.id, (firsts.get(rows[0].r.id) ?? 0) + 1); }
    for (const r of rows.slice(0, 8)) { rows8++; if (r.pct! >= 85) hi++; }
  }
  return { top1, firsts, rows8, hi, n };
}

test("10 pct_spread: on the core grid few top-8 rows reach 85 and the #1 median is 72–80", () => {
  const { top1, rows8, hi } = grid(), med = [...top1].sort((a, b) => a - b)[Math.floor(top1.length / 2)];
  assert.ok(hi / rows8 <= 0.1, `${hi}/${rows8}`);
  assert.ok(med >= 72 && med <= 80, `median ${med}`);
});

// COSRX Full Fit Propolis Toner is still #1 in 90 of 553 combos (59 toner lists, 31 "everything"); the audit's own simulation
// had 76 (13.7%). Its optional fix, at most 2 of one type in the top 8 of "everything", was left for the owner to decide.
test("10b no product is #1 in more than 12% of combos", { todo: "needs the audit's optional per-type cap on 'everything' (owner decision)" }, () => {
  const { firsts, n } = grid();
  assert.ok(Math.max(...firsts.values()) / n <= 0.12, `max #1 share ${Math.max(...firsts.values())}/${n}`);
});

test("11 concern_fallback: sensitive + acne toners have 5+ rows with a %", () => {
  assert.ok(scored({ type: "toners", sens: "1", acne: "1" }).length >= 5);
});

test("12 daily_is_default: 'just everyday' alone ranks like no pick", () => {
  assert.deepEqual(rank({ goal: "daily" }).map(r => r.r.id), rank({}).map(r => r.r.id));
  assert.ok(rank({ goal: "daily" }).every(r => r.pct === null));
});

test("13 everything_excludes_eye_mask: no eye cream, mask or balm without a type", () => {
  for (const q of [{}, { skin: "normal" }, { skin: "combination", goal: "hydrate" }] as Record<string, string>[]) assert.ok(rank(q).every(r => !EVERYTHING_SKIP.has(r.r.shape ?? "")));
  assert.ok(rank({ type: "eye-creams" }).length > 0 || !types.some(t => t.slug === "eye-creams"));
});
