// The SkinRecs product page's answers for one set of picks (skin type, goal, reacts easily): the skin check, why yes / why not
// in "for your skin" order, and "How it feels & compares" against close alternatives. Pure: the browser re-runs it on a tap
// (app/skin/skin-product-live.tsx, app/instant-view.ts) from the data the page sends once (ProductInput, built on the server in
// app/skin/skin-product.tsx). Expert voice (lib/voice.ts): the advice states things; counts live in the review header and
// the User score. A product with written content (db/racket-page/skin.json, lib/skin-page.ts) shows that; one without shows
// lines from its scores, worded without counts; under FEW_VOICES reports, "few reports so far".
import { skinMatch, rankSkin, wireCtx, type SkinWire } from "./rank";
import { attrWords, dotsOf, FEW_VOICES, type AttrScore } from "../../lib/attr-score";
import { applies, type AttrProfile } from "../../lib/attr-profile";
import { skinHref, skinPicked, skinAnswered, skinQuery, type SkinChoice, type Goal } from "../../lib/skin-choice";
import type { CmpTab, SelfRow, Viz } from "./product-compare";
import { skinTags, skinMatters, splitMark, type SkinItem } from "../../lib/skin-page";

export type ProductInput = {
  self: SkinWire; /** Other listed products of its type (not itself, nor another listing of it). */ peers: SkinWire[];
  peerCards: Record<string, { short: string; photo: string | null; href: string; total: number }>;
  here: string; type: { slug: string; label: string } | null; catalogPath: string; many: string;
  counts: { n: number; positive: number; mixed: number; negative: number };
  /** The written content, its items' source kinds and try-instead products resolved on the server. */ page: PageWire | null;
};
export type ItemWire = SkinItem & { proof: string; altCard?: { name: string; href: string } };
export type PageWire = { bottom: string; yes: ItemWire[]; no: ItemWire[] };
type Item = { key: string; title: string; pre: string; hl: string; post: string; proof: string; on: boolean;
  tip?: string; alt?: { t: string; name: string; href: string } };
export type Listed = Item & { forYou: boolean };

export const GOAL_LABEL: Record<Goal, string> = { hydrate: "hydrate", calm: "calm", clear: "clear skin", daily: "just everyday" };
/** Score bands for the plain-words notes: strong, good, mixed, weak. */
const band = (s: AttrScore) => s.score >= 75 ? 0 : s.score >= 60 ? 1 : s.score >= 45 ? 2 : 3;
const NOTE: Record<string, string[]> = {
  hydration: ["Very hydrating.", "Hydrating.", "Mixed on hydration.", "Often not hydrating enough."],
  gentle: ["Very gentle.", "Gentle on most skin.", "Irritates some skin.", "Often irritates."],
  breakouts: ["Rarely clogs pores.", "Mostly clog-free.", "Breaks some people out.", "Often clogs pores."],
};
const suitsNote = (s: AttrScore | null, label: string) => !s || s.n < FEW_VOICES ? `Few reports from ${label} so far.`
  : [`Works well for ${label}.`, `Mostly works for ${label}.`, `Mixed for ${label}.`, `Often not for ${label}.`][band(s)];
const plain = (t: string) => t.replace(/==/g, "");
const lineOf = (it: { title: string; t: string }) => `${it.title}: ${plain(it.t).replace(/^./, x => x.toLowerCase())}`;
const ROWS = [["hydration", "Hydration"], ["gentle", "Gentleness"], ["breakouts", "Clog-free"], ["texture", "Texture (light ↔ rich)"], ["finish", "Finish (matte ↔ dewy)"]] as const;
const PICK: Record<string, [string, string]> = { hydration: ["want more hydration", "more hydrating"], gentle: ["need something gentler", "gentler"], breakouts: ["break out easily", "fewer breakouts"] };

export function productView(profile: AttrProfile, P: ProductInput, choice: SkinChoice) {
  const ctx = wireCtx(profile, [P.self, ...P.peers]);
  const r = P.self, a = r.attrs, c = P.counts;
  const def = (k: string) => profile.attrs.find(x => x.key === k)!;
  const sc = (k: string): AttrScore | null => a.scores[k] ?? null;
  const price = typeof a.facts.price === "string" ? a.facts.price : null;

  // ── The skin check: skin type + what you want it to do (+ reacts easily). The match is the engine's, plus the goal's score.
  const answered = skinAnswered(choice);
  const goal = choice.goal;
  const base = answered ? skinMatch(ctx, r.id, choice) : null;
  const parts = base?.parts ?? [], pct = base?.pct ?? null;
  const kind = !base ? null : pct === null ? "thin" as const : pct >= 75 ? "good" as const : pct >= 55 ? "maybe" as const : "no" as const;
  const partText = (p: (typeof parts)[number], good: boolean) => {
    const s = sc(p.key);
    if (p.key.startsWith("suits_")) return s && s.n < FEW_VOICES ? `Few reports from ${p.label} so far.` : good ? `Works well for ${p.label}.` : `Mixed results for ${p.label}.`;
    if (p.key === "hydration") return good ? "Comfortable and hydrating." : "May not be hydrating enough.";
    if (p.key === "gentle") return good ? "Gentle, rarely irritates." : "Can irritate reactive skin.";
    if (p.key === "breakouts") return good ? "Rarely clogs pores." : "Breaks some people out.";
    if (p.key === "texture") return good ? `Its texture suits your skin.` : `The texture may not suit ${choice.skin} skin.`;
    if (p.key === "finish") return good ? `The ${choice.finish} finish you want.` : `Its finish isn't very ${choice.finish}.`;
    return "";
  };
  const real = parts.filter(p => p.key !== "score");
  const strong = real.filter(p => p.score >= 65 && (!p.key.startsWith("suits_") || p.n >= FEW_VOICES)).sort((x, y) => y.score - x.score);
  const weak = real.filter(p => !strong.includes(p)).sort((x, y) => x.score - y.score);
  // With written content the fit box uses its lines: the Why yes item that best meets the picks, the Why not item likewise,
  // with its tip or try-instead product.
  const W = P.page, picks = skinTags(choice);
  const top = (xs: ItemWire[]) => { const m = skinMatters(xs, picks, 1); return xs.find(x => m.has(x.title)) ?? xs[0] ?? null; };
  const yTop = W ? top(W.yes) : null, nTop = W ? top(W.no) : null;
  const why = yTop ? `${lineOf(yTop)}` : strong.slice(0, 2).map(p => partText(p, true)).join(" ") || null;
  const consider = base?.missing.length ? `Too few reports yet from people with ${base.missing.join(" or ")}.`
    : nTop ? `${lineOf(nTop)}${nTop.tip ? ` Tip: ${nTop.tip.t}` : ""}` : weak[0] ? partText(weak[0], false) : null;
  const considerAlt = !base?.missing.length && nTop?.alt && nTop.altCard ? nTop.altCard : null;
  const headline = !kind ? "" : kind === "good" ? (consider ? "Yes, with one note." : "Yes — a good fit.") : kind === "maybe" ? "Maybe — sample it first." : kind === "no" ? "Probably not this one." : "Not enough reports from skin like yours yet.";
  const sensOn = choice.concerns.includes("sensitive");
  const tags = [choice.skin, goal && goal !== "daily" ? GOAL_LABEL[goal] : null, sensOn ? "reactive" : null].filter((x): x is string => !!x);
  const bestFor = profile.attrs.filter(x => x.kind === "suits" && (sc(x.key)?.score ?? 0) >= 65 && (sc(x.key)?.n ?? 0) >= FEW_VOICES)
    .sort((x, y) => sc(y.key)!.score - sc(x.key)!.score).map(x => x.label.toLowerCase()).slice(0, 3);

  // ── Why yes, why not: the written content, or lines from the scores (no counts), "for your skin" from the picks.
  const yes: Item[] = [], no: Item[] = [];
  const few = !W && c.n < FEW_VOICES;
  if (W) {
    const m = { yes: skinMatters(W.yes, picks), no: skinMatters(W.no, picks) };
    const conv = (side: "yes" | "no") => (it: ItemWire, i: number): Item => ({ key: `${side}${i}`, title: it.title, ...splitMark(it.t), proof: it.proof,
      on: m[side].has(it.title), tip: it.tip?.t, alt: it.alt && it.altCard ? { t: it.alt.t, ...it.altCard } : undefined });
    yes.push(...W.yes.map(conv("yes"))); no.push(...W.no.map(conv("no")));
  } else if (!few) {
    const proof = "from real reviews, YouTube & blogs";
    const skinForYou = (g: string) => choice.skin === g || (g === "sensitive" && sensOn) || (g === "acne" && goal === "clear");
    for (const x of profile.attrs.filter(x => x.kind === "suits")) {
      const s = sc(x.key); if (!s || s.n < FEW_VOICES) continue; const g = x.key.slice(6), label = x.label.toLowerCase();
      if (s.score >= 65) yes.push({ key: x.key, title: `Good for ${label}`, pre: "", hl: `Works well for ${label}`, post: ".", proof: "from reviews that name a skin type", on: skinForYou(g) });
      else if (s.score < 50) no.push({ key: x.key, title: `Mixed for ${label}`, pre: "", hl: `Hit and miss for ${label}`, post: ".", proof: "from reviews that name a skin type", on: skinForYou(g) });
    }
    const q = (k: string, good: boolean) => { const s = sc(k); return s ? { s, n: good ? s.plus ?? 0 : s.minus ?? 0 } : null; };
    const H = q("hydration", true), Hm = q("hydration", false), G = q("gentle", true), Gm = q("gentle", false), B = q("breakouts", true), Bm = q("breakouts", false);
    const hydrationFor = goal === "hydrate" || choice.skin === "dry", gentleFor = sensOn || goal === "calm", breakFor = goal === "clear" || choice.skin === "oily";
    if (H && H.s.score >= 65 && H.n >= 3) yes.push({ key: "hyd", title: "Keeps skin hydrated", pre: "", hl: "Comfortable and hydrating", post: " through the day.", proof, on: hydrationFor });
    if (G && G.s.score >= 65 && G.n >= 3) yes.push({ key: "gen", title: "Gentle on reactive skin", pre: "", hl: "Rarely irritates", post: ", even on reactive skin.", proof, on: gentleFor });
    if (B && B.s.score >= 65 && B.n >= 3) yes.push({ key: "brk", title: "Kind to breakout-prone skin", pre: "", hl: "Rarely clogs pores", post: ", even on breakout-prone skin.", proof, on: breakFor });
    if (Hm && Hm.n >= 3 && Hm.n >= (H?.n ?? 0) * 0.25) no.push({ key: "hydm", title: "Can feel drying", pre: "", hl: "Not moisturizing enough", post: " for drier skin.", proof, on: hydrationFor });
    if (Gm && Gm.n >= 3 && Gm.n >= (G?.n ?? 0) * 0.25) no.push({ key: "genm", title: "Can irritate", pre: "", hl: "Can sting or redden", post: " reactive skin.", proof, on: gentleFor });
    if (Bm && Bm.n >= 3 && Bm.n >= (B?.n ?? 0) * 0.25) no.push({ key: "brkm", title: "Can clog pores", pre: "", hl: "Breaks some people out", post: ".", proof, on: breakFor });
    const tex = sc("texture");
    if (tex && applies(def("texture"), r.shape) && tex.score >= 70) no.push({ key: "rich", title: "Rich, can feel heavy", pre: "A ", hl: "rich texture", post: " that oily skin may find heavy.", proof, on: choice.skin === "oily" || choice.skin === "combination" });
    if (tex && applies(def("texture"), r.shape) && tex.score <= 30) yes.push({ key: "light", title: "Light, sinks in fast", pre: "A ", hl: "light texture", post: " that sinks in quickly.", proof, on: choice.skin === "oily" || choice.skin === "combination" });
  }
  const order = (xs: Item[]): Listed[] => { let n = 0; return xs.map(x => { const f = answered && x.on && n < 2; if (f) n++; return { ...x, forYou: f }; }).sort((p, q2) => Number(q2.forYou) - Number(p.forYou)); };
  const yesL = order(yes), noL = order(no);

  // ── How it feels & compares.
  const vizOf = (k: string, s: AttrScore | null | undefined): Viz => {
    if (!s) return null; const d = def(k);
    if (d.kind === "axis") return { kind: "axis", pct: s.score, word: attrWords(d, s) ?? "" };
    return { kind: "drops", n: dotsOf(s.score) };
  };
  const rowsFor = ROWS.filter(([k]) => applies(def(k), r.shape));
  const noteFor = (k: string, s: AttrScore | null) => {
    if (!s) return "Not enough said yet.";
    if (NOTE[k]) return NOTE[k][band(s)];
    const w = attrWords(def(k), s); return w ? `${w[0].toUpperCase()}${w.slice(1)}.` : "Not enough said yet.";
  };
  const self: SelfRow[] = [
    ...(choice.skin && choice.skin !== "normal" ? [{ name: `For ${choice.skin} skin`, v: vizOf(`suits_${choice.skin}`, sc(`suits_${choice.skin}`)), note: suitsNote(sc(`suits_${choice.skin}`), `${choice.skin} skin`) }] : []),
    ...rowsFor.map(([k, label]) => ({ name: label, v: vizOf(k, sc(k)), note: noteFor(k, sc(k)) })),
    ...(price ? [{ name: "Price", v: { kind: "text" as const, text: price }, note: "price band" }] : []),
  ];
  const pickQ = skinQuery({ ...choice, type: null, typeSlug: null }).size ? `?${skinQuery({ ...choice, type: null, typeSlug: null })}` : "";
  const alts = rankSkin(ctx, { ...choice, type: r.shape, typeSlug: P.type?.slug ?? null }, x => x.id !== r.id).slice(0, 3);
  const tabs: CmpTab[] = alts.map(x => {
    const b = x.r.attrs, card = P.peerCards[x.r.id];
    const rows = [...(choice.skin && choice.skin !== "normal" ? [`suits_${choice.skin}`] : []), ...rowsFor.map(([k]) => k)].map(k => {
      const sa = sc(k), sb = b.scores[k] ?? null, d = def(k), name = k.startsWith("suits_") ? `For ${choice.skin} skin` : ROWS.find(([kk]) => kk === k)![1];
      const da = sa && d.kind !== "axis" ? dotsOf(sa.score) : null, db = sb && d.kind !== "axis" ? dotsOf(sb.score) : null;
      return { k, name, a: vizOf(k, sa), b: vizOf(k, sb), aWin: da !== null && db !== null && da > db, bWin: da !== null && db !== null && db > da, da, db };
    });
    const pickIf: string[] = [], stayIf: string[] = [];
    let why = "similar";
    for (const row of rows) {
      if (row.da === null || row.db === null || row.da === row.db) continue;
      const phrase = row.k.startsWith("suits_") ? [`have ${choice.skin} skin`, `better for ${choice.skin} skin`] : PICK[row.k];
      if (!phrase) continue;
      if (row.db > row.da) { if (pickIf.length < 2) pickIf.push(phrase[0]); if (why === "similar") why = phrase[1]; } else if (stayIf.length < 2) stayIf.push(phrase[0]);
    }
    const ta = sc("texture"), tb = b.scores.texture;
    if (ta && tb && Math.abs(ta.score - tb.score) >= 20) { const lighter = tb.score < ta.score; const list = lighter ? pickIf : stayIf; if (list.length < 2) list.push(lighter ? "want something lighter" : "like a richer feel"); if (why === "similar") why = lighter ? "lighter" : "richer"; }
    const pb = typeof b.facts.price === "string" ? b.facts.price : null;
    if (price && pb && pb.length !== price.length) { const cheaper = pb.length < price.length; const list = cheaper ? pickIf : stayIf; if (list.length < 2) list.push(cheaper ? "want a cheaper option" : "want to spend less"); if (why === "similar" && cheaper) why = "cheaper"; }
    return { key: x.r.id, short: card.short, why, photo: card.photo, href: `${card.href}${pickQ}`,
      total: card.total, rows: rows.map(({ name: n, a: va, b: vb, aWin, bWin }) => ({ name: n, a: va, b: vb, aWin, bWin })), stayIf, pickIf };
  });

  const backLabel = skinPicked(choice) ? "← back to your matches" : `← all ${P.type ? P.type.label.toLowerCase() : P.many}`;
  const backHref = skinPicked(choice) ? skinHref(choice) : P.type ? `/${P.type.slug}` : P.catalogPath;
  return { answered, pct, kind, why, consider, considerAlt, few, bottom: W?.bottom ?? null, headline, tags, sensOn, bestFor, yesL, noL, self, tabs, backLabel, backHref, total: c.n };
}
