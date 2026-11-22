// The creator-centred product page, built to the owner's creator-page mockup (2026-11-22, its source unpacked in the
// shared notes: spacing, type scale, colours, card structure and section order copied from it). Owner direction: an
// iemranking-style page of what YouTube and blog creators said. A preview: proxy.ts serves it for ?view=creators on a
// product with creator data (lib/thread/sites.ts creatorPageFor); the live product page is unchanged. Cached like the live
// product pages (ISR); the cards' filter, sort, Read more and Show more run in the browser (live/creator-reviews.tsx).
// Order, as the mock: the head (photo · name, TL;DR "from N creator reviews", Check price · Specs) → a rule → Creator
// sentiment in detail → The big picture → the at-a-glance table beside How it plays and Where to buy → Creator reviews.
// Data: db/creators/<site>.json (lib/thread/creator-data.ts), a static demo fixture; the photo, specs and shop link are the
// product's own (racketData). Words, never invented scores; a number only where the creator published one; no prices
// (none are stored yet); no Reddit card (no Reddit data staged for these paddles yet).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { racketData } from "../../racket-data";
import { plural } from "../../ui";
import { niche } from "../../../../lib/niche";
import { withoutYear } from "../../../../lib/brand-name";
import { oneShape } from "../../../../lib/thread/shape";
import { amazonButton } from "../../../../lib/amazon-offer";
import { amazonPhoto } from "../../../../lib/amazon-photos";
import { websiteButton } from "../../../../lib/product-links";
import { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { JsonLd, crumbs } from "../../seo";
import { catalogLabel, catalogPath, productHref } from "../../../../lib/niche";
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
const label = (k: (typeof ATTRS)[number][0]) => ATTRS.find(a => a[0] === k)![1];

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
  const pic = row?.pic ?? null;

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    <div className="thc">
      <header className="thc-head">
        <div className="thc-photo">{pic ? <img src={pic} alt={name}/> : <span className="th-ph" aria-hidden="true"/>}</div>
        <div className="thc-head-m">
          <h1>{name}</h1>
          {sub && <span className="thc-lede">{`${sub[0]!.toUpperCase()}${sub.slice(1)} paddle${brand ? ` from ${brand.name}` : ""}.`}</span>}
          <div className="thc-tldr">
            <span className="thc-tldr-h"><b>TL;DR</b><span>{`from ${plural(rs.length, "creator review")}`}</span></span>
            <strong>{page.tldr}</strong>
            <span className="thc-tldr-s">{`${n.pos} of ${rs.length} creators loved it${n.mix ? `, ${n.mix} were mixed` : ""}${n.neg ? ` and ${n.neg} found it not for them` : ""}.`}</span>
            <span className="thc-tldr-f"><span>{shop ? "Price not tracked yet" : "No shop links yet"}</span>
              {shop && <a className="thc-cta" href={shop.url} target="_blank" rel={shop.rel}>Check price ↗</a>}</span>
          </div>
        </div>
        {specs.length > 0 && <div className="thc-specs"><strong>Specs</strong>
          {specs.map(([k, v]) => <span key={k}><span>{k}</span><strong>{v}</strong></span>)}</div>}
      </header>
      <div className="thc-rule"/>

      <main className="thc-body">
        <section id="sentiment" className="thc-box1 thc-sent">
          <div className="thc-h"><strong>Creator sentiment in detail</strong><span>{plural(rs.length, "creator review")}</span></div>
          <div className="thc-sbar">{KEYS.map(k => n[k] > 0 && <span key={k} className={k} style={{ flex: n[k] }}>{k === "pos" ? `${n[k]} loved it` : n[k]}</span>)}</div>
          <div className="thc-sent-g">{KEYS.map(k => <div key={k}>
            <span className="thc-sent-h"><span><span className={`thc-dot ${k}`}>●</span>{STANCE_LABEL[k]}</span><strong>{n[k]}</strong></span>
            <span className="thc-sent-x">{n[k] ? page.groups[k] : "None of the creators."}</span></div>)}</div>
        </section>

        {(big.likes.length > 0 || big.concerns.length > 0) && <section className="thc-box1 flush">
          <div className="thc-h rule"><strong>The big picture</strong><span>{`What ${rs.length} creators agree on`}</span></div>
          <div className="thc-big">
            <div><strong className="pos">What creators like</strong><span className="thc-chips">{big.likes.map(t => <span key={t} className="thc-pm pos lg">{`+ ${t}`}</span>)}</span></div>
            <div><strong className="neg">Common concerns</strong><span className="thc-chips">{big.concerns.length ? big.concerns.map(t => <span key={t} className="thc-pm neg lg">{`− ${t}`}</span>)
              : <span className="thc-none">No attribute drew Okay or Weak from a third of creators.</span>}</span></div>
          </div>
        </section>}

        <div className="thc-row">
          <div className="thc-row-l">
            <section id="creators" className="thc-box1 flush thc-glance">
              <div className="thc-h rule"><strong>{`All ${rs.length} creators at a glance`}</strong><span>Tap a row to jump to the full summary</span></div>
              <div className="thc-g-row thc-g-head"><span>Creator</span><span>Take</span><span className="kp">Key point</span>{TABLE_ATTRS.map(k => <span key={k}>{label(k)}</span>)}</div>
              {rs.map(x => <a key={x.id} className="thc-g-row" href={`#cr-${x.id}`}>
                <span className="thc-g-who"><Avatar name={x.creator} kind={x.kind} size="sm"/><span><strong>{x.creator}</strong>
                  <span>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · ${scoreText(x.score)}`}</span></span></span>
                <span className={`thc-take sm ${x.stance}`}>{STANCE_LABEL[x.stance]}</span>
                <span className="kp">{takeaway(x.summary)}</span>
                {TABLE_ATTRS.map(k => <span key={k} className="thc-g-w" data-l={label(k)}><Word w={x.attrs[k]}/></span>)}
              </a>)}
              <span className="thc-note">Words come from what each creator said in their own review. A number shows only where the creator published one.</span>
            </section>
          </div>
          <div className="thc-row-r">
            {how.length > 0 && <section className="thc-box1 flush">
              <div className="thc-h rule"><strong>How it plays</strong><span>{`From all ${rs.length} reviews`}</span></div>
              {how.map(h => <div key={h.k} className="thc-grade"><span><strong>{h.label}</strong><Word w={h.word}/></span><span>{h.line}</span></div>)}
            </section>}
            <section id="buy" className="thc-box1 flush">
              <div className="thc-h rule"><strong>Where to buy</strong></div>
              {shop ? <div className="thc-shop"><span><strong>{shop.where}</strong><span>Price not tracked yet</span></span>
                <a href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a></div>
                : <div className="thc-shop"><span><span>No shop links for this paddle yet.</span></span></div>}
              <span className="thc-note">{`Prices from more shops, updated daily, are on the way.${shop ? ` ${BUY_NOTE}.` : ""}`}</span>
            </section>
          </div>
        </div>

        <CreatorReviews reviews={rs}/>
      </main>
    </div>
  </Shell>;
}
