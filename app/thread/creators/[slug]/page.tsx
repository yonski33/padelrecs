// The creator-centred product page (owner mock 2026-11-22, the AT10 "editorial redesign" layout; owner direction: an
// iemranking-style page of what YouTube and blog creators said). A preview: proxy.ts serves it for ?view=creators on a
// product with creator data (lib/thread/sites.ts creatorPageFor); the live product page is unchanged. Cached like the live
// product pages (ISR); the cards' filter, sort and Read more run in the browser (live/creator-reviews.tsx).
// Order, as the mock: the head (photo · name, TL;DR "from N creator reviews", Check price · Specs box) → Creator sentiment
// in detail → The big picture → the creator table beside How it plays and Where to buy → Creator reviews. Full width, no
// sidebar; under 1000px everything stacks.
// Data: db/creators/<site>.json (lib/thread/creator-data.ts), a static demo fixture; the photo, specs and shop link are the
// product's own (racketData). Words, never invented scores; a number only where the creator published one; no prices
// (none are stored yet); no Reddit card (no Reddit data staged for these paddles yet).
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
import { ATTRS, STANCE_LABEL, TABLE_ATTRS, bigPicture, howItPlays, langCode, platform, scoreText, stanceCounts, takeaway,
  wordTone, type CreatorReview } from "../../../../lib/thread/creators";
import { creatorPage, creatorSlugs } from "../../../../lib/thread/creator-data";
import { Avatar, CreatorReviews } from "../../live/creator-reviews";
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
const KEYS = ["pos", "mix", "neg"] as const;

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
  const sub = [style ? STYLE_WORD[style] : null, oneShape(r.shape)?.toLowerCase()].filter(Boolean).join(", ");
  const how = howItPlays(rs), big = bigPicture(rs);
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath },
    ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    <main className="thc">
      <div className="th-crumbs"><a href={th(catalogPath)}>{catalogLabel}</a>{brand && <><span>/</span><a href={`/brands/${brand.slug}`}>{brand.name}</a></>}</div>
      <header className="thc-head">
        <Photo src={row?.pic ?? null} className="th-bigphoto thc-photo"/>
        <div className="thc-head-m">
          <h1 className="th-h1">{name}</h1>
          {sub && <p className="thc-lede">{`${sub[0]!.toUpperCase()}${sub.slice(1)} paddle${brand ? ` from ${brand.name}` : ""}.`}</p>}
          <div className="thc-tldr">
            <span className="thc-tldr-h"><b>TL;DR</b><small>{`from ${plural(rs.length, "creator review")}`}</small></span>
            <p className="thc-tldr-t">{page.tldr}</p>
            <p className="thc-tldr-s">{`${n.pos} of ${rs.length} creators loved it${n.mix ? `, ${n.mix} were mixed` : ""}${n.neg ? ` and ${n.neg} found it not for them` : ""}.`}</p>
            <div className="thc-tldr-f"><small>{shop ? "Price not tracked yet" : "No shop links yet"}</small>
              {shop && <a className="thc-cta" href={shop.url} target="_blank" rel={shop.rel}>Check price ↗</a>}</div>
          </div>
        </div>
        {specs.length > 0 && <section className="th-card thc-specs"><h2>Specs</h2>
          {specs.map(([k, v]) => <span key={k} className="thc-kv"><span>{k}</span><strong>{v}</strong></span>)}</section>}
      </header>

      <section id="sentiment" className="th-card thc-sec">
        <div className="thc-sec-h"><h2 className="th-h2">Creator sentiment in detail</h2><span className="thc-sub">{plural(rs.length, "creator review")}</span></div>
        <div className="thc-sbar">{KEYS.map(k => n[k] > 0 && <span key={k} className={k} style={{ flex: n[k] }}>{k === "pos" ? `${n[k]} loved it` : n[k]}</span>)}</div>
        <div className="thc-sent-g">{KEYS.map(k => <div key={k} className="thc-sent-c">
          <span className="thc-sent-h"><span className={`th-sdot ${k}`}/><b>{STANCE_LABEL[k]}</b><strong>{n[k]}</strong></span>
          <p>{n[k] ? page.groups[k] : "None of the creators."}</p></div>)}</div>
      </section>

      {(big.likes.length > 0 || big.concerns.length > 0) && <section className="th-card thc-sec thc-big">
        <div className="thc-sec-h"><h2 className="th-h2">The big picture</h2><span className="thc-sub">{`What ${rs.length} creators agree on`}</span></div>
        <div className="thc-big-g">
          <div><b className="pos">What creators like</b><span className="thc-tags">{big.likes.map(t => <span key={t} className="thc-pm pos">{`+ ${t}`}</span>)}</span></div>
          <div><b className="neg">Common concerns</b><span className="thc-tags">{big.concerns.length ? big.concerns.map(t => <span key={t} className="thc-pm neg">{`− ${t}`}</span>)
            : <span className="thc-sub">No attribute drew Okay or Weak from a third of creators.</span>}</span></div>
        </div>
      </section>}

      <div className="thc-row">
        <section id="creators" className="th-card thc-sec thc-table">
          <div className="thc-sec-h"><h2 className="th-h2">{`All ${rs.length} creators at a glance`}</h2>
            <span className="thc-sub">Tap a row to jump to the full summary</span></div>
          <table>
            <thead><tr><th>Creator</th><th>Take</th><th className="kp">Key point</th>{TABLE_ATTRS.map(k => <th key={k} className="w">{ATTRS.find(a => a[0] === k)![1]}</th>)}</tr></thead>
            <tbody>{rs.map(x => <tr key={x.id}>
              <td><a className="thc-who" href={`#cr-${x.id}`}><Avatar name={x.creator}/>
                <span><b>{x.creator}</b><small>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · ${scoreText(x.score)}`}</small></span></a></td>
              <td><span className={`th-vpill ${x.stance}`}>{STANCE_LABEL[x.stance]}</span></td>
              <td className="kp">{takeaway(x.summary)}</td>
              {TABLE_ATTRS.map(k => <td key={k} className="w" data-l={ATTRS.find(a => a[0] === k)![1]}><Word w={x.attrs[k]}/></td>)}
            </tr>)}</tbody>
          </table>
          <p className="thc-foot">Words come from each creator&apos;s own review. A number shows only where the creator published one.</p>
        </section>
        <div className="thc-side">
          {how.length > 0 && <section className="th-card thc-sec thc-how">
            <div className="thc-sec-h"><h2 className="th-h2">How it plays</h2><span className="thc-sub">{`From all ${rs.length} reviews`}</span></div>
            <ul>{how.map(h => <li key={h.k}><span className="thc-how-k"><b>{h.label}</b><Word w={h.word}/></span><span>{h.line}</span></li>)}</ul>
          </section>}
          <section id="buy" className="th-card thc-sec thc-buy">
            <div className="thc-sec-h"><h2 className="th-h2">Where to buy</h2></div>
            {shop ? <div className="thc-shop"><span><b>{shop.where}</b><small>Price not tracked yet</small></span>
              <a href={shop.url} target="_blank" rel={shop.rel}>Check price ↗</a></div>
              : <p className="thc-sub">No shop links for this paddle yet.</p>}
            <p className="thc-foot">{`Prices from more shops, updated daily, are on the way.${shop ? ` ${BUY_NOTE}.` : ""}`}</p>
          </section>
        </div>
      </div>

      <CreatorReviews reviews={rs}/>
    </main>
  </Shell>;
}
