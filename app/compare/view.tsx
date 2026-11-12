import type { Metadata } from "next";
import "./compare.css";
import { type catalog as loadCatalog, score } from "../../db/data";
import { niche, productHref, typePageFor, catalogPath } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { listLine } from "../../lib/list-lines";
import { summary } from "../../lib/product-summary";
import { similarProducts, tagProfiles } from "../../lib/similar";
import { amazonButton } from "../../lib/amazon-offer";
import { websiteButton } from "../../lib/product-links";
import { ProductArt, SentimentBar, positiveShare, SignalPop } from "../visual";
import { CompareAdd } from "./compare-add";
import { lightFont } from "../light-font";
import { productSignals } from "../signals";
import { comparePairs, pairHref } from "../../lib/compare-pairs";

// Compare (2026-11): two or three products side by side, every number from published reviews, counted exactly as each
// product page counts them (lib/product-summary, score()). Any mix lives at /compare?ids=slug-a,slug-b,slug-c (not indexed);
// the curated pairs of lib/compare-pairs also have a clean, indexable address, /compare/slug-a-vs-slug-b.

const MAX_COMPARE = 3;
const w = niche.words;
export type Data = Awaited<ReturnType<typeof loadCatalog>>;
export type Query = { ids?: string | string[] };

/** The products named in ?ids= (slugs, or ids for old links), in order, without repeats or unknown names, at most three. */
export function picked(data: Data, q: Query) {
  const raw = (Array.isArray(q.ids) ? q.ids.join(",") : q.ids ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const out: Data["rackets"] = [];
  for (const key of raw) {
    const r = data.listed.find(x => x.slug === key) ?? data.listed.find(x => x.id === key);
    if (r && !out.includes(r)) out.push(r);
    if (out.length === MAX_COMPARE) break;
  }
  return out;
}
export const hrefFor = (slugs: string[]) => slugs.length ? `/compare?ids=${slugs.map(encodeURIComponent).join(",")}` : "/compare";
const nameOf = (data: Data, r: Data["rackets"][number]) => displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name);

/** Title and description for a set of products; `canonical` and `index` come from the route. */
export function compareMetadata(data: Data, products: Data["rackets"], canonical: string, index: boolean): Metadata {
  const names = products.map(r => nameOf(data, r));
  const title = products.length >= 2 ? `${names.join(" vs ")}: Compared by Real Reviews` : `Compare ${w.Many} by Real ${niche.people.One} Reviews`;
  const description = products.length >= 2
    ? `${names.join(" vs ")} side by side: how positive their reviews are, what reviewers praise and complain about, and key specs.`
    : `Pick two or three ${w.many} and see them side by side: share of positive reviews, most-mentioned praise and complaints, and specs.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: "website" },
    ...(index ? {} : { robots: { index: false, follow: true } }) };
}

/** The compare page itself, for either address. */
export async function CompareView({ data, products, light = false }: { data: Data; products: Data["rackets"]; light?: boolean }) {
  const slugs = products.map(r => r.slug);
  const without = (slug: string) => hrefFor(slugs.filter(s => s !== slug));
  const brandOf = (r: Data["rackets"][number]) => data.brands.find(b => b.id === r.brandId)?.name;

  const sigs = await productSignals();
  const cols = await Promise.all(products.map(async r => {
    const brand = brandOf(r), s = score(data, r.id), sum = summary(data, r.id);
    const amazon = await amazonButton({ name: r.name, brand });
    const site = amazon ? null : websiteButton(r);
    return { r, brand, s, sum, signal: sigs.get(r.id)?.signal ?? null, pos: positiveShare(s), line: listLine(r), shop: amazon ? { url: amazon.url, label: "Check price on Amazon", rel: "sponsored nofollow noopener" } : site ? { url: site.url, label: site.label, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null,
      affiliate: !!(amazon || site?.affiliate), type: typePageFor(r.shape) };
  }));

  // Suggestions for the empty slot: what reviewers describe most like the first product (only well-reviewed ones), else the most discussed.
  const reviewed = data.listed.filter(x => score(data, x.id).judged >= 5);
  const discussed = [...reviewed].sort((a, b) => { const x = score(data, a.id), y = score(data, b.id); return (y.count + y.web) - (x.count + x.web); });
  const similar = products[0] ? similarProducts(products[0], reviewed, tagProfiles([...data.reviews, ...data.external]), 6) : [];
  const suggestions = [...similar, ...discussed].filter((x, i, all) => !slugs.includes(x.slug) && all.indexOf(x) === i).slice(0, 4)
    .map(x => { const sc = score(data, x.id); return { slug: x.slug, name: nameOf(data, x), href: hrefFor([...slugs, x.slug]), x, brand: brandOf(x), reviews: sc.count + sc.web, pos: positiveShare(sc) }; });
  const canAdd = products.length < MAX_COMPARE;
  // Other "X vs Y" pages for these products (curated pairs only), so readers and search engines find them.
  const { partners } = comparePairs(data);
  const more = products.flatMap(r => (partners.get(r.id) ?? []).filter(x => !(products.length === 2 && products.includes(x))).map(x => ({ r, x })))
    .filter((v, i, all) => all.findIndex(o => pairHref(o.r.slug, o.x.slug) === pairHref(v.r.slug, v.x.slug)) === i).slice(0, 6);

  // Spec rows: the niche's specs (and model year where it has them); a row nobody has a value for is left out.
  // Model year and type already show under each name, so they are not repeated here.
  const specRows = niche.specs.filter(spec => spec.column !== "shape").map(spec => ({ label: spec.label, get: (r: Data["rackets"][number]) => r[spec.column] as string | null }))
    .filter(row => cols.some(c => row.get(c.r)));
  const tagRows = [["Liked most", "pos", (c: typeof cols[number]) => c.sum.loved.slice(0, 3)], ["Watch for", "neg", (c: typeof cols[number]) => c.sum.complaints.slice(0, 3)]] as const;
  const n = products.length + (canAdd ? 1 : 0);
  const empty = <span className="cmp-none">—</span>;
  const addCell = (key: string) => canAdd ? <div key={key} className="cmp-cell cmp-slot" aria-hidden="true"/> : null;

  // light: the light direction, the default since 2026-11-12 (?look=classic shows the old page) (owner, 2026-11-12); same content, the light look.
  return <main className={`compare v2${light ? ` lt-page lcmp ${lightFont.className}` : ""}`}>
    {cols.some(c => c.affiliate) && <p className="affiliate-note compact">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <div className="page-hero cmp-hero">
      {light && products.length >= 2 && <p className="lf-kicker">{`Compared from ${cols.reduce((a, c) => a + c.sum.total, 0).toLocaleString("en-US")} real ${niche.people.one} reviews`}</p>}
      <h1>{products.length >= 2 ? products.map(r => nameOf(data, r)).join(" vs ") : `Compare ${w.many}`}</h1>
      <p>{products.length >= 2
        ? `Side by side from ${cols.reduce((a, c) => a + c.sum.total, 0).toLocaleString("en-US")} real reviews. Every count is the same as on each ${w.one}’s page.`
        : `Pick two or three ${w.many} to see them side by side: how positive their reviews are, what reviewers praise and complain about, and their specs.`}</p>
      {light && products.length >= 2 && <SignalPop/>}
    </div>

    {products.length === 0 ? <section className="cmp-start">
      <CompareAdd slugs={[]} label={`Find a ${w.one} to start`} autoFocus/>
      <Suggestions items={suggestions} title={`Most discussed ${w.many}`}/>
    </section> : <>
    {products.length === 3 && <p className="cmp-swipe" aria-hidden="true">Swipe to see all three →</p>}
    <div className="cmp-scroll">
      <div className="cmp" style={{ "--n": n, "--np": products.length } as React.CSSProperties}>
        {/* Head: photo, name, type, remove. */}
        <div className="cmp-row cmp-heads">
          {cols.map(c => <div key={c.r.id} className="cmp-cell cmp-head">
            <a className="cmp-remove" href={without(c.r.slug)} aria-label={`Remove ${nameOf(data, c.r)}`} title="Remove">×</a>
            <a href={productHref(c.r)} className="cmp-art"><ProductArt product={c.r} brand={c.brand} eager/></a>
            <h2><a href={productHref(c.r)}>{nameOf(data, c.r)}</a></h2>
            {c.r.shape && <p className="cmp-kind">{c.type ? <a href={`/${c.type.slug}`}>{c.type.one ?? c.r.shape}</a> : c.r.shape}</p>}
            {/* Light look (owner, 2026-11-12): the solid shop button sits in the card, where the "Reviews" heading was. */}
            {light && c.shop && <a className="button cmp-buy" href={c.shop.url} target="_blank" rel={c.shop.rel}>{c.shop.label}</a>}
          </div>)}
          {canAdd && <div className="cmp-cell cmp-head cmp-add">
            <p className="cmp-add-title">{products.length === 1 ? `Add a ${w.one} to compare` : `Add a third ${w.one}`}</p>
            <CompareAdd slugs={slugs} label={`Search ${w.many}`} autoFocus={products.length === 1}/>
            <Suggestions items={suggestions.slice(0, 3)} title={similar.length ? "Reviewed most like it" : "Most discussed"} compact/>
          </div>}
        </div>

        <Row label={light ? "" : "Reviews"}>
          {cols.map(c => <div key={c.r.id} className="cmp-cell cmp-verdict">
            {c.pos !== null ? <>
              {/* The signal score leads where the product has one, as on its page and the catalogue (owner, 2026-11-12). */}
              {c.signal ? <p className="cmp-pos cmp-signal"><b>{c.signal}</b> signal</p> : <p className="cmp-pos"><b>{c.pos}%</b> positive</p>}
              <SentimentBar positive={c.s.positive} mixed={c.s.mixed} negative={c.s.negative} legend className="stacked"/>
            </> : <p className="cmp-few">Not enough reviews to score yet</p>}
            <a className="cmp-count" href={`${productHref(c.r)}#reviews`}>{`${c.sum.total.toLocaleString("en-US")} ${c.sum.total === 1 ? "review" : "reviews"}`} <span aria-hidden="true">→</span></a>
          </div>)}
          {addCell("v")}
        </Row>

        <Row label="In short">
          {cols.map(c => <div key={c.r.id} className="cmp-cell">{c.line ? <p className="cmp-line">{c.line}</p> : empty}</div>)}
          {addCell("l")}
        </Row>

        {tagRows.map(([label, tone, get]) => <Row key={label} label={label} note="reviews mentioning it">
          {cols.map(c => { const ts = get(c); return <div key={c.r.id} className="cmp-cell">
            {ts.length ? <ul className={`cmp-tags ${tone}`}>{ts.map(t => <li key={t}><a href={`${productHref(c.r)}?tag=${encodeURIComponent(t)}#reviews`}><span>{t}</span><b>{c.sum.tagCounts.get(t)}</b></a></li>)}</ul> : empty}
          </div>; })}
          {addCell(label)}
        </Row>)}

        {specRows.length > 0 && <Row label="Specs" group>
          {cols.map(c => <div key={c.r.id} className="cmp-cell"><dl className="cmp-specs">
            {specRows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.get(c.r) || <span className="cmp-none">Not listed</span>}</dd></div>)}
          </dl></div>)}
          {addCell("s")}
        </Row>}

        <div className="cmp-row cmp-actions">
          {cols.map(c => <div key={c.r.id} className="cmp-cell">
            {/* The shop button is the solid one (owner, 2026-11-12); without one, "Read reviews" stays solid. */}
            <a className={c.shop || light ? "button ghost" : "button"} href={`${productHref(c.r)}#reviews`}>Read reviews</a>
            {c.shop && !light && <a className="button" href={c.shop.url} target="_blank" rel={c.shop.rel}>{c.shop.label}</a>}
          </div>)}
          {addCell("a")}
        </div>
      </div>
    </div>
    {/* Phones: the add box sits below the table, so the columns are the products only. */}
    {canAdd && <section className="cmp-add-m">
      <p className="cmp-add-title">{products.length === 1 ? `Add a ${w.one} to compare` : `Add a third ${w.one}`}</p>
      <CompareAdd slugs={slugs} label={`Search ${w.many}`}/>
      <Suggestions items={suggestions.slice(0, 3)} title={similar.length ? "Reviewed most like it" : "Most discussed"} compact/>
    </section>}
    </>}
    {more.length > 0 && <section className="cmp-more">
      <h2>More comparisons</h2>
      <ul>{more.map(({ r, x }) => <li key={pairHref(r.slug, x.slug)}><a href={pairHref(r.slug, x.slug)}>
        <span className="cmp-more-arts"><ProductArt product={r} brand={brandOf(r)}/><ProductArt product={x} brand={brandOf(x)}/></span>
        <span>{nameOf(data, r)} <i>vs</i> {nameOf(data, x)}</span>
      </a></li>)}</ul>
    </section>}
    <p className="cmp-foot">{`Shares count reviews with a clear verdict from the recent window, like each ${w.one}’s page. Tags are counted over the same reviews. `}<a href={catalogPath}>{`All ${w.many}`}</a></p>
  </main>;
}

function Row({ label, note, group, children }: { label: string; note?: string; group?: boolean; children: React.ReactNode }) {
  return <section className={`cmp-row${group ? " cmp-group" : ""}`}>
    {label && <h3 className="cmp-label">{label}{note && <small>{note}</small>}</h3>}
    {children}
  </section>;
}

type Suggestion = { slug: string; name: string; href: string; x: Data["rackets"][number]; brand?: string; reviews: number; pos: number | null };
function Suggestions({ items, title, compact = false }: { items: Suggestion[]; title: string; compact?: boolean }) {
  if (!items.length) return null;
  return <div className={`cmp-sugs${compact ? " compact" : ""}`}>
    <p className="cmp-sugs-title">{title}</p>
    <ul>{items.map(s => <li key={s.slug}><a href={s.href}>
      <ProductArt product={s.x} brand={s.brand}/>
      <span className="cmp-sug-name">{s.name}<small>{[`${s.reviews} reviews`, s.pos !== null ? `${s.pos}% positive` : null].filter(Boolean).join(" · ")}</small></span>
      <span className="cmp-sug-add" aria-hidden="true">+</span>
    </a></li>)}</ul>
  </div>;
}
