import "../rackets/[slug]/racket-fit.css";
import "./skin-v2.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { skinContext } from "./context";
import { rankSkin, fitWord, reasonOf } from "./rank";
import { attrWords, dotsOf } from "../../lib/attr-score";
import { applies } from "../../lib/attr-profile";
import { SKIN_TYPES, FINISHES, skinHref, skinPicked, skinWords, skinQuery, type SkinChoice } from "../../lib/skin-choice";
import { niche, catalogPath, productHref, typePageFor, v2copy } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { platformName } from "../../lib/source-label";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { V2Footer } from "../v2-footer";

/** The SkinRecs product page in design v2 (the racket fit page's layout, app/rackets/[slug]/racket-fit.tsx): a fit check for
 *  the visitor's skin (?skin=&sens=1&acne=1&finish=, as the home's quick match), who it suits from what people with each skin
 *  type said, how it feels (hydration, gentleness, finish, texture), the facts, and the newest reviews. */
const SOURCE: Record<string, string> = { youtube: "youtube", blog: "blog", player_report: "forum", own_review: "skinrecs" };
const DAY = 86_400_000;
function ago(iso?: string | null) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - Date.parse(iso)) / DAY);
  return days < 14 ? `${Math.max(1, days)} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
const clip = (t: string, n = 200) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;
const segs = (n: number) => <span className="rf-segs" role="img" aria-label={`${n} of 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? "on" : undefined}/>)}</span>;

export default async function SkinFit({ productId, choice, crumbs, buy, jsonLd }: { productId: string; choice: SkinChoice; crumbs: ReactNode;
  buy: { url: string; label: string; rel: string } | null; jsonLd: object }) {
  const ctx = await skinContext(), { data, profile } = ctx;
  const r = data.rackets.find(x => x.id === productId)!;
  const brand = data.brands.find(b => b.id === r.brandId);
  const name = displayName(r.name, brand?.name);
  const a = ctx.attrs.get(r.id) ?? { scores: {}, facts: {} }, c = ctx.counts.get(r.id) ?? { n: 0, positive: 0, mixed: 0, negative: 0 };
  const photo = photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const picked = skinPicked(choice);
  const m = picked ? ctx.match(r.id, choice) : null;
  const here = productHref(r), at = (next: SkinChoice) => skinHref({ ...next, type: null, typeSlug: null }, here, "#fit");
  const type = typePageFor(r.shape);
  const def = (k: string) => profile.attrs.find(x => x.key === k)!;
  const suits = profile.attrs.filter(x => x.kind === "suits");
  const bestFor = suits.filter(x => (a.scores[x.key]?.score ?? 0) >= 65).sort((x, y) => a.scores[y.key]!.score - a.scores[x.key]!.score).map(x => x.label.toLowerCase());
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
  const latest = [...report].sort((x, y) => (y[1].date ?? "").localeCompare(x[1].date ?? "")).filter(([, v]) => v.text.length >= 40).slice(0, 10);
  const others = rankSkin(ctx, { ...choice, type: r.shape, typeSlug: type?.slug ?? null }).filter(x => x.r.id !== r.id).slice(0, 4);
  const pickQ = skinQuery({ ...choice, type: null, typeSlug: null }), q = pickQ.size ? `?${pickQ}` : "";
  const fit = m ? fitWord(m.pct) : null;
  const why = m && m.pct !== null ? reasonOf(ctx, m) : null;
  const weakest = m?.parts.filter(p => p.key !== "score").sort((x, y) => x.score - y.score)[0];
  const consider = m && m.missing.length ? `Too few reports yet from people with ${m.missing.join(" or ")}.` : weakest && weakest.score < 55 ? `${weakest.key === "finish" ? `Its finish isn't very ${choice.finish}` : `Mixed for ${weakest.label}`} (${weakest.key === "finish" ? `${weakest.n} people describe the finish` : `${weakest.n} people with ${weakest.label}`}).` : null;
  const pill = (label: string, next: SkinChoice, on: boolean) => <Link href={at(next)} scroll={false} replace aria-current={on ? "true" : undefined} className={on ? "on" : undefined}>{label}</Link>;
  const box = (label: string, next: SkinChoice, on: boolean) => <Link href={at(next)} scroll={false} replace aria-current={on ? "true" : undefined} className="rf-arm"><i className="rf-box" aria-hidden="true">{on ? "✓" : ""}</i>{label}</Link>;
  const toggle = (k: string) => choice.concerns.includes(k) ? choice.concerns.filter(x => x !== k) : [...choice.concerns, k];
  const showFinish = applies(def("finish"), r.shape);
  const pickers = <div className="rf-bar sk2-pick">
    <span className="rf-seg" role="group" aria-label="Your skin type">{SKIN_TYPES.map(s => <span key={s}>{pill(s, { ...choice, skin: choice.skin === s ? null : s }, choice.skin === s)}</span>)}</span>
    {box("sensitive", { ...choice, concerns: toggle("sensitive") }, choice.concerns.includes("sensitive"))}
    {box("acne-prone", { ...choice, concerns: toggle("acne") }, choice.concerns.includes("acne"))}
    {showFinish && <span className="rf-lv" role="group" aria-label="Finish">{FINISHES.map(f => <span key={f}>{pill(f, { ...choice, finish: choice.finish === f ? null : f }, choice.finish === f)}</span>)}</span>}
  </div>;

  return <><main className={`rf sk2`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rf-wrap">
      {picked ? <a className="rf-back" href={skinHref(choice)}>← back to your matches</a> : <a className="rf-back" href={type ? `/${type.slug}` : catalogPath}>{`← all ${type ? type.label.toLowerCase() : niche.words.many}`}</a>}
      {crumbs}
      <section className="rf-top">
        <div className="rf-hero">
          <div className="rf-shot">{photo ? <img src={photo} alt={name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span className="rf-tile">{name}</span>}</div>
          <div className="rf-id">
            <div className="rf-chips">{[r.shape, ff === "free" ? "fragrance-free" : null, spf ? `SPF ${spf}` : null].filter(Boolean).map(x => <span key={x}>{x!.toLowerCase()}</span>)}</div>
            <h1>{name}</h1>
            {r.reviewSummary && <p className="rf-hook">{r.reviewSummary}</p>}
            <div className="rf-meta">{buy && <a className="rf-btn" href={buy.url} target="_blank" rel={buy.rel}>{buy.label} ↗</a>}
              <span>{`${c.n.toLocaleString("en-US")} ${c.n === 1 ? "review" : "reviews"}`}</span>{ctx.signal(r.id) !== null && <span>{`user score ${ctx.signal(r.id)}`}</span>}</div>
            {buy && <p className="rf-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>
        <div className={`rf-fit ${m ? `v-${m.pct === null ? "thin" : m.pct >= 75 ? "good" : m.pct >= 55 ? "maybe" : "no"}` : "ask"}`} id="fit">
          {!m ? <div className="rf-ask">
            <div className="rf-asktitle"><h2>Is this right for your skin?</h2><span>pick yours, the answer comes from people with your skin type</span></div>
            {pickers}
            {bestFor.length > 0 && <p className="rf-best"><b>Generally best for</b>{` ${bestFor.slice(0, 3).join(", ")}.`}</p>}
          </div> : <div className="rf-ans" aria-live="polite">
            <div className="rf-chipsrow"><span className="rf-k">⚡ your match</span>
              <span className={`rf-vpill ${m.pct === null ? "thin" : m.pct >= 75 ? "good" : m.pct >= 55 ? "maybe" : "no"}`} title="How well it fits your skin, from what people with your skin type said. Not a % of happy users.">{m.pct === null ? "— · not enough reports yet" : `${m.pct}% match · ${fit}`}</span></div>
            <p className="rf-for">{m.pct === null ? `People with ${m.missing.join(" or ")} haven't said enough about it yet. What we know is below.` : `For your ${skinWords(choice).join(" · ")}, here's the short answer.`}</p>
            {why && <div className="rf-blk ok"><p className="rf-bk">✓ Why it fits</p><p>{why}.</p></div>}
            {consider && <div className="rf-blk warn"><p className="rf-bk">↗ What to consider</p><p>{consider}</p></div>}
            {pickers}
            <div className="rf-afoot"><span>{skinWords(choice).join("  ·  ")}</span><span className="rf-acts"><Link href={here} scroll={false} replace className="rf-reset">start over</Link></span></div>
          </div>}
        </div>
      </section>

      <section className="rf-body">
        <div className="rf-main">
          <div>
            <div className="rf-h"><h2>Who it suits</h2><span>from what people with each skin type said, not from the label</span></div>
            <div className="rf-plays">{suits.map(x => { const s = a.scores[x.key]; const n = s ? dotsOf(s.score) : 0;
              return <div key={x.key} className="rf-prow"><b>{x.label}</b>{n ? segs(n) : <span className="rf-segs none"/>}
                <span className="rf-pnote">{s ? <em className={`t${n}`}>{attrWords(x, s) === "not for" ? "not for it" : attrWords(x, s)}</em> : null}
                  <span>{s ? `${s.n} ${s.n === 1 ? "person" : "people"} with ${x.label.toLowerCase()}: ${s.plus} liked it${s.minus ? `, ${s.minus} didn't` : ""}.` : "Not enough reports from people with this skin type yet."}</span></span></div>; })}</div>
          </div>
          <div>
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
          {quoteRows.length > 0 && <div><h2 className="rf-h2">{wanted.length ? "In their words" : "What people noticed"}</h2>
            <div className="rf-quotes">{quoteRows.map(x => { const rep = report.get(x.sourceRef.split("#")[0])!; return <div key={x.sourceRef + x.attribute} className={rep.sentiment === "negative" ? "no" : rep.sentiment === "mixed" ? "mix" : "ok"}>
              <span>{rep.sentiment === "negative" ? "✗ Not for them" : rep.sentiment === "mixed" ? "~ Mixed feelings" : "✓ Worked for them"}</span><p>{x.attribute.startsWith("suits_")
                // A skin-type row's quote only says who they are ("their oily skin"): show what they said about the product,
                // our summary as written (no quote marks), the writer's own words in quote marks.
                ? (rep.src === "skinrecs" ? `“${clip(rep.text)}”` : clip(rep.text)) : `“${x.quote}”`}</p><small>{rep.url ? <a href={rep.url} target="_blank" rel="nofollow noopener">{SOURCE[x.sourceKind] ?? rep.src}</a> : SOURCE[x.sourceKind] ?? rep.src}{` · ${ago(rep.date)}`}</small></div>; })}</div></div>}
          {facts.length > 0 && <div><h2 className="rf-h2">Facts</h2><p className="rf-specs">{facts.map(([k, v]) => <span key={k}><span>{k.toLowerCase()}</span>{` ${v}`}</span>)}</p></div>}
        </div>
        <aside className="rf-side">
          {others.length > 0 && <div><div className="rf-h"><h2>{m ? (m.pct !== null && m.pct >= 75 ? "Also worth a look" : "Better matches for you") : `Similar ${type?.label.toLowerCase() ?? niche.words.many}`}</h2>
            <a href={type ? skinHref({ ...choice, type: null, typeSlug: null }, `/${type.slug}`, "") : catalogPath}>all →</a></div>
            <ul className="rf-alts">{others.map(o => { const p = photoHidden(o.r) ? null : shopPhoto(o.r) ?? amazonPhoto(o.r)?.image ?? null, nm = displayName(o.r.name, data.brands.find(b => b.id === o.r.brandId)?.name);
              return <li key={o.r.id}><a href={`${productHref(o.r)}${q}`}>
                <span className="rf-apic">{p ? <img src={p} alt="" width={408} height={620} decoding="async" loading="lazy"/> : <span>{nm.split(" ").slice(0, 2).join(" ")}</span>}</span>
                <span className="rf-abody"><b>{nm}</b>{o.reason && <span>{o.reason}</span>}</span>
                <span className="rf-score">{m ? (o.pct === null ? "—" : `${o.pct}%`) : o.signal ?? "—"}</span></a></li>; })}</ul></div>}
        </aside>
      </section>

      <section id="reviews" className="rf-body sk2-latest"><div className="rf-main">
        <div className="rf-h"><h2>Latest reviews</h2><span>{`${c.n.toLocaleString("en-US")} in all · `}<a href={`${here}?layout=long#reviews`}>see every review</a>{" · "}<a href={`/add-review?from=${encodeURIComponent(here)}`}>add yours</a></span></div>
        <ul className="sk2-revs">{latest.map(([id, v]) => <li key={id} className={v.sentiment ?? ""}><p>{v.src === "skinrecs" ? `“${v.text}”` : v.text}</p>
          <small>{v.url ? <a href={v.url} target="_blank" rel="nofollow noopener">{v.src === "reddit" ? "forum" : v.src}</a> : v.src}{` · ${ago(v.date)}`}</small></li>)}</ul>
      </div></section>

      <footer className="rf-foot" id="how-we-read">
        <div className="rf-line">{`built from YouTube reviews, blogs, reviews sent to us and ${v2copy.forum} reports · every source linked · `}
          <details><summary>how we read this</summary><span>{" We sort each review as positive, mixed or negative and read what people say about their own skin. \"Who it suits\" counts only people who said they have that skin type, and needs at least 3 of them. Skin reacts differently from person to person: treat this as a starting point, not medical advice."}</span></details>
          {" · "}<a href="/contact">spot something wrong?</a></div>
        <p className="rf-made">{v2copy.madeBy}</p>
      </footer>
    </div>
  </main><V2Footer/></>;
}
