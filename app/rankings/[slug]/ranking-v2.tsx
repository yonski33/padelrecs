import "../rankings-v2.css";
import { rowLine } from "../../../lib/row-line";
import "./ranking-v3.css";
import Link from "next/link";
import { niche, productHref } from "../../../lib/niche";
import { listYear, MIN_LIST_REVIEWS, RANKINGS_PATH } from "../../../lib/top-lists";
import { displayName } from "../../../lib/brand-name";
import { websiteButton } from "../../../lib/product-links";
import type { AmazonButton } from "../../../lib/amazon-offer";
import { score, type Catalog } from "../../../db/data";
import { bestFor } from "../../../lib/fit-verdict";
import { qtFontVars } from "../../qt-fonts";
import { V2Footer } from "../../v2-footer";
import { matchContext } from "../../match-context";
import { listHref, type RankedList } from "../lists";
import { photoOf } from "../rankings-v2";
import { attrProfileFor } from "../../../lib/attr-profile";
import { FEW_VOICES } from "../../../lib/attr-score";
import { skinContext } from "../../skin/context";
import { scoreLabel } from "../../../lib/niche";

// A ranking in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/TTmbZPDFLuRzQiqsAG3Nc1), PadelRecs
// only: the lists as tabs, a big title, "your match" (the home's quick-match picks, in the URL, with the match % on every row),
// the top three as cards with why it's here / the catch (the quick take's own hook), the rest as quiet rows. The order is
// always the list's own (Player score); picks only add the match %. The FAQ stays below for search.
export type Search = { style?: string; level?: string; arm?: string; pct?: string };

export default async function RankingV2({ data, lists, found, amazon, affiliate, faq, jsonLd }: {
  data: Catalog; lists: RankedList[]; found: RankedList; amazon: (AmazonButton | null)[]; affiliate: boolean;
  faq: { q: string; a: string }[]; jsonLd: object; search?: Search }) {
  const { list, entries, reviews } = found;
  // SkinRecs (an attribute profile, lib/attr-profile.ts): no racket match context (it has no style / level traits, so it crashed
  // every ranking page, owner 2026-11-16 "rankings doesn't load"). "Best for" comes from its who-it-suits scores, and the picks
  // pane is the home's quick match instead, so the rows carry no %.
  const skin = !!attrProfileFor(niche);
  const ctx = skin ? null : await matchContext();
  const sk = skin ? await skinContext() : null;
  const skinBest = (id: string) => { const a = sk?.attrs.get(id); return a ? sk!.profile.attrs.filter(x => x.kind === "suits" && (a.scores[x.key]?.score ?? 0) >= 65 && (a.scores[x.key]?.n ?? 0) >= FEW_VOICES)
    .sort((x, y) => a.scores[y.key]!.score - a.scores[x.key]!.score).slice(0, 3).map(x => x.label.toLowerCase()) : []; };
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  // "The 10 best padel rackets overall in 2026": the label after "Best" is the highlighted part.
  const year = listYear(list), many = `${niche.seo.productCategory.toLowerCase()}s`;
  const hl = list.label.replace(/^best\s+/i, "").toLowerCase();
  const yearPart = /\d{4}/.test(hl) ? "" : ` in ${year}`;
  const seen = new Set<string>(), tabs = lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug));

  // The final mock (owner 2026-11-16, https://claude.ai/artifact/EBkNdZnn4LbRi6fK8ytAJi): crumbs, the title, the lists as pills, a
  // "find my match" strip to the home's quick match, #1 as a big card, the rest in one box. Score badges, no match % here.
  const rows = entries.flatMap((e, i) => {
    const r = byId.get(e.product.id); if (!r) return [];
    const a = amazon[i], site = websiteButton({ websiteUrl: e.product.websiteUrl ?? null, affiliateUrl: e.product.affiliateUrl ?? null });
    const shop = a ? { url: a.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
    const best = ctx ? bestFor(ctx.facts(r.id)) : skinBest(r.id);
    return [{ e, r, i, name: displayName(r.name, brand(r.brandId)), url: productHref(r), pic: photoOf(r), line: rowLine(e.product),
      best: best.join(", "), sig: e.signal?.signal ?? null, shop }];
  });
  const [first, ...rest] = rows;
  const tone = (n: number | null) => n === null ? "" : n >= 90 ? " t90" : n >= 85 ? " t85" : "";
  const buy = (x: typeof rows[number], cls: string) => x.shop ? <a className={cls} href={x.shop.url} target="_blank" rel={x.shop.rel}>check price ↗</a> : null;
  const tag = (rank: number) => rank === 2 ? <span className="rk3-tag ru">runner-up</span> : null;

  return <main className={`rl2 rk3 ${qtFontVars}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rk3-wrap">
      <div className="rk3-crumbs"><a href={RANKINGS_PATH}>rankings</a><span>/</span><span className="here">{list.label.toLowerCase()}</span></div>
      <div className="rk3-head">
        {/* A product-type list on SkinRecs is its own noun ("The 10 best moisturizers"), not "skincare products moisturizers". */}
        <h1>{`The ${entries.length} best ${skin && list.filters?.some(f => f.column === "shape") ? "" : `${many} `}`}<span className="hl">{hl}</span>{yearPart}</h1>
        <p className="rk3-sub">{`${entries.length} ${entries.length === 1 ? niche.words.one : niche.words.many}, ranked from ${reviews.toLocaleString("en-US")} ${niche.people.one} reviews. Not by us, not by brands.`}</p>
        {/* How the order is made, in one quiet line (owner 2026-11-16). SkinRecs words it as "skin score" and "people". */}
        <span className="rk3-note">{skin ? "ranked by skin score and how many people reviewed it" : `ranked by ${scoreLabel.toLowerCase()} and how many ${niche.people.many} reviewed it`}</span>
      </div>
      {tabs.length > 1 && <nav className="rk3-tabs" aria-label="Rankings">{tabs.map(l => <a key={l.list.slug} href={listHref(l.list.slug)} aria-current={l.list.slug === list.slug ? "page" : undefined}>{l.list.label.toLowerCase()}</a>)}</nav>}
      <div className="rk3-you"><b>{"#1 for everyone isn't always #1 for you."}</b><Link href="/#match">find my match →</Link></div>

      {first && <article className="rk3-first">
        <span className="rk3-big">#1</span>
        <a className="rk3-pic" href={first.url} tabIndex={-1} aria-hidden="true">{first.pic ? <img src={first.pic} alt="" loading="eager"/> : <span>{brand(first.r.brandId)}</span>}<span className="rk3-mbig">#1</span></a>
        <div className="rk3-body">
          <span className="rk3-tag pick">#1 pick</span>
          <a className="rk3-name" href={first.url}>{first.name}</a>
          {first.line && <span className="rk3-line">{first.line}</span>}
          {first.best && <span className="rk3-best">{`best for ${first.best}`}</span>}
        </div>
        <div className="rk3-side">
          <span className="rk3-sc" title={`${scoreLabel}: not a % of happy ${niche.people.many}. It blends how much ${niche.people.many} like it with how many have weighed in.`}>
            <b>{first.sig ?? "–"}</b><small>{scoreLabel.toLowerCase().replace(" ", "\n")}</small></span>
          {buy(first, "rk3-buy")}
          <a className="rk3-why" href={`${first.url}#yes-no`}>See why →</a>
        </div>
      </article>}

      {rest.length > 0 && <ol className="rk3-list" start={2}>{rest.map(x => <li key={x.r.id} id={`n${x.e.rank}`} className={x.e.rank <= 3 ? "podium" : undefined}>
        <span className="rk3-rank">{x.e.rank}</span>
        <a className="rk3-pic" href={x.url} tabIndex={-1} aria-hidden="true">{x.pic ? <img src={x.pic} alt="" loading={x.i < 4 ? "eager" : "lazy"}/> : <span>{brand(x.r.brandId)}</span>}</a>
        <div className="rk3-body">
          <div className="rk3-mtop"><span className="rk3-mrank">{`#${x.e.rank}`}</span>{tag(x.e.rank)}</div>
          <div className="rk3-nrow"><a className="rk3-name" href={x.url}>{x.name}</a><span className="rk3-dtag">{tag(x.e.rank)}</span></div>
          {x.line && <span className="rk3-line">{x.line}</span>}
          {x.best && <span className="rk3-best">{`best for ${x.best}`}</span>}
          {list.trait && <span className="rk3-best">{`${x.e.traitReviews} mention ${list.trait.noun}`}</span>}
        </div>
        <div className="rk3-foot">
          <span className={`rk3-sc${tone(x.sig)}`}><b>{x.sig ?? "–"}</b><small>{scoreLabel.toLowerCase()}</small></span>
          {/* Rows #2 on: padel's quiet "check price ↗" link; only the #1 card keeps the button (owner 2026-11-16). */}
          {buy(x, "rk3-link")}
        </div>
      </li>)}</ol>}

      <a className="rk3-all" href={RANKINGS_PATH}>see all rankings →</a>
      {affiliate && <p className="rk3-aff">{"* some links are affiliate links; they never change the order."}</p>}

      <section className="rl2-faq" id="how-we-rank"><h2>Common questions</h2>
        {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
    </div>
    <V2Footer/>
  </main>;
}
