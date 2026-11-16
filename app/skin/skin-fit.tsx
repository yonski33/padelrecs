import "../rackets/[slug]/racket-fit.css";
import "./skin-v2.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { skinContext } from "./context";
import { rankSkin, fitWord, reasonOf } from "./rank";
import { attrWords, dotsOf, FEW_VOICES } from "../../lib/attr-score";
import { applies } from "../../lib/attr-profile";
import { SKIN_TYPES, skinHref, skinPicked, skinAnswered, skinWords, skinQuery, type SkinChoice } from "../../lib/skin-choice";
import { niche, catalogPath, productHref, typePageFor, v2copy } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { platformName } from "../../lib/source-label";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { V2Footer } from "../v2-footer";
import RacketReviews, { type ReviewCard } from "../rackets/[slug]/racket-reviews";
import SkinSticky from "./skin-sticky";
import { onePerChannel, videoOf } from "../../lib/youtube-pick";
import { plainSummary } from "../../lib/plain-summary";

/** The SkinRecs product page in design v2, laid out as padel's final racket page (app/rackets/[slug]/racket-fit.tsx, owner
 *  2026-11-16: "match the padel racket page"): the hero with the user-score line and Check price, the fit check for the visitor's
 *  skin (?skin=&sens=1&acne=1&finish=, as the home's quick match) with a verdict, one column with who it suits (from what people
 *  with each skin type said), how it feels and their words, the shared Reviews block, Specs, and the floating match box. */
const SOURCE: Record<string, string> = { youtube: "youtube", blog: "blog", player_report: "forum", own_review: "skinrecs" };
const DAY = 86_400_000;
function ago(iso?: string | null) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - Date.parse(iso)) / DAY);
  return days < 14 ? `${Math.max(1, days)} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
/** "5d ago", "3 mo ago", "1 yr ago" for a review card (as padel's racket page). */
function agoShort(iso?: string | null) {
  if (!iso) return null; const d = Math.max(0, (Date.now() - Date.parse(iso)) / 864e5); if (!Number.isFinite(d)) return null;
  return d < 1 ? "today" : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}
const clip = (t: string, n = 200) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;
const segs = (n: number) => <span className="rf-segs" role="img" aria-label={`${n} of 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? "on" : undefined}/>)}</span>;

export default async function SkinFit({ productId, choice, buy, jsonLd }: { productId: string; choice: SkinChoice; crumbs?: ReactNode;
  buy: { url: string; label: string; rel: string } | null; jsonLd: object }) {
  const ctx = await skinContext(), { data, profile } = ctx;
  const r = data.rackets.find(x => x.id === productId)!;
  const brand = data.brands.find(b => b.id === r.brandId);
  const name = displayName(r.name, brand?.name);
  const a = ctx.attrs.get(r.id) ?? { scores: {}, facts: {} }, c = ctx.counts.get(r.id) ?? { n: 0, positive: 0, mixed: 0, negative: 0 };
  const photo = photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const picked = skinPicked(choice);
  // The verdict waits for both required steps, skin type then concerns (owner 2026-11-16: not from the skin type alone).
  const answered = skinAnswered(choice);
  const m = answered ? ctx.match(r.id, choice) : null;
  const here = productHref(r), at = (next: SkinChoice) => skinHref({ ...next, type: null, typeSlug: null }, here, "#fit");
  const type = typePageFor(r.shape);
  const def = (k: string) => profile.attrs.find(x => x.key === k)!;
  const suits = profile.attrs.filter(x => x.kind === "suits");
  const bestFor = suits.filter(x => (a.scores[x.key]?.score ?? 0) >= 65 && (a.scores[x.key]?.n ?? 0) >= FEW_VOICES).sort((x, y) => a.scores[y.key]!.score - a.scores[x.key]!.score).map(x => x.label.toLowerCase());
  const ff = a.facts.fragrance_free, spf = a.facts.spf;
  const facts = [
    ff ? ["Fragrance", ff === "free" ? "fragrance-free" : ff === "oils" ? "no added fragrance, but essential oils" : "contains fragrance"] : null,
    applies(def("spf"), r.shape) ? ["SPF", spf ? `SPF ${spf}` : "not listed yet"] : null,
    r.core ? ["Key ingredients", r.core] : null, r.surface ? ["Maker says", r.surface] : null, r.weight ? ["Size", r.weight] : null,
  ].filter((x): x is string[] => !!x);
  // Quotes behind the answer: the picked skin types' writers first, then the strongest feel rows; one per report.
  const rows = ctx.quotes.get(r.id) ?? [];
  const wanted = [...(choice.skin ? [`suits_${choice.skin}`] : []), ...choice.concerns.map(k => `suits_${k}`)];
  type Rep = { text: string; url: string | null; src: string; date: string; sentiment: string | null };
  const report = new Map<string, Rep>([...data.reviews.filter(x => x.racketId === r.id).map((x): [string, Rep] => [`p:${x.id}`, { text: x.reviewText, url: null, src: "skinrecs", date: x.createdAt, sentiment: x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative" }]),
    ...data.external.filter(e => e.racketId === r.id).map((e): [string, Rep] => [`w:${e.id}`, { text: e.summary ?? e.excerptTranslation ?? e.excerpt ?? "", url: e.sourceUrl, src: platformName(e.sourcePlatform).toLowerCase(), date: e.sourceDate || e.createdAt, sentiment: e.sentiment }])]);
  const seenRep = new Set<string>();
  const quoteRows = [...rows].filter(x => x.quote && (x.attribute.startsWith("suits_") || x.quote.length >= 12) && (wanted.length ? wanted.includes(x.attribute) : !x.attribute.startsWith("suits_")))
    .sort((x, y) => y.strength - x.strength || (y.saidAt ?? "").localeCompare(x.saidAt ?? ""))
    .filter(x => { const k = x.sourceRef.split("#")[0]; if (seenRep.has(k) || !report.has(k)) return false; seenRep.add(k); return true; }).slice(0, 3);
  const others = rankSkin(ctx, { ...choice, type: r.shape, typeSlug: type?.slug ?? null }).filter(x => x.r.id !== r.id && x.r.slug !== r.slug && x.r.name !== r.name).slice(0, 4);
  const pickQ = skinQuery({ ...choice, type: null, typeSlug: null }), q = pickQ.size ? `?${pickQ}` : "";
  const fit = m ? fitWord(m.pct) : null;
  // "Why it fits" only from a part that really fits (65+ and enough people); anything weaker goes under "What to consider".
  const strong = m?.parts.filter(p => p.key !== "score" && p.score >= 65 && (!p.key.startsWith("suits_") || p.n >= FEW_VOICES)).sort((x, y) => y.score - x.score)[0];
  const why = m && m.pct !== null && strong ? reasonOf(ctx, { ...m, parts: [strong] }) : null;
  const weakest = m?.parts.filter(p => p.key !== "score" && p !== strong).sort((x, y) => x.score - y.score)[0];
  const consider = m && m.missing.length ? `Too few reports yet from people with ${m.missing.join(" or ")}.`
    : weakest && (weakest.score < 65 || (weakest.key.startsWith("suits_") && weakest.n < FEW_VOICES))
      ? (weakest.key === "finish" ? `Its finish isn't very ${choice.finish} (${weakest.n} people describe the finish).`
        : weakest.n < FEW_VOICES ? `Only ${weakest.n} ${weakest.n === 1 ? "person" : "people"} with ${weakest.label} so far.`
        : `Mixed for ${weakest.label}: ${weakest.n} people with ${weakest.label} reported on it.`) : null;
  const pill = (label: string, next: SkinChoice, on: boolean) => <Link href={at(next)} scroll={false} replace aria-current={on ? "true" : undefined} className={on ? "on" : undefined}>{label}</Link>;
  const showFinish = applies(def("finish"), r.shape);
  // Concerns as one answer: sensitive, acne-prone, both or neither (so "neither" is an answer, not a blank).
  const CONCERNS = [["sensitive", "Sensitive", ["sensitive"]], ["acne", "Acne-prone", ["acne"]], ["both", "Both", ["sensitive", "acne"]], ["none", "Neither", []]] as const;
  const concernKey = choice.noConcerns ? "none" : choice.concerns.length === 2 ? "both" : choice.concerns[0] ?? null;
  const withConcern = (k: (typeof CONCERNS)[number][0]) => ({ ...choice, concerns: [...CONCERNS.find(x => x[0] === k)![2]], noConcerns: k === "none" });
  const SKIN_LABEL: Record<string, string> = { dry: "Dry", oily: "Oily", combination: "Combination", normal: "Normal" };
  const FINISH_ROW = [["matte", "Matte"], ["dewy", "Dewy"], [null, "No preference"]] as const;
  // The edit panel once answered: the same three questions as rows (finish optional).
  const pickers = <div className="sk-edit">
    <div className="sk-row"><span className="sk-rk">Skin type</span><span className="sk-pills">{SKIN_TYPES.map(k => <span key={k}>{pill(SKIN_LABEL[k], { ...choice, skin: k }, choice.skin === k)}</span>)}</span></div>
    <div className="sk-row"><span className="sk-rk">Concerns</span><span className="sk-pills">{CONCERNS.map(([k, l]) => <span key={k}>{pill(l, withConcern(k), concernKey === k)}</span>)}</span></div>
    {showFinish && <div className="sk-row"><span className="sk-rk">Finish <small>optional</small></span><span className="sk-pills">{FINISH_ROW.map(([f, l]) => <span key={l}>{pill(l, { ...choice, finish: f }, choice.finish === f)}</span>)}</span></div>}
  </div>;
  // Before the answer: one calm question at a time, as padel asks level then style.
  const step = !choice.skin ? 1 : 2;
  const stepper = <div className="sk-steps">
    <p className="sk-step">{`Step ${step} of 2`}</p>
    {step === 1 ? <>
      <h3 className="sk-q">{"What's your skin type?"}</h3>
      <div className="sk-opts">{SKIN_TYPES.map(k => <Link key={k} href={at({ ...choice, skin: k })} scroll={false} replace className="sk-opt">{SKIN_LABEL[k]}</Link>)}</div>
    </> : <>
      <p className="sk-done"><span>{`Skin type: ${SKIN_LABEL[choice.skin!].toLowerCase()}`}</span><Link href={at({ ...choice, skin: null })} scroll={false} replace>change</Link></p>
      <h3 className="sk-q">Any skin concerns?</h3>
      <div className="sk-opts">{CONCERNS.map(([k, l]) => <Link key={k} href={at(withConcern(k))} scroll={false} replace className="sk-opt">{l}</Link>)}</div>
    </>}
  </div>;

  // The verdict as on padel's fit box: the word, a plain headline, and "why it fits" / "what to consider".
  const kind = m ? (m.pct === null ? "thin" as const : m.pct >= 75 ? "good" as const : m.pct >= 55 ? "maybe" as const : "no" as const) : null;
  const headline = !kind ? "" : kind === "good" ? (consider ? "Yes, with one catch." : "Yes — a clean fit.") : kind === "maybe" ? "Maybe — try it first." : kind === "no" ? "Probably not this one." : "Not enough reports from people like you yet.";
  // Reviews (padel's rule, owner 2026-11-15): our own reviews and YouTube summaries, one card per channel; SkinRecs adds its blog
  // summaries (the owner moved skin up for its YouTube and blog base). Forum reports count in the scores but aren't listed here.
  const lv = (v?: string | null) => v ? v.toLowerCase() : null;
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  const ytProducts = new Map<string, number>(), ytSeen = new Set<string>();
  for (const e of data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !ytSeen.has(`${v}|${e.racketId}`)) { ytSeen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const mine = data.external.filter(e => e.racketId === r.id);
  const cards: ReviewCard[] = [
    ...data.reviews.filter(x => x.racketId === r.id).map(x => ({ at: x.createdAt, card: { id: x.id, kind: "player" as const, who: x.alias || "A SkinRecs user", meta: lv(x.playerLevel), verdict: (x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative") as ReviewCard["verdict"], when: agoShort(x.createdAt), text: x.reviewText, verbatim: true } })),
    ...onePerChannel(mine.filter(e => e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).map(e => { const text = e.summary ? plainSummary(e.summary) : e.excerpt ?? "";
      return { at: e.sourceDate ?? "", card: { id: e.id, kind: "youtube" as const, who: e.sourceName, verdict: e.sentiment ?? null, when: agoShort(e.sourceDate), url: e.sourceUrl, video: vid(e.sourceUrl), comment: /[?&]lc=/.test(e.sourceUrl), points: e.summary && !/[?&]lc=/.test(e.sourceUrl) ? sentences(text).slice(0, 4) : [text] } }; }),
    ...mine.filter(e => e.sourcePlatform === "Blog").map(e => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "player" as const, who: e.sourceName, initial: (e.sourceName[0] ?? "B").toUpperCase(), meta: null, source: "blog",
      verdict: e.sentiment ?? null, when: agoShort(e.sourceDate), url: e.sourceUrl, text: e.summary ? plainSummary(e.summary) : e.excerpt ?? "", verbatim: !e.summary } })),
  ].filter(x => x.card.kind === "youtube" ? !!x.card.points?.[0] : !!x.card.text).sort((x, y) => y.at.localeCompare(x.at)).map(x => x.card);
  const signal = ctx.signal(r.id), rated = c.positive + c.mixed + c.negative;
  const skinOpts = (niche.profile.playerLevel?.options ?? []).map(o => ({ value: o.value, label: o.value.toLowerCase() }));
  const shortName = name.replace(/\s+(19|20)\d\d$/, "");
  const specRows = facts.map(([k, v]) => `${k.toLowerCase().replace(/\s+/g, "-")} ${v}`);

  return <><main className={`rf sk2`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rf-wrap">
      {picked ? <a className="rf-back" href={skinHref(choice)}>← back to your matches</a> : <a className="rf-back" href={type ? `/${type.slug}` : catalogPath}>{`← all ${type ? type.label.toLowerCase() : niche.words.many}`}</a>}
      <section className="rf-top">
        <div className="rf-hero">
          <div className="rf-shot">{photo ? <img src={photo} alt={name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span className="rf-tile">{shortName}</span>}</div>
          <div className="rf-id">
            <div className="rf-chips">{[r.shape, ff === "free" ? "fragrance-free" : null, spf ? `SPF ${spf}` : null, typeof a.facts.price === "string" ? a.facts.price : null].filter(Boolean).map(x => <span key={x}>{x!.toLowerCase()}</span>)}</div>
            {/* H1 "<name> review" for search, as padel. */}
            <h1>{`${shortName} review`}</h1>
            {r.reviewSummary && <p className="rf-hook">{r.reviewSummary}</p>}
            {/* The user score as a quiet line with its bar (padel's final mock), then Check price. */}
            <a className="rp-score" href="#reviews" title="User score: not a % of happy users. It blends how much people like it with how many have weighed in.">
              <span>{signal !== null && <b>{signal}</b>}{`${signal !== null ? " user score · " : ""}${rated} rated`}</span>
              {rated > 0 && <span className="rf-sbar" aria-hidden="true"><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>}</a>
            {buy && <div className="rf-meta"><a className="rf-btn" href={buy.url} target="_blank" rel={buy.rel}>{buy.label} ↗</a></div>}
            {buy && <p className="rf-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>
        <div className={`rf-fit ${kind ? `v-${kind}` : "ask"}`} id="fit">
          {!m ? <div className="rf-ask sk-ask">
            <div className="rf-asktitle"><h2>Is this right for your skin?</h2>
              <p>{`Two quick questions, answered from ${c.n.toLocaleString("en-US")} ${c.n === 1 ? "review" : "reviews"} by people with your skin.`}</p></div>
            {stepper}
            {bestFor.length > 0 && <p className="rf-best"><b>Generally best for</b>{` ${bestFor.slice(0, 3).join(", ")}.`}</p>}
          </div> : <div className="rf-ans" aria-live="polite">
            <div className="rf-chipsrow"><span className="rf-k">Your match</span>
              <span className={`rf-vpill ${kind}`} title="How well it fits your skin, from what people with your skin type said. Not a % of happy users.">{m.pct === null ? "— · not enough reports yet" : `${m.pct}% · ${fit}`}</span></div>
            <h2>{headline}</h2>
            <p className="rf-for">{m.pct === null ? `People with ${m.missing.join(" or ")} haven't said enough about it yet. What we know is below.` : `For your ${skinWords(choice).join(" · ")}, here's the short answer.`}</p>
            {why && <div className="rf-blk ok"><p className="rf-bk">{kind === "no" ? "✓ What works" : "✓ Why it fits"}</p><p>{`${why[0].toUpperCase()}${why.slice(1)}.`}</p></div>}
            {consider && <div className="rf-blk warn"><p className="rf-bk">↗ What to consider</p><p>{consider}</p></div>}
            {/* Edit: padel's CSS-only toggle (checkbox + label), so the pills open under the footer row. */}
            <input type="checkbox" id="rf-edit-t" className="rf-edit-t" aria-label="Edit your picks"/>
            <div className="rf-afoot"><span>{skinWords(choice).map(w => w[0].toUpperCase() + w.slice(1)).join("  ·  ")}</span>
              <span className="rf-acts"><label htmlFor="rf-edit-t" className="rf-editl"><span className="o">edit ↗</span><span className="c">done ✓</span></label>
              <Link href={here} scroll={false} replace className="rf-reset">start over</Link></span></div>
            <div className="rf-editp">{pickers}</div>
          </div>}
        </div>
      </section>

      {/* After the hero, one column as padel's final page: who it suits and how it feels, then Reviews and Specs. */}
      <section className="rp-body">
        <div className="rp-main">
          <div id="suits">
            <div className="rf-h"><h2>Who it suits</h2><span>from what people with each skin type said, not from the label</span></div>
            <div className="rf-plays">{suits.map(x => { const s = a.scores[x.key]; const few = !!s && s.n < FEW_VOICES, n = s ? dotsOf(s.score) : 0;
              return <div key={x.key} className="rf-prow"><b>{x.label}</b>{n ? segs(n) : <span className="rf-segs none"/>}
                <span className="rf-pnote">{s ? <em className={few ? "t3" : `t${n}`}>{few ? "few reports so far" : attrWords(x, s) === "not for" ? "not for it" : attrWords(x, s)}</em> : null}
                  <span>{s ? `${s.n} ${s.n === 1 ? "person" : "people"} with ${x.label.toLowerCase()}: ${s.plus} liked it${s.minus ? `, ${s.minus} didn't` : ""}.` : "Not enough reports from people with this skin type yet."}</span></span></div>; })}</div>
          </div>
          <div id="feel">
            <div className="rf-h"><h2>How it feels</h2><span>{c.n < 3 ? `too few reports to rate yet (${c.n})` : `from ${c.n} reviews, compared with other ${type?.label.toLowerCase() ?? niche.words.many}`}</span></div>
            <div className="rf-plays">{["hydration", "gentle"].map(k => def(k)).filter(x => applies(x, r.shape)).map(x => { const s = a.scores[x.key], n = s ? dotsOf(s.score) : 0;
              return <div key={x.key} className="rf-prow"><b>{x.label}</b>{n ? segs(n) : <span className="rf-segs none"/>}
                <span className="rf-pnote">{s ? <em className={`t${n}`}>{attrWords(x, s)}</em> : null}<span>{s ? `${s.plus} ${s.plus === 1 ? "review praises" : "reviews praise"} it${s.minus ? `, ${s.minus} ${x.key === "gentle" ? "mention irritation" : "found it drying"}` : ""}.` : "Not enough said yet."}</span></span></div>; })}
              {["finish", "texture"].map(k => def(k)).filter(x => applies(x, r.shape)).map(x => { const s = a.scores[x.key];
                return <div key={x.key} className="rf-prow sk2-axis"><b>{x.label}</b>
                  <span className="sk2-slider" role="img" aria-label={s ? `${attrWords(x, s)}` : "not enough said yet"}><span>{x.ends![0]}</span><i>{s && <u style={{ left: `${s.score}%` }}/>}</i><span>{x.ends![1]}</span></span>
                  <span className="rf-pnote">{s ? <em>{attrWords(x, s)}</em> : null}<span>{s ? `${s.n} reviews describe it.` : "Not enough said yet."}</span></span></div>; })}
            </div>
          </div>
          {quoteRows.length > 0 && <div id="words">
            <div className="rf-h"><h2>{wanted.length ? "In their words" : "What people noticed"}</h2><span>{wanted.length ? `from people with ${skinWords(choice)[0] ?? "your skin"}` : "from reviews, linked"}</span></div>
            <div className="rf-quotes">{quoteRows.map(x => { const rep = report.get(x.sourceRef.split("#")[0])!; return <div key={x.sourceRef + x.attribute} className={rep.sentiment === "negative" ? "no" : rep.sentiment === "mixed" ? "mix" : "ok"}>
              <span>{rep.sentiment === "negative" ? "✗ Not for them" : rep.sentiment === "mixed" ? "~ Mixed feelings" : "✓ Worked for them"}</span><p>{x.attribute.startsWith("suits_")
                // A skin-type row's quote only says who they are ("their oily skin"): show what they said about the product,
                // our summary as written (no quote marks), the writer's own words in quote marks.
                ? (rep.src === "skinrecs" ? `“${clip(rep.text)}”` : clip(rep.text)) : `“${x.quote}”`}</p><small>{rep.url ? <a href={rep.url} target="_blank" rel="nofollow noopener">{SOURCE[x.sourceKind] ?? rep.src}</a> : SOURCE[x.sourceKind] ?? rep.src}{` · ${ago(rep.date)}`}</small></div>; })}</div></div>}
          {others.length > 0 && <div id="alts">
            <div className="rf-h"><h2>{m ? (m.pct !== null && m.pct >= 75 ? "Also worth a look" : "Better matches for you") : `Similar ${type?.label.toLowerCase() ?? niche.words.many}`}</h2>
              <a href={type ? skinHref({ ...choice, type: null, typeSlug: null }, `/${type.slug}`, "") : catalogPath}>all →</a></div>
            <ul className="rf-alts sk2-alts">{others.map(o => { const p = photoHidden(o.r) ? null : shopPhoto(o.r) ?? amazonPhoto(o.r)?.image ?? null, nm = displayName(o.r.name, data.brands.find(b => b.id === o.r.brandId)?.name);
              return <li key={o.r.id}><a href={`${productHref(o.r)}${q}`}>
                <span className="rf-apic">{p ? <img src={p} alt="" width={408} height={620} decoding="async" loading="lazy"/> : <span>{nm.split(" ").slice(0, 2).join(" ")}</span>}</span>
                <span className="rf-abody"><b>{nm}</b>{o.reason && <span>{o.reason}</span>}</span>
                <span className="rf-score">{m ? (o.pct === null ? "—" : `${o.pct}%`) : o.signal ?? "—"}</span></a></li>; })}</ul></div>}
        </div>

        <section id="reviews" className="rv">
          <RacketReviews racketId={r.id} name={shortName} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []} total={c.n}
            mood={{ pos: c.positive, mix: c.mixed, neg: c.negative, score: signal }}
            words={{ levelLead: "My skin:", levels: skinOpts, score: "User score", ask: "Used it?", people: "users", peopleTab: "users & blogs" }}/>
        </section>

        {specRows.length > 0 && <details className="rp-specs"><summary><h2>Specs</h2></summary>
          <p className="rf-specs">{facts.map(([k, v]) => <span key={k}><span>{k.toLowerCase()}</span>{` ${v}`}</span>)}</p></details>}
      </section>

      <SkinSticky pct={m?.pct ?? null} kind={kind} word={fit} buy={buy} name={shortName}/>

      <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{`built from YouTube reviews, blogs, reviews sent to us and ${v2copy.forum} reports · every source linked · `}
          <details><summary>how we read this</summary><span>{" We sort each review as positive, mixed or negative and read what people say about their own skin. \"Who it suits\" counts only people who said they have that skin type, and needs at least 3 of them. Skin reacts differently from person to person: treat this as a starting point, not medical advice."}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">{v2copy.madeBy}</p>
      </footer>
    </div>
  </main><V2Footer/></>;
}
