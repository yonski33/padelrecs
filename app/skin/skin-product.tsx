import "../rackets/[slug]/racket-fit.css";
import "./skin-product.css";
import Link from "next/link";
import { skinContext } from "./context";
import { rankSkin, skinMatch, GOAL_ATTR } from "./rank";
import { attrWords, dotsOf, FEW_VOICES, type AttrScore } from "../../lib/attr-score";
import { applies } from "../../lib/attr-profile";
import { SKIN_TYPES, GOALS, skinHref, skinPicked, skinAnswered, skinQuery, type SkinChoice, type Goal } from "../../lib/skin-choice";
import { niche, catalogPath, productHref, typePageFor } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { shortLine } from "../../lib/short-lines";
import { listLine } from "../../lib/list-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { onePerChannel, videoOf } from "../../lib/youtube-pick";
import { plainSummary } from "../../lib/plain-summary";
import RacketReviews, { type ReviewCard } from "../rackets/[slug]/racket-reviews";
import ProductCompare, { type CmpTab, type SelfRow, type Viz } from "./product-compare";
import ProductSticky from "./product-sticky";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { V2Footer } from "../v2-footer";

/** The SkinRecs product page in the beauty design (owner 2026-11-16, Claude Design "SkinRecs product page"): hero with the
 *  skin score; a skin check (1. skin type, 2. what you want it to do, optional "reacts easily") answered from people with your
 *  skin; the bottom line; Why yes / why not with "for your skin" tags; How it feels & compares (drops and sliders, tabs against
 *  close alternatives with "stay with this one / pick X if you…"); reviews; ingredients & details; a floating match card. Picks
 *  live in the URL (?skin=&goal=&sens=1), so each answer is a server-rendered, shareable page. Every number is a real count. */
const PILL = { good: ["Strong fit", "oklch(0.9 0.05 155)"], maybe: ["Worth a try", "oklch(0.93 0.03 70)"], no: ["Probably not", "oklch(0.93 0.04 30)"] } as const;
const GOAL_LABEL: Record<Goal, string> = { hydrate: "hydrate", calm: "calm", clear: "clear skin", daily: "just everyday" };
const DAY = 864e5;
function agoShort(iso?: string | null) {
  if (!iso) return null; const d = Math.max(0, (Date.now() - Date.parse(iso)) / DAY); if (!Number.isFinite(d)) return null;
  return d < 1 ? "today" : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
const reviewsWord = (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`;
type Item = { key: string; title: string; pre: string; hl: string; post: string; proof: string; on: boolean };

export default async function SkinProduct({ productId, choice, buy, jsonLd }: { productId: string; choice: SkinChoice;
  buy: { url: string; label: string; rel: string } | null; jsonLd: object }) {
  const ctx = await skinContext(), { data, profile } = ctx;
  const r = data.rackets.find(x => x.id === productId)!;
  const brand = data.brands.find(b => b.id === r.brandId);
  const name = displayName(r.name, brand?.name), title = brand && r.name.startsWith(brand.name) ? r.name.slice(brand.name.length).trim() : r.name;
  const a = ctx.attrs.get(r.id) ?? { scores: {}, facts: {} }, c = ctx.counts.get(r.id) ?? { n: 0, positive: 0, mixed: 0, negative: 0 };
  const photoOf = (x: typeof r) => photoHidden(x) ? null : shopPhoto(x) ?? amazonPhoto(x)?.image ?? null;
  const photo = photoOf(r), signal = ctx.signal(r.id), rated = c.positive + c.mixed + c.negative;
  const type = typePageFor(r.shape), here = productHref(r);
  const def = (k: string) => profile.attrs.find(x => x.key === k)!;
  const sc = (k: string): AttrScore | null => a.scores[k] ?? null;
  const ff = a.facts.fragrance_free, spf = a.facts.spf, price = typeof a.facts.price === "string" ? a.facts.price : null;
  const hook = shortLine(r) ?? listLine(r) ?? (r.reviewSummary ? r.reviewSummary.split(/(?<=\.)\s/)[0] : null);
  const at = (next: SkinChoice) => skinHref({ ...next, type: null, typeSlug: null }, here, "#bp-hero");

  // ── The skin check: skin type + what you want it to do (+ reacts easily). The match is the engine's, plus the goal's score.
  const answered = skinAnswered(choice);
  const goal = choice.goal;
  const base = answered ? skinMatch(ctx, r.id, choice) : null;
  void GOAL_ATTR;
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
  const tags = [choice.skin, goal && goal !== "daily" ? GOAL_LABEL[goal] : null, choice.concerns.includes("sensitive") ? "reactive" : null].filter((x): x is string => !!x);
  const pill = (label: string, next: SkinChoice, on: boolean, small = false) =>
    <Link key={label} href={at(next)} scroll={false} replace className={`bp-pick${on ? " on" : ""}${small ? " sm" : ""}`} aria-current={on ? "true" : undefined}>{label}</Link>;
  const sensOn = choice.concerns.includes("sensitive");
  const sensNext = { ...choice, concerns: sensOn ? choice.concerns.filter(x => x !== "sensitive") : [...choice.concerns, "sensitive"], noConcerns: false };
  const typesRow = (small = false) => SKIN_TYPES.map(k => pill(k, { ...choice, skin: k }, choice.skin === k, small));
  const goalsRow = (small = false) => GOALS.map(g => pill(GOAL_LABEL[g], { ...choice, goal: g }, goal === g, small));
  const bestFor = profile.attrs.filter(x => x.kind === "suits" && (sc(x.key)?.score ?? 0) >= 65 && (sc(x.key)?.n ?? 0) >= FEW_VOICES)
    .sort((x, y) => sc(y.key)!.score - sc(x.key)!.score).map(x => x.label.toLowerCase()).slice(0, 3);

  // ── Why yes, why not: from the scores, each with its real count, a reader's exact words where we have them, and "for your skin".
  const quotes = ctx.quotes.get(r.id) ?? [];
  const quoteFor = (attr: string, sign: 1 | -1) => quotes.filter(q => q.attribute === attr && Math.sign(q.value ?? 0) === sign && q.quote && q.quote.length >= 14 && q.quote.length <= 110)
    .sort((x, y) => y.strength - x.strength || (y.saidAt ?? "").localeCompare(x.saidAt ?? ""))[0]?.quote ?? null;
  const said = (q: string | null, fallback: [string, string, string]): [string, string, string] => q ? ["People say ", `“${q}”`, "."] : fallback;
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
  if (H && H.s.score >= 65 && H.n >= 3) yes.push({ key: "hyd", title: "Keeps skin hydrated", ...pph(said(quoteFor("hydration", 1), ["", "Comfortable and hydrating", " for most reviewers."])), proof: `${reviewsWord(H.n)} mention it`, on: hydrationFor });
  if (G && G.s.score >= 65 && G.n >= 3) yes.push({ key: "gen", title: "Gentle on reactive skin", ...pph(said(quoteFor("gentle", 1), ["", "Rarely irritates", ", even on reactive skin."])), proof: `${reviewsWord(G.n)} call it gentle`, on: gentleFor });
  if (B && B.s.score >= 65 && B.n >= 3) yes.push({ key: "brk", title: "Helps calm breakouts", ...pph(said(quoteFor("breakouts", 1), ["", "Cleared breakouts", " for some reviewers."])), proof: `${reviewsWord(B.n)} say so`, on: breakFor });
  if (Hm && Hm.n >= 3 && Hm.n >= (H?.n ?? 0) * 0.25) no.push({ key: "hydm", title: "Can feel drying", ...pph(said(quoteFor("hydration", -1), ["", "Not moisturizing enough", " for some."])), proof: `${reviewsWord(Hm.n)} mention it`, on: hydrationFor });
  if (Gm && Gm.n >= 3 && Gm.n >= (G?.n ?? 0) * 0.25) no.push({ key: "genm", title: "Can irritate", ...pph(said(quoteFor("gentle", -1), ["", "Stinging or redness", " for some reviewers."])), proof: `${reviewsWord(Gm.n)} mention irritation`, on: gentleFor });
  if (Bm && Bm.n >= 3 && Bm.n >= (B?.n ?? 0) * 0.25) no.push({ key: "brkm", title: "Can clog pores", ...pph(said(quoteFor("breakouts", -1), ["", "Breakouts or clogged pores", " for some reviewers."])), proof: `${reviewsWord(Bm.n)} say it broke them out`, on: breakFor });
  const tex = sc("texture");
  if (tex && applies(def("texture"), r.shape) && tex.score >= 70) no.push({ key: "rich", title: "Rich, can feel heavy", pre: "Most describe it as ", hl: "rich", post: "; oily skin may find it heavy.", proof: `${reviewsWord(tex.n)} describe the texture`, on: choice.skin === "oily" || choice.skin === "combination" });
  if (tex && applies(def("texture"), r.shape) && tex.score <= 30) yes.push({ key: "light", title: "Light, sinks in fast", pre: "Most describe it as ", hl: "light", post: ".", proof: `${reviewsWord(tex.n)} describe the texture`, on: choice.skin === "oily" || choice.skin === "combination" });
  const order = (xs: Item[]) => { let n = 0; return xs.map(x => { const f = answered && x.on && n < 2; if (f) n++; return { ...x, forYou: f }; }).sort((p, q2) => Number(q2.forYou) - Number(p.forYou)); };
  const yesL = order(yes), noL = order(no);

  // ── How it feels & compares.
  const vizOf = (k: string, s: AttrScore | null | undefined): Viz => {
    if (!s) return null; const d = def(k);
    if (d.kind === "axis") return { kind: "axis", pct: s.score, word: attrWords(d, s) ?? "" };
    return { kind: "drops", n: dotsOf(s.score) };
  };
  const ROWS = [["hydration", "Hydration"], ["gentle", "Gentleness"], ["breakouts", "Clog-free"], ["texture", "Texture (light ↔ rich)"], ["finish", "Finish (matte ↔ dewy)"]] as const;
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
  const alts = rankSkin(ctx, { ...choice, type: r.shape, typeSlug: type?.slug ?? null }).filter(x => x.r.id !== r.id && x.r.slug !== r.slug && x.r.name !== r.name).slice(0, 3);
  const PICK: Record<string, [string, string]> = { hydration: ["want more hydration", "more hydrating"], gentle: ["need something gentler", "gentler"], breakouts: ["break out easily", "fewer breakouts"] };
  const tabs: CmpTab[] = alts.map(x => {
    const b = ctx.attrs.get(x.r.id) ?? { scores: {}, facts: {} }, bc = ctx.counts.get(x.r.id);
    const rows = [...(choice.skin && choice.skin !== "normal" ? [`suits_${choice.skin}`] : []), ...rowsFor.map(([k]) => k)].map(k => {
      const sa = sc(k), sb = b.scores[k] ?? null, d = def(k), name = k.startsWith("suits_") ? `For ${choice.skin} skin` : ROWS.find(([kk]) => kk === k)![1];
      const da = sa && d.kind !== "axis" ? dotsOf(sa.score) : null, db = sb && d.kind !== "axis" ? dotsOf(sb.score) : null;
      return { k, name, a: vizOf(k, sa), b: vizOf(k, sb), aWin: da !== null && db !== null && da > db, bWin: da !== null && db !== null && db > da, da, db, sa, sb };
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
    return { key: x.r.id, short: displayName(x.r.name, data.brands.find(bb => bb.id === x.r.brandId)?.name).replace(/^(\S+\s\S+\s\S+).*$/, "$1"), why, photo: photoOf(x.r), href: `${productHref(x.r)}${skinQuery({ ...choice, type: null, typeSlug: null }).size ? `?${skinQuery({ ...choice, type: null, typeSlug: null })}` : ""}`,
      total: bc?.n ?? 0, rows: rows.map(({ name: n, a: va, b: vb, aWin, bWin }) => ({ name: n, a: va, b: vb, aWin, bWin })), stayIf, pickIf };
  });

  // ── Reviews: our own, YouTube (one card per channel) and beauty blogs; forum reports count in the scores but aren't listed.
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const ytProducts = new Map<string, number>(), ytSeen = new Set<string>();
  for (const e of data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !ytSeen.has(`${v}|${e.racketId}`)) { ytSeen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const mine = data.external.filter(e => e.racketId === r.id);
  const cards: ReviewCard[] = [
    ...data.reviews.filter(x => x.racketId === r.id).map(x => ({ at: x.createdAt, card: { id: x.id, kind: "player" as const, who: x.alias || "A SkinRecs user", meta: x.playerLevel?.toLowerCase() ?? null, verdict: (x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative") as ReviewCard["verdict"], when: agoShort(x.createdAt), text: x.reviewText, verbatim: true } })),
    ...onePerChannel(mine.filter(e => e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).map(e => { const text = e.summary ? plainSummary(e.summary) : e.excerpt ?? "";
      return { at: e.sourceDate ?? "", card: { id: e.id, kind: "youtube" as const, who: e.sourceName, verdict: e.sentiment ?? null, when: agoShort(e.sourceDate), url: e.sourceUrl, video: vid(e.sourceUrl), comment: /[?&]lc=/.test(e.sourceUrl), points: e.summary && !/[?&]lc=/.test(e.sourceUrl) ? sentences(text).slice(0, 4) : [text] } }; }),
    ...mine.filter(e => e.sourcePlatform === "Blog").map(e => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "player" as const, who: e.sourceName, initial: (e.sourceName[0] ?? "B").toUpperCase(), meta: null, source: "blog",
      verdict: e.sentiment ?? null, when: agoShort(e.sourceDate), url: e.sourceUrl, text: e.summary ? plainSummary(e.summary) : e.excerpt ?? "", verbatim: !e.summary } })),
  ].filter(x => x.card.kind === "youtube" ? !!x.card.points?.[0] : !!x.card.text).sort((x, y) => y.at.localeCompare(x.at)).map(x => x.card);
  const skinOpts = SKIN_TYPES.map(k => ({ value: k[0].toUpperCase() + k.slice(1), label: k }));
  const specs = [["type", r.shape?.toLowerCase()], ["size", r.weight], ["key ingredients", r.core], ["maker says", r.surface],
    ["fragrance", ff === "free" ? "none" : ff === "oils" ? "no added fragrance, essential oils" : ff ? "contains fragrance" : null], ["SPF", spf ? String(spf) : null], ["price", price]].filter((x): x is [string, string] => !!x[1]);
  const backLabel = skinPicked(choice) ? "← back to your matches" : `← all ${type ? type.label.toLowerCase() : niche.words.many}`;
  const backHref = skinPicked(choice) ? skinHref(choice) : type ? `/${type.slug}` : catalogPath;
  const bar = (h: number) => <span className="bp-mood" style={{ height: h }} aria-hidden="true"><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>;

  return <><main className={`bp ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="bp-wrap">
      <a className="bp-back" href={backHref}>{backLabel}</a>
      <section id="bp-hero" className="bp-hero">
        <div className="bp-id">
          <div className="bp-shot">{photo ? <img src={photo} alt={name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span>product photo</span>}</div>
          <div className="bp-idt">
            <div className="bp-chips">{[r.shape?.toLowerCase(), ff === "free" ? "fragrance-free" : null, spf ? `SPF ${spf}` : null, price].filter(Boolean).map(x => <span key={x}>{x}</span>)}</div>
            {brand && <div className="bp-brand">{brand.name}</div>}
            <h1>{title || name}</h1>
            {hook && <p className="bp-hook">{hook}</p>}
            <a className="bp-score" href="#reviews"><span>{signal !== null && <strong>{signal}</strong>}{`${signal !== null ? " skin score · " : ""}${rated} rated`}</span>{rated > 0 && bar(6)}</a>
            {buy && <div className="bp-buyrow"><a className="bp-btn" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a></div>}
            {buy && <p className="bp-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>
        <div className="bp-check">
          {!base ? <div className="bp-ask">
            <span className="bp-tag">✦ skin check</span>
            <div><div className="bp-q">Is this right for <em>your</em> skin?</div>
              <div className="bp-sub">{`Two taps and we'll check it against ${reviewsWord(c.n)} from people with your skin.`}</div></div>
            <div className="bp-steps">
              <div><span className="bp-sl">1. Your skin type</span><div className="bp-picks">{typesRow()}</div></div>
              <div><span className="bp-sl">2. What do you want it to do?</span><div className="bp-picks">{goalsRow()}</div></div>
              <Link href={at(sensNext)} scroll={false} replace className="bp-sens" aria-current={sensOn ? "true" : undefined}><i>{sensOn ? "✓" : ""}</i>My skin reacts easily <span>(optional)</span></Link>
            </div>
            {bestFor.length > 0 && <div className="bp-best"><strong>Generally best for</strong>{` ${bestFor.join(", ")}.`}</div>}
          </div> : <div className="bp-ans" aria-live="polite">
            <div className="bp-ansh"><span className="bp-tag">✦ your match</span>
              <span className="bp-verdict" style={{ background: kind && kind !== "thin" ? PILL[kind][1] : "#f4ede6" }}>{pct === null ? "— · not enough reports" : `${pct}% · ${PILL[kind as "good"][0]}`}</span></div>
            <div><div className="bp-q big">{headline}</div><div className="bp-sub">{`For your ${tags.join(", ")} skin, here's the short answer.`}</div></div>
            {why && <div className="bp-why"><span>✓ Why it suits you</span><p>{why}</p></div>}
            {consider && <div className="bp-know"><span>◦ Worth knowing</span><p>{consider}</p></div>}
            <input type="checkbox" id="bp-edit" className="bp-edit-t" aria-label="Edit your answers"/>
            <div className="bp-foot"><span>{tags.map(t => t[0].toUpperCase() + t.slice(1)).join(" · ")}</span>
              <span><label htmlFor="bp-edit" className="bp-editl"><span className="o">edit</span><span className="c">done ✓</span></label><Link href={here} scroll={false} replace>start over</Link></span></div>
            <div className="bp-editp"><div className="bp-picks">{typesRow(true)}</div><div className="bp-picks">{goalsRow(true)}
              <Link href={at(sensNext)} scroll={false} replace className="bp-sens sm" aria-current={sensOn ? "true" : undefined}><i>{sensOn ? "✓" : ""}</i>reactive</Link></div></div>
          </div>}
        </div>
      </section>

      <section className="bp-col">
        {!answered && r.reviewSummary && <div className="bp-bottom"><span className="bp-tag">the bottom line</span><span>{r.reviewSummary}</span></div>}
        {(yesL.length > 0 || noL.length > 0) && <div id="yes-no">
          <div className="bp-h"><h2>Why yes, why not</h2><span>{answered ? `sorted for your ${tags.join(" · ")} skin` : "from real reviews, YouTube & blogs"}</span></div>
          <div className="bp-yn">
            {[["yes", "Why yes", "✓", yesL], ["no", "Why not", "!", noL]].map(([k, label, icon, list]) => (list as typeof yesL).length > 0 && <div key={k as string} className={`bp-card bp-side-${k}`}>
              <div className="bp-ynh"><i>{icon as string}</i><b>{label as string}</b></div>
              <input type="checkbox" id={`bp-more-${k}`} className="bp-more-t" aria-label="Show all"/>
              {(list as typeof yesL).map((p, i) => <div key={p.key} className={`bp-item${p.forYou ? " you" : ""}${i >= 3 ? " extra" : ""}`}>
                <div className="bp-it"><b>{p.title}</b>{p.forYou && <span className="bp-tag sm">for your skin</span>}</div>
                <span className="bp-txt">{p.pre}<mark>{p.hl}</mark>{p.post}</span>
                <span className="bp-proof">{p.proof}</span></div>)}
              {(list as typeof yesL).length > 3 && <label htmlFor={`bp-more-${k}`} className="bp-morel"><span className="o">{`+ ${(list as typeof yesL).length - 3} more`}</span><span className="c">− show less</span></label>}
            </div>)}
          </div>
        </div>}
        {self.length > 0 && <div id="compare"><h2 className="bp-h2">How it feels &amp; compares</h2>
          <ProductCompare self={self} tabs={tabs} selfTotal={c.n} photo={photo}/></div>}
      </section>

      <section id="reviews" className="bp-col bp-rv rf">
        <RacketReviews racketId={r.id} name={title || name} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []} total={c.n}
          mood={{ pos: c.positive, mix: c.mixed, neg: c.negative, score: signal }}
          words={{ levelLead: "My skin is", levels: skinOpts, score: "Skin score", ask: "Tried it?", people: "people", peopleTab: "people" }}/>
      </section>

      {specs.length > 0 && <section className="bp-col"><details className="bp-specs"><summary><span>Ingredients &amp; details</span><i aria-hidden="true"/></summary>
        <div className="bp-speclist">{specs.map(([k, v]) => <span key={k}><em>{k}</em> {v}</span>)}</div></details></section>}

      <ProductSticky pct={pct} word={kind && kind !== "thin" ? PILL[kind][0] : null} pillBg={kind && kind !== "thin" ? PILL[kind][1] : "#f4ede6"} buy={buy}/>
    </div>
  </main><V2Footer/></>;
}

/** Splits a [pre, highlight, post] triple into the item's fields. */
function pph([pre, hl, post]: [string, string, string]) { return { pre, hl, post }; }
