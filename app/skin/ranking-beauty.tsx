import "./skin-product.css";
import { rowLine } from "../../lib/row-line";
import "./home-beauty.css";
import "./ranking-beauty.css";
import Link from "next/link";
import { niche, productHref, scoreLabel } from "../../lib/niche";
import { listYear, MIN_LIST_REVIEWS, RANKINGS_PATH } from "../../lib/top-lists";
import { displayName } from "../../lib/brand-name";
import { websiteButton } from "../../lib/product-links";
import type { AmazonButton } from "../../lib/amazon-offer";
import type { Catalog } from "../../db/data";
import { skinBestFor } from "../../lib/skin-best";
import { V2Footer } from "../v2-footer";
import { listHref, type RankedList } from "../rankings/lists";
import { photoOf, shortDate } from "../rankings/rankings-v2";
import { skinContext } from "./context";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { scoreState } from "../../lib/score-view";
import { NewPill } from "../score-tags";

/** A SkinRecs ranking in the owner's beauty design (Claude Design "SkinRecs rankings", 2026-11-16): the lists as tabs, a big
 *  serif title, a "find my match" nudge to the home's quick match, the #1 as a card, the rest as rows with "best for" (from who
 *  it suits: people with that skin type rating it well) and the user score. The order is the list's own. FAQ stays for search. */
const DOT = (n: number) => n >= 85 ? "hi" : n >= 70 ? "mid" : "lo";

export default async function RankingBeauty({ data, lists, found, amazon, affiliate, faq, jsonLd }: {
  data: Catalog; lists: RankedList[]; found: RankedList; amazon: (AmazonButton | null)[]; affiliate: boolean;
  faq: { q: string; a: string }[]; jsonLd: object }) {
  const { list, entries, reviews, updated } = found;
  const sk = await skinContext();
  // "dry, normal & sensitive skin": the who-it-suits scores people with that skin type gave it (65+, enough of them).
  const bestFor = (id: string) => skinBestFor(sk.profile, sk.attrs.get(id));
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOnly = (r: { name: string; brandId: string }) => { const b = brand(r.brandId) ?? "", n = displayName(r.name, b);
    return b && n.toLowerCase().startsWith(`${b.toLowerCase()} `) ? n.slice(b.length + 1) : n; };
  const year = listYear(list);
  const typeList = list.filters?.find(f => f.column === "shape")?.include?.[0];
  const typePage = typeList ? niche.typePages?.find(t => t.shape === typeList) : undefined;
  const hl = list.label.replace(/^best\s+/i, "").toLowerCase();
  const noun = typePage ? "" : `${niche.words.many} `;
  const seen = new Set<string>(), tabs = lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug));
  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const matchHref = typePage ? `/?type=${typePage.slug}#match` : "/#match";
  const rows = entries.map((e, i) => {
    const r = byId.get(e.product.id); if (!r) return null;
    const a = amazon[i], site = websiteButton({ websiteUrl: e.product.websiteUrl ?? null, affiliateUrl: e.product.affiliateUrl ?? null });
    const shop = a ? { url: a.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
    return { e, r, url: productHref(r), pic: photoOf(r), brand: brand(r.brandId), name: nameOnly(r), line: rowLine(e.product),
      best: bestFor(r.id), sig: e.signal?.signal ?? null, judged: e.positive + e.mixed + e.negative, shop };
  }).filter(x => !!x);
  const [top, ...rest] = rows;
  const scoreBadge = (sig: number | null, big = false) => <span className={`rb-sc ${sig === null ? "lo" : DOT(sig)}${big ? " big" : ""}`}
    title={`${scoreLabel}: not a % of happy ${niche.people.many}. It blends how much people like it with how many have weighed in.`}>{sig ?? "–"}</span>;

  return <main className={`bp rb ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rb-wrap">
      <div className="rb-crumbs"><Link href={RANKINGS_PATH}>rankings</Link><span>/</span><span>{list.label.toLowerCase()}</span></div>
      <section className="rb-hero">
        <h1>{`The ${entries.length} best ${noun}`}<em>{hl}</em>{/\d{4}/.test(hl) ? "" : ` in ${year}`}</h1>
        <p>{`${entries.length} ${typePage ? hl : niche.words.many}, ranked from ${reviews.toLocaleString("en-US")} reviews. Not by us, not by brands.`}</p>
        <span className="rb-meta">{`ranked by user score and how many people reviewed it${updated ? ` · updated ${shortDate(updated)}` : ""}`}{affiliate && " · some links are affiliate, they don't change the order"}</span>
      </section>
      {tabs.length > 1 && <nav className="bp-picks rb-tabs" aria-label="Rankings">{tabs.map(l =>
        <Link key={l.list.slug} href={listHref(l.list.slug)} className={`bp-pick${l.list.slug === list.slug ? " on" : ""}`} aria-current={l.list.slug === list.slug ? "page" : undefined}>
          {l.list.label.replace(/^best\s+/i, "").toLowerCase()}</Link>)}</nav>}
      <div className="rb-nudge"><b>#1 for everyone isn&apos;t always #1 for your skin.</b><Link href={matchHref}>find my match →</Link></div>

      {top && <article className="rb-top">
        <span className="rb-n">#1</span>
        <a className="rb-pic" href={top.url} tabIndex={-1} aria-hidden="true">{top.pic && <img src={top.pic} alt="" loading="eager"/>}</a>
        <div className="rb-body">
          <span className="bp-tag sm">#1 pick</span>
          <span className="rb-brand">{top.brand}</span>
          <a className="rb-name" href={top.url}>{top.name}</a>
          {top.line && <span className="rb-line">{top.line}</span>}
          {top.best && <span className="rb-best">{`best for ${top.best}`}</span>}
        </div>
        <div className="rb-side">
          <span className="rb-scw">{scoreBadge(top.sig, true)}<small>user<br/>score</small></span>
          {top.shop && <a className="bp-btn" href={top.shop.url} target="_blank" rel={top.shop.rel}>check price ↗</a>}
          <a className="rb-why" href={top.url}>See why →</a>
        </div>
      </article>}

      {rest.length > 0 && <ol className="rb-list" start={2}>{rest.map((x, i) => <li key={x.r.id} id={`n${x.e.rank}`}>
        <span className={`rb-rank${i < 2 ? " near" : ""}`}>{x.e.rank}</span>
        <a className="rb-pic" href={x.url} tabIndex={-1} aria-hidden="true">{x.pic && <img src={x.pic} alt="" loading="lazy"/>}</a>
        <div className="rb-body">
          <span className="rb-brand"><i className="rb-rk">{`#${x.e.rank}`}</i>{x.brand}{i === 0 && <span className="rb-tag">runner-up</span>}</span>
          <a className="rb-name" href={x.url}>{x.name}</a>
          {x.line && <span className="rb-line">{x.line}</span>}
          {x.best && <span className="rb-best">{`best for ${x.best}`}</span>}
        </div>
        {scoreState(x.judged) === "new" ? <span className="rb-scw col"><NewPill n={x.judged}/></span> : <span className="rb-scw col">{scoreBadge(x.sig)}<small>user score</small></span>}
        {x.shop ? <a className="rb-buy" href={x.shop.url} target="_blank" rel={x.shop.rel}>check price ↗</a> : <span/>}
      </li>)}</ol>}
      <Link className="rb-all" href={RANKINGS_PATH}>see all rankings →</Link>

      <section className="bh-own rb-own"><p className="t">Used one of these?</p><p>Your verdict moves the list. Two minutes, no account.</p><a className="bp-btn" href="/add-review">+ add a review</a></section>

      <section className="bh-faq rb-faq" id="how-we-rank"><h2>Common questions</h2>
        <div className="bp-card">{faq.map(f => <details key={f.q}><summary><span>{f.q}</span><i aria-hidden="true"/></summary><p>{f.a}</p></details>)}
          <details><summary><span>How is the user score worked out?</span><i aria-hidden="true"/></summary>
            <p>{`How much people like it, adjusted for how many spoke up: 5 glowing reviews can't beat 60 good ones. At least ${min} reviews to be ranked. `}<a href="/how-we-make-these">Full method →</a></p></details></div>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
