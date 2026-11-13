// The full review feed on its own page (owner's mockup, 2026-11-13): newest first, filtered by category, sentiment and
// source, 12 cards at a time. The home page shows four of them and links here. Per request, cached at the edge for a minute.
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "../../db/data";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { platformName, sourceLabel } from "../../lib/source-label";
import { ProductArt, quoteText } from "../visual";
import { SourceIcon } from "../icons";
import { AutoSubmitForm } from "../auto-submit";
import { ago } from "../home-catalog";
import { lightFont } from "../light-font";
import { siteOgImages } from "../site-og";

const PAGE = 12, w = niche.words, people = niche.people;
const SENTIMENTS = [["", "All"], ["positive", "Positive"], ["mixed", "Mixed"], ["negative", "Negative"]] as const;
const word = { positive: "Positive", mixed: "Mixed", negative: "Negative" } as const;

export function generateMetadata(): Metadata {
  const title = `Latest ${w.One} Reviews from Real ${people.One}s`;
  const description = `The newest first-hand ${w.one} reviews from Reddit, YouTube, blogs and ${niche.site.name} ${people.many}, each linked to its source.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: "/reviews" }, openGraph: { title, description, url: "/reviews", type: "website", images: siteOgImages } };
}

type Search = { type?: string; sentiment?: string; source?: string; show?: string };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [data, f] = await Promise.all([catalog(), searchParams]);
  const now = Date.now();
  const type = niche.typePages?.find(t => t.slug === f.type);
  const shapeOf = new Map(data.rackets.map(r => [r.id, r.shape?.toLowerCase()]));
  const own = niche.site.name;
  // One list, newest first: web reviews dated by their source, reviews written here by their date.
  const all = [
    ...data.reviews.map(r => ({ key: `p-${r.id}`, racketId: r.racketId, date: r.createdAt, source: own, verdict: r.rating >= 4 ? "positive" : r.rating === 3 ? "mixed" : "negative", text: r.reviewText, where: r.alias || null, url: null as string | null, entry: null as null | (typeof data.external)[number] })),
    ...data.external.filter(e => e.sentiment).map(e => ({ key: `w-${e.id}`, racketId: e.racketId, date: e.sourceDate || e.createdAt, source: platformName(e.sourcePlatform), verdict: e.sentiment as string, text: quoteText(e), where: sourceLabel(e).name, url: e.sourceUrl, entry: e })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const sources = [...new Set(all.map(x => x.source))].sort((a, b) => (a === own ? 1 : 0) - (b === own ? 1 : 0) || a.localeCompare(b));
  const inType = (x: { racketId: string }) => !type || shapeOf.get(x.racketId) === type.shape.toLowerCase();
  const items = all.filter(x => inType(x) && (!f.sentiment || x.verdict === f.sentiment) && (!f.source || x.source === f.source));
  const show = Math.min(1200, Math.max(PAGE, Number(f.show) || PAGE));
  const href = (next: Partial<Search>) => { const q = new URLSearchParams(Object.entries({ type: f.type, sentiment: f.sentiment, source: f.source, ...next }).filter(([, v]) => v) as [string, string][]); return q.size ? `/reviews?${q}` : "/reviews"; };
  const types = niche.typePages ?? [], head = types.slice(0, 4), more = types.slice(4);
  const byId = new Map(data.rackets.map(r => [r.id, r]));

  return <main className={`lt-page lrv ${lightFont.className}`}>
    <p className="crumbs"><a href="/">Home</a><span>/</span>Reviews</p>
    <header className="lrv-hero">
      <h1>Latest reviews</h1>
      <p className="lrv-sub">{`Fresh experiences from real ${people.many}, collected from Reddit, YouTube and blogs and linked to their sources.`}</p>
      <p className="lrv-meta">Updated continuously · Most recent first</p>
    </header>
    <div className="lrv-bar">
      {types.length > 1 && <nav className="lt-cats lrv-cats" aria-label={`${w.One} types`}>
        <Link href={href({ type: undefined, show: undefined })} scroll={false} aria-current={!type ? "true" : undefined}>All</Link>
        {head.map(t => <Link key={t.slug} href={href({ type: t.slug, show: undefined })} scroll={false} aria-current={type?.slug === t.slug ? "true" : undefined}>{t.label}</Link>)}
        {more.length > 0 && <details className="lc-more"><summary>{more.some(t => t.slug === type?.slug) ? type!.label : "More"} <span aria-hidden="true">⌄</span></summary>
          <div>{more.map(t => <Link key={t.slug} href={href({ type: t.slug, show: undefined })} scroll={false} aria-current={type?.slug === t.slug ? "true" : undefined}>{t.label}</Link>)}</div></details>}
      </nav>}
      <AutoSubmitForm className="lrv-filters" action="/reviews">
        {f.type && <input type="hidden" name="type" value={f.type}/>}
        <label><span className="sr-only">Sentiment</span><select name="sentiment" defaultValue={f.sentiment ?? ""}>{SENTIMENTS.map(([v, l]) => <option key={v} value={v}>{`Sentiment: ${l}`}</option>)}</select></label>
        <label><span className="sr-only">Source</span><select name="source" defaultValue={f.source ?? ""}><option value="">Sources: All</option>{sources.map(s => <option key={s} value={s}>{`Sources: ${s}`}</option>)}</select></label>
        <noscript><button className="button ghost">Apply</button></noscript>
      </AutoSubmitForm>
    </div>
    {items.length ? <div className="lrv-grid">{items.slice(0, show).map(x => { const r = byId.get(x.racketId); if (!r) return null;
      const brand = data.brands.find(b => b.id === r.brandId)?.name;
      return <article key={x.key} className="lrv-card">
        <a className="lrv-art" href={productHref(r)} aria-hidden="true" tabIndex={-1}><ProductArt product={r} brand={brand}/></a>
        <div className="lrv-body">
          <header><a className="lrv-name" href={productHref(r)}>{displayName(r.name, brand)}</a><span className={`spill s-${x.verdict}`}>{word[x.verdict as keyof typeof word]}</span></header>
          <p className="lrv-src">{x.entry && <SourceIcon platform={x.entry.sourcePlatform}/>}{[x.source, x.where, ago(x.date, now)].filter(Boolean).join(" · ")}</p>
          <p className="lrv-text">{x.text}</p>
          <footer><a href={`${productHref(r)}#reviews`}><span className="lrv-long">Read product reviews</span><span className="lrv-short">Product reviews</span> <span aria-hidden="true">→</span></a>
            {x.url && x.entry && <a className="lrv-orig" href={x.url} target="_blank" rel="noopener noreferrer">Original source <span aria-hidden="true">↗</span></a>}</footer>
        </div>
      </article>; })}</div>
      : <p className="empty-feed">No reviews match these filters yet. <a href="/reviews">Show all reviews</a></p>}
    {items.length > show && <div className="load-more"><Link className="button ghost lt-more-btn" href={href({ show: String(show + PAGE) })} scroll={false}>Load more reviews <span aria-hidden="true">↓</span></Link></div>}
  </main>;
}
