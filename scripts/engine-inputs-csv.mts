// The match engine's inputs, one row per listed racket (PM / owner 2026-11-15: design and test a new engine offline).
// Read-only. Column meanings and sources: padel-engine-inputs-README.md.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/engine-inputs-csv.mts out.csv
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { homePayload } from "../app/home-payload";
import { rankHome, matchPcts } from "../lib/home-rank";
import { passesLevel, LEVELS, type QuickChoice } from "../lib/quick-match";
import { EXTRACTORS } from "../lib/evidence";
import { TRAITS } from "../lib/trait-score";
import { ratingVerdict } from "../lib/top-lists";
import { niche } from "../lib/niche";

const ctx = await matchContext();
const { items } = await homePayload();
const L = ["beginner", "intermediate", "advanced"], band = (b?: { from: number; to: number }) => !b ? "" : b.from === b.to ? L[b.from] : `${L[b.from]}-${L[b.to]}`;
const brandLevel = new Map(ctx.evidence.filter(r => r.extractedBy === EXTRACTORS.brandLevel).map(r => { const [a, b] = (r.valueText ?? "").split("-").map(Number); return [r.productId, band({ from: a, to: b })]; }));
const pro = (niche.fit?.proLines ?? []).map(p => new RegExp(p, "i"));
const sent = new Map<string, { pos: number; mix: number; neg: number; n: number }>();
const add = (id: string, v: string | null | undefined) => { const s = sent.get(id) ?? { pos: 0, mix: 0, neg: 0, n: 0 }; s.n++; if (v === "positive") s.pos++; else if (v === "mixed") s.mix++; else if (v === "negative") s.neg++; sent.set(id, s); };
for (const r of ctx.data.reviews) add(r.racketId, ratingVerdict(r.rating));
for (const e of ctx.data.external) add(e.racketId, e.sentiment);
const rowYear = new Map(items.map(x => [x.id, x.row]));
// Players' stated levels (evidence rows from the reader and the level extractor), one per report, as match-context reads them.
const voices = new Map<string, number[]>();
for (const e of ctx.evidence) if (e.attribute === "level" && e.value !== null && (e.extractedBy === EXTRACTORS.reader || e.extractedBy === EXTRACTORS.level)) {
  const v = voices.get(e.productId) ?? [0, 0, 0]; v[Math.max(0, Math.min(2, Math.round(e.value)))]++; voices.set(e.productId, v); }

// The 9 level × style picks, no sore arm, no fine-tune: the live % for every racket and the home list's rank (row years only).
const setup = { ...niche.finder!, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine }, bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const combos = LEVELS.flatMap(level => (["control", "balance", "power"] as const).map(style => ({ key: `${level.slice(0, 3)}_${style}`, choice: { style, level, arm: false } as QuickChoice })));
const match = combos.map(({ key, choice }) => {
  const pct = matchPcts(items, choice, setup.levelGate, setup.engine);
  const rank = new Map(rankHome(items, setup, bad, choice, false, 10_000).rows.map((r, i) => [r.id, i + 1]));
  return { key, pct, rank };
});

const head = ["id", "slug", "name", "brand", "year", "shape", "weight_spec", "balance_spec", "core", "is_newest", "row_year_slug",
  "reports_total", "positive", "mixed", "negative", "player_score",
  ...TRAITS.flatMap(t => [`${t}_score`, `${t}_dots`, `${t}_basis`, `${t}_auto_score`, `${t}_plus_w`, `${t}_minus_w`, `${t}_players_plus`, `${t}_players_minus`, `${t}_reviewers_plus`, `${t}_reviewers_minus`, `${t}_youtube`, `${t}_spec_lean`, `${t}_expert`]),
  "grams", "feel_class", "tagged_reports", "tags_json",
  "brand_level", "youtube_level", "youtube_channels", "player_level_rows_beginner", "player_level_rows_intermediate", "player_level_rows_advanced", "quicktake_band", "combined_band", "pro_line",
  "expert_suits_beginner", "expert_suits_intermediate", "expert_suits_advanced",
  "suits_auto_beginner", "suits_auto_intermediate", "suits_auto_advanced", "suits_beginner", "suits_intermediate", "suits_advanced", "suits_basis",
  "liked_beginner", "liked_intermediate", "liked_advanced", "passes_beginner", "passes_intermediate", "passes_advanced",
  ...match.flatMap(m => [`pct_${m.key}`, `rank_${m.key}`])];
const q = (v: unknown) => { const s = v === null || v === undefined ? "" : typeof v === "number" ? String(Math.round(v * 1000) / 1000) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const slugOf = new Map(ctx.data.listed.map(r => [r.id, r.slug]));
const lines = ctx.data.listed.map(r => {
  const tr = ctx.traits(r.id), f = ctx.facts(r.id), lv = ctx.level(r.id), ex = tr.edits?.expert ?? {}, auto = ctx.suitsAuto(r.id), s = sent.get(r.id), fi = ctx.fineOf(r.id);
  const row = rowYear.get(r.id);
  return [r.id, r.slug, r.name, ctx.data.brands.find(b => b.id === r.brandId)?.name, r.year, r.shape, r.weight, r.balance, r.core, row === r.id ? 1 : 0, row ? slugOf.get(row) : "",
    s?.n ?? 0, s?.pos ?? 0, s?.mix ?? 0, s?.neg ?? 0, ctx.signal(r.id),
    ...TRAITS.flatMap(t => { const x = tr.scores?.[t], a = tr.auto?.[t];
      return [x?.score, x?.dots, x?.basis, a?.score, x?.plus, x?.minus, x?.people?.players.plus, x?.people?.players.minus, x?.people?.reviewers.plus, x?.people?.reviewers.minus, x?.yt, x?.spec, (ex as Record<string, { value: number } | undefined>)[t]?.value]; }),
    fi?.grams, fi?.feel, tr.tagged, JSON.stringify(tr.tags),
    brandLevel.get(r.id) ?? "", band(f.levels?.youtube), f.levels?.youtube?.channels, ...(voices.get(r.id) ?? [0, 0, 0]), band(f.band), band(lv?.band), pro.some(re => re.test(r.name)) ? 1 : 0,
    ex.suits_beginner?.value, ex.suits_intermediate?.value, ex.suits_advanced?.value,
    auto?.beginner, auto?.intermediate, auto?.advanced, lv?.suits?.beginner, lv?.suits?.intermediate, lv?.suits?.advanced, f.suits?.basis.join("; "),
    lv?.liked.beginner ?? 0, lv?.liked.intermediate ?? 0, lv?.liked.advanced ?? 0,
    ...LEVELS.map(l => passesLevel(lv, l, ctx.levelGate) ? 1 : 0),
    ...match.flatMap(m => [m.pct.get(r.id), m.rank.get(r.id)])].map(q).join(",");
});
writeFileSync(process.argv[2], [head.join(","), ...lines].join("\n") + "\n");
console.log(`${lines.length} rows, ${head.length} columns → ${process.argv[2]}`);
process.exit(0);
