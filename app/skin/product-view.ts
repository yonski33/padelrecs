// The SkinRecs product page's answers for one set of picks (skin type, goal, reacts easily): the skin check, why yes / why not
// in "for your skin" order, and "How it feels & compares" against close alternatives. Pure: the browser re-runs it on a tap
// (app/skin/skin-product-live.tsx, app/instant-view.ts) from the data the page sends once (ProductInput, built on the server in
// app/skin/skin-product.tsx). Every number is a real count.
import { skinMatch, rankSkin, wireCtx, type SkinWire } from "./rank";
import { attrWords, dotsOf, FEW_VOICES, type AttrScore } from "../../lib/attr-score";
import { applies, type AttrProfile } from "../../lib/attr-profile";
import { skinHref, skinPicked, skinAnswered, skinQuery, type SkinChoice, type Goal } from "../../lib/skin-choice";
import type { CmpTab, SelfRow, Viz } from "./product-compare";

export type ProductInput = {
  self: SkinWire; /** Other listed products of its type (not itself, nor another listing of it). */ peers: SkinWire[];
  peerCards: Record<string, { short: string; photo: string | null; href: string; total: number }>;
  here: string; type: { slug: string; label: string } | null; catalogPath: string; many: string;
  counts: { n: number; positive: number; mixed: number; negative: number };
  /** A reader's words per score and side ("hydration:1"), where we have them. */ quotes: Record<string, string | null>;
};
type Item = { key: string; title: string; pre: string; hl: string; post: string; proof: string; on: boolean };
export type Listed = Item & { forYou: boolean };

export const GOAL_LABEL: Record<Goal, string> = { hydrate: "hydrate", calm: "calm", clear: "clear skin", daily: "just everyday" };
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
const reviewsWord = (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`;
const ROWS = [["hydration", "Hydration"], ["gentle", "Gentleness"], ["breakouts", "Clog-free"], ["texture", "Texture (light ↔ rich)"], ["finish", "Finish (matte ↔ dewy)"]] as const;
const PICK: Record<string, [string, string]> = { hydration: ["want more hydration", "more hydrating"], gentle: ["need something gentler", "gentler"], breakouts: ["break out easily", "fewer breakouts"] };
/** The quotes a page sends: each of these scores, both sides. */
export const QUOTE_KEYS = ["hydration", "gentle", "breakouts"] as const;

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
    if (p.key.startsWith("suits_")) return s && s.n < FEW_VOICES ? `Only ${people(s.n)} with ${p.label} so far.` : good ? `Loved by ${p.label}: ${s?.plus ?? 0} of ${s?.n ?? 0} liked it.` : `Split for ${p.label}: ${s?.plus ?? 0} of ${s?.n ?? 0} liked it.`;
    if (p.key === "hydration") return good ? `Reviewers call it hydrating (${reviewsWord(s?.plus ?? 0)}).` : `${s?.minus ? `${reviewsWord(s.minus)} found it drying.` : "Few call it hydrating."}`;
    if (p.key === "gentle") return good ? `Gentle: ${reviewsWord(s?.plus ?? 0)} say so.` : `${reviewsWord(s?.minus ?? 0)} mention irritation.`;
    if (p.key === "breakouts") return good ? `Rarely breaks people out.` : `${reviewsWord(s?.minus ?? 0)} say it broke them out.`;
    if (p.key === "texture") return good ? `Its texture suits your skin.` : `The texture may not suit ${choice.skin} skin.`;
    if (p.key === "finish") return good ? `The ${choice.finish} finish you want.` : `Its finish isn't very ${choice.finish}.`;
    return "";
  };
  const real = parts.filter(p => p.key !== "score");
  const strong = real.filter(p => p.score >= 65 && (!p.key.startsWith("suits_") || p.n >= FEW_VOICES)).sort((x, y) => y.score - x.score);
  const weak = real.filter(p => !strong.includes(p)).sort((x, y) => x.score - y.score);
  const why = strong.slice(0, 2).map(p => partText(p, true)).join(" ") || null;
  const consider = base?.missing.length ? `Too few reports yet from people with ${base.missing.join(" or ")}.` : weak[0] ? partText(weak[0], false) : null;
  const headline = !kind ? "" : kind === "good" ? (consider ? "Yes, with one note." : "Yes — a good fit.") : kind === "maybe" ? "Maybe — sample it first." : kind === "no" ? "Probably not this one." : "Not enough reports from skin like yours yet.";
  const sensOn = choice.concerns.includes("sensitive");
  const tags = [choice.skin, goal && goal !== "daily" ? GOAL_LABEL[goal] : null, sensOn ? "reactive" : null].filter((x): x is string => !!x);
  const bestFor = profile.attrs.filter(x => x.kind === "suits" && (sc(x.key)?.score ?? 0) >= 65 && (sc(x.key)?.n ?? 0) >= FEW_VOICES)
    .sort((x, y) => sc(y.key)!.score - sc(x.key)!.score).map(x => x.label.toLowerCase()).slice(0, 3);

  // ── Why yes, why not: from the scores, each with its real count, a reader's exact words where we have them, and "for your skin".
  const said = (q: string | null | undefined, fallback: [string, string, string]): [string, string, string] => q ? ["People say ", `“${q}”`, "."] : fallback;
  const pph = ([pre, hl, post]: [string, string, string]) => ({ pre, hl, post });
  const yes: Item[] = [], no: Item[] = [];
  const skinForYou = (g: string) => choice.skin === g || (g === "sensitive" && sensOn) || (g === "acne" && goal === "clear");
  for (const x of profile.attrs.filter(x => x.kind === "suits")) {
    const s = sc(x.key); if (!s || s.n < FEW_VOICES) continue; const g = x.key.slice(6), label = x.label.toLowerCase();
    if (s.score >= 65) yes.push({ key: x.key, title: `Loved by ${label}`, pre: "", hl: `${s.plus} of ${s.n}`, post: ` people with ${label} liked it.`, proof: "from people who said their skin type", on: skinForYou(g) });
    else if (s.score < 50) no.push({ key: x.key, title: `Often not for ${label}`, pre: "Only ", hl: `${s.plus} of ${s.n}`, post: ` people with ${label} liked it.`, proof: "from people who said their skin type", on: skinForYou(g) });
  }
  const q = (k: string, good: boolean) => { const s = sc(k); return s ? { s, n: good ? s.plus ?? 0 : s.minus ?? 0 } : null; };
  const H = q("hydration", true), Hm = q("hydration", false), G = q("gentle", true), Gm = q("gentle", false), B = q("breakouts", true), Bm = q("breakouts", false);
  const hydrationFor = goal === "hydrate" || choice.skin === "dry", gentleFor = sensOn || goal === "calm", breakFor = goal === "clear" || choice.skin === "oily";
  const Q = (k: string, sign: 1 | -1) => P.quotes[`${k}:${sign}`];
  if (H && H.s.score >= 65 && H.n >= 3) yes.push({ key: "hyd", title: "Keeps skin hydrated", ...pph(said(Q("hydration", 1), ["", "Comfortable and hydrating", " for most reviewers."])), proof: `${reviewsWord(H.n)} mention it`, on: hydrationFor });
  if (G && G.s.score >= 65 && G.n >= 3) yes.push({ key: "gen", title: "Gentle on reactive skin", ...pph(said(Q("gentle", 1), ["", "Rarely irritates", ", even on reactive skin."])), proof: `${reviewsWord(G.n)} call it gentle`, on: gentleFor });
  if (B && B.s.score >= 65 && B.n >= 3) yes.push({ key: "brk", title: "Helps calm breakouts", ...pph(said(Q("breakouts", 1), ["", "Cleared breakouts", " for some reviewers."])), proof: `${reviewsWord(B.n)} say so`, on: breakFor });
  if (Hm && Hm.n >= 3 && Hm.n >= (H?.n ?? 0) * 0.25) no.push({ key: "hydm", title: "Can feel drying", ...pph(said(Q("hydration", -1), ["", "Not moisturizing enough", " for some."])), proof: `${reviewsWord(Hm.n)} mention it`, on: hydrationFor });
  if (Gm && Gm.n >= 3 && Gm.n >= (G?.n ?? 0) * 0.25) no.push({ key: "genm", title: "Can irritate", ...pph(said(Q("gentle", -1), ["", "Stinging or redness", " for some reviewers."])), proof: `${reviewsWord(Gm.n)} mention irritation`, on: gentleFor });
  if (Bm && Bm.n >= 3 && Bm.n >= (B?.n ?? 0) * 0.25) no.push({ key: "brkm", title: "Can clog pores", ...pph(said(Q("breakouts", -1), ["", "Breakouts or clogged pores", " for some reviewers."])), proof: `${reviewsWord(Bm.n)} say it broke them out`, on: breakFor });
  const tex = sc("texture");
  if (tex && applies(def("texture"), r.shape) && tex.score >= 70) no.push({ key: "rich", title: "Rich, can feel heavy", pre: "Most describe it as ", hl: "rich", post: "; oily skin may find it heavy.", proof: `${reviewsWord(tex.n)} describe the texture`, on: choice.skin === "oily" || choice.skin === "combination" });
  if (tex && applies(def("texture"), r.shape) && tex.score <= 30) yes.push({ key: "light", title: "Light, sinks in fast", pre: "Most describe it as ", hl: "light", post: ".", proof: `${reviewsWord(tex.n)} describe the texture`, on: choice.skin === "oily" || choice.skin === "combination" });
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
    if (k === "hydration") return `${reviewsWord(s.plus ?? 0)} call it hydrating${s.minus ? `, ${s.minus} found it drying` : ""}.`;
    if (k === "gentle") return `${reviewsWord(s.plus ?? 0)} call it gentle${s.minus ? `, ${s.minus} mention irritation` : ""}.`;
    if (k === "breakouts") return s.minus ? `${reviewsWord(s.minus)} say it broke them out${s.plus ? `, ${s.plus} say it cleared skin` : ""}.` : `${s.plus ? `${reviewsWord(s.plus)} say it cleared their skin.` : "No breakout complaints."}`;
    return `${attrWords(def(k), s)} · ${reviewsWord(s.n)} describe it.`;
  };
  const self: SelfRow[] = [
    ...(choice.skin && choice.skin !== "normal" ? [{ name: `For ${choice.skin} skin`, v: vizOf(`suits_${choice.skin}`, sc(`suits_${choice.skin}`)), note: sc(`suits_${choice.skin}`) ? `${sc(`suits_${choice.skin}`)!.plus} of ${sc(`suits_${choice.skin}`)!.n} people with ${choice.skin} skin liked it.` : `Not enough reports from ${choice.skin} skin yet.` }] : []),
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
  return { answered, pct, kind, why, consider, headline, tags, sensOn, bestFor, yesL, noL, self, tabs, backLabel, backHref, total: c.n };
}
