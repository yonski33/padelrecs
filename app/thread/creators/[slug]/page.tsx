// The creator-centred product page (owner mock 2026-11-22, the Nox AT10 "editorial redesign", layout only; owner direction:
// an iemranking-style page of what YouTube and blog creators said). A preview: proxy.ts serves it for ?view=creators on a
// product with creator data (lib/thread/sites.ts creatorPageFor); the live product page is unchanged. Cached like the live
// product pages (ISR); the cards' filter and Read more run in the browser (live/creator-reviews.tsx).
// Order: top card (photo, name, TL;DR "from N creator reviews", jump row) → Creator sentiment → the creator table → the
// cards. Sidebar: the basics (specs), How it plays (the creators' words per attribute), Where to buy. Under 1000px the
// sidebar boxes follow the top card and the table.
// Data: db/creators/<site>.json (lib/thread/creators.ts), a static demo fixture; the photo, specs and shop link are the
// product's own (racketData). No scores but the creators' own numbers, no invented prices, no Reddit card (no Reddit data
// staged for these paddles yet).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { racketData } from "../../racket-data";
import { Photo, plural } from "../../ui";
import { th } from "../../../../lib/thread/look";
import { niche, catalogLabel, catalogPath, productHref } from "../../../../lib/niche";
import { withoutYear } from "../../../../lib/brand-name";
import { oneShape } from "../../../../lib/thread/shape";
import { amazonButton } from "../../../../lib/amazon-offer";
import { amazonPhoto } from "../../../../lib/amazon-photos";
import { websiteButton } from "../../../../lib/product-links";
import { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { JsonLd, crumbs } from "../../seo";
import { ATTRS, STANCE_LABEL, WORDS, attrSummary, initials, langCode, platform, scoreText, stanceCounts, takeaway, wordTone,
  type CreatorReview } from "../../../../lib/thread/creators";
import { creatorPage, creatorSlugs } from "../../../../lib/thread/creator-data";
import { CreatorReviews } from "../../live/creator-reviews";
import "../../creators.css";

export const revalidate = 86400;
export const dynamicParams = false;
export async function generateStaticParams() { return creatorSlugs(niche.id).map(slug => ({ slug })); }

type P = { params: Promise<{ slug: string }> };
// The live product page's title, description, canonical (the product's own address) and share image.
export const generateMetadata = ({ params }: P): Promise<Metadata> => liveMetadata({ params, searchParams: Promise.resolve({}) });

const STYLE_WORD = { control: "Control", power: "Power", balance: "All-round" } as const;
/** Owner 2026-11-20: this exact note under Check price (app/thread/racket-v7b.tsx). */
const BUY_NOTE = "Affiliate link - price stays the same";

function Word({ w }: { w: CreatorReview["attrs"][keyof CreatorReview["attrs"]] }) {
  return w ? <span className={`thc-w ${wordTone(w)}`}>{w}</span> : <span className="thc-w none" aria-label="Not covered">–</span>;
}

export default async function CreatorProductPage({ params }: P) {
  const slug = (await params).slug;
  const page = creatorPage(niche.id, slug), d = await racketData(slug);
  if (!page || !d) notFound();
  const { r, row, brand, style } = d, rs = page.reviews, n = stanceCounts(rs);
  const name = withoutYear(row?.name ?? r.name);
  // The live page's buy link, the same logic (app/thread/rackets/[slug]/page.tsx): the Amazon lookup, the saved listing when
  // the two disagree, else the product's own site. No prices: none are stored yet.
  const live = await amazonButton({ name: r.name, brand: brand?.name }), saved = amazonPhoto(r);
  const amazon = live && saved && live.asin !== (r as { amazonAsin?: string | null }).amazonAsin ? { url: saved.url } : live;
  const site = websiteButton(r);
  const shop = amazon ? { url: amazon.url, rel: "sponsored nofollow noopener", where: "Amazon" }
    : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener", where: brand?.name ?? "The maker" } : null;
  const released = r.name.match(/\b(20\d\d)\b/)?.[1] ?? (r.year ? String(r.year) : null);
  const specs = ([...niche.specs.map(s => [s.label, r[s.column]]), ["Released", released]] as [string, string | null][])
    .filter((x): x is [string, string] => !!x[1]);
  const tags = [style ? STYLE_WORD[style] : null, oneShape(r.shape)].filter((x): x is string => !!x);
  const sums = ATTRS.flatMap(([k, label]) => { const s = attrSummary(rs, k); return s ? [{ k, label, ...s }] : []; });
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath },
    ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };

  const specsBox = specs.length > 0 && <section className="th-card th8-box"><h2 className="th8-bh">The basics</h2>
    <div className="th8-specs">{specs.map(([k, v]) => <span key={k} className="th8-kv"><span>{k}</span><strong>{v}</strong></span>)}</div></section>;
  const how = sums.length > 0 && <section className="th-card th8-box thc-how"><h2 className="th8-bh">How it plays</h2>
    <p className="thc-sub">{`The word most creators used, out of ${plural(rs.length, "review")}.`}</p>
    <ul className="thc-how-l">{sums.map(s => <li key={s.k}>
      <span className="thc-how-t"><b>{s.label}</b><Word w={s.word}/><small>{`${s.share} of ${s.n}`}</small></span>
      <span className="thc-dist" aria-label={WORDS.map((w, i) => `${s.counts[i]} ${w}`).join(", ")}>
        {s.counts.map((c, i) => c > 0 && <i key={WORDS[i]} className={wordTone(WORDS[i])} style={{ flex: c }}/>)}</span>
    </li>)}</ul>
    <div className="thc-key">{WORDS.map(w => <span key={w}><i className={wordTone(w)}/>{w}</span>)}</div></section>;
  const buy = <section className="th-card th8-box thc-buy"><h2 className="th8-bh">Where to buy</h2>
    {shop ? <><div className="thc-shop"><span><b>{shop.where}</b><small>Price not tracked yet</small></span>
      <a href={shop.url} target="_blank" rel={shop.rel}>Check price ↗</a></div><small className="thc-note">{BUY_NOTE}</small></>
      : <p className="thc-sub">No shop links for this paddle yet.</p>}
    <p className="thc-sub">Prices from more shops, updated daily, are on the way.</p></section>;

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    <main className="th-main th7 th8 thc">
      <div className="th-col">
        <div className="th-crumbs"><a href={th(catalogPath)}>{catalogLabel}</a>{brand && <><span>/</span><a href={`/brands/${brand.slug}`}>{brand.name}</a></>}</div>
        <article id="overview" className="th-card th8-top">
          <div className="th8-hero">
            <Photo src={row?.pic ?? null} className="th-bigphoto th8-photo"/>
            <div className="th8-hero-r">
              <h1 className="th-h1">{name}</h1>
              {tags.length > 0 && <div className="th-tags">{tags.map((t, i) => <span key={t} className={`th-pill${i === 0 && style ? " lime" : ""}`}>{t}</span>)}</div>}
              <div className="th7-tldr th8-tldr"><div className="thc-tldr-h"><span className="th-tldr-h">TL;DR</span>
                <small>{`from ${plural(rs.length, "creator review")}`}</small></div><p>{page.tldr}</p></div>
              <a className="th8-op" href="#sentiment"><strong>{`${n.pos} of ${rs.length} creators loved it`}</strong>
                <span className="th-sbar" aria-hidden="true"><i style={{ flex: n.pos }}/><i style={{ flex: n.mix }}/><i style={{ flex: n.neg }}/></span>
                <span className="th8-op-n">{(["pos", "mix", "neg"] as const).map(k => <span key={k}><span className={`th-sdot ${k}`}/>{`${n[k]} ${STANCE_LABEL[k].toLowerCase()}`}</span>)}</span>
              </a>
            </div>
          </div>
          <nav className="th7-jump th8-jump" aria-label="On this page">
            <a href="#overview" aria-current="true">Overview</a><a href="#sentiment">Sentiment</a><a href="#creators">Creators</a>
            <a href="#reviews">Reviews</a>
          </nav>
        </article>
        {specsBox && <div className="th8-narrow th8-narrow-basics">{specsBox}</div>}

        <section id="sentiment" className="th-card th8-sec thc-sent">
          <div className="th8-sec-h"><h2 className="th-h2">Creator sentiment</h2><span className="thc-sub">{plural(rs.length, "creator review")}</span></div>
          <div className="thc-sbar">{(["pos", "mix", "neg"] as const).map(k => n[k] > 0 && <span key={k} className={k} style={{ flex: n[k] }}>{n[k] >= 2 ? `${n[k]} ${STANCE_LABEL[k].toLowerCase()}` : n[k]}</span>)}</div>
          <div className="thc-sent-g">{(["pos", "mix", "neg"] as const).map(k => <div key={k} className="thc-sent-c">
            <span className="thc-sent-h"><span className={`th-sdot ${k}`}/><b>{STANCE_LABEL[k]}</b><strong>{n[k]}</strong></span>
            <small>{rs.filter(x => x.stance === k).map(x => x.creator).join(", ") || "None"}</small></div>)}</div>
        </section>

        <section id="creators" className="th-card th8-sec thc-table">
          <div className="th8-sec-h"><h2 className="th-h2">{`All ${rs.length} creators at a glance`}</h2>
            <span className="thc-sub">Tap a creator to jump to the review</span></div>
          <div className="thc-scroll"><table>
            <thead><tr><th>Creator</th><th>Take</th><th>Key point</th>{ATTRS.map(([k, l]) => <th key={k} className="w">{l}</th>)}</tr></thead>
            <tbody>{rs.map(x => <tr key={x.id}>
              <td><a className="thc-who" href={`#cr-${x.id}`}><span className="thc-av" aria-hidden="true">{initials(x.creator)}</span>
                <span><b>{x.creator}</b><small>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · Own score ${scoreText(x.score)}`}</small></span></a></td>
              <td><span className={`th-vpill ${x.stance}`}>{STANCE_LABEL[x.stance]}</span></td>
              <td className="kp">{takeaway(x.summary)}</td>
              {ATTRS.map(([k]) => <td key={k} className="w"><Word w={x.attrs[k]}/></td>)}
            </tr>)}</tbody>
          </table></div>
          {/* Phones: one block per creator in place of the wide table. */}
          <ul className="thc-rows">{rs.map(x => <li key={x.id}><a href={`#cr-${x.id}`}>
            <span className="thc-rows-t"><span className="thc-av" aria-hidden="true">{initials(x.creator)}</span>
              <span><b>{x.creator}</b><small>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · Own score ${scoreText(x.score)}`}</small></span>
              <span className={`th-vpill ${x.stance}`}>{STANCE_LABEL[x.stance]}</span></span>
            <span className="thc-rows-x">{takeaway(x.summary)}</span>
            <span className="thc-chips">{ATTRS.filter(([k]) => x.attrs[k]).map(([k, l]) => <span key={k} className="thc-chip"><small>{l}</small><Word w={x.attrs[k]}/></span>)}</span>
          </a></li>)}</ul>
          <p className="thc-foot">Words follow one scale: Excellent, Great, Good, Okay, Weak. A dash means the creator did not cover it.
            A number shows only where the creator published one.</p>
        </section>
        <div className="th8-narrow">{how}{buy}</div>

        <CreatorReviews reviews={rs}/>
        <p className="thc-foot thc-end">Short summaries of each creator&apos;s own review, with links to the original. Quotes are their words.</p>
      </div>
      <aside className="th-side th8-aside">{specsBox}{how}{buy}</aside>
    </main>
  </Shell>;
}
