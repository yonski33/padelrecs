// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
import { isLight } from "../../lib/look";
import { fitText } from "../../lib/fit-text";
import { siteOgImages } from "../site-og";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../lib/niche";
import { RANKINGS_PATH, listYear } from "../../lib/top-lists";
import { BrowseTile } from "../visual";
import { rankedLists, listHref, longDate, currentYear } from "./lists";
import { FinderInvite } from "../finder/invite";
import { ProductArt } from "../visual";
import { productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { lightFont } from "../light-font";

const w = niche.words, people = niche.people;
// "Padel racket" → "Padel Racket".
const category = niche.seo.productCategory.replace(/\b\w/g, c => c.toUpperCase());
const heading = `${category} Rankings`;

export async function generateMetadata(): Promise<Metadata> {
  const { lists } = await rankedLists();
  if (!lists.length) return { robots: { index: false } };
  const title = `${heading} ${currentYear()}, Based on Real ${people.One} Reviews`;
  const description = fitText([`${w.many[0].toUpperCase()}${w.many.slice(1)} ranked by what ${people.many} actually say: ${lists.map(l => l.list.label.toLowerCase()).join(", ")}.`, "No sponsored placements; updated as new reviews come in."]);
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: RANKINGS_PATH }, openGraph: { title, description, url: RANKINGS_PATH, type: "website", images: siteOgImages } };
}

export default async function TopListsIndex({ searchParams }: { searchParams: Promise<{ look?: string }> }) {
  const [{ data, lists }, f] = await Promise.all([rankedLists(), searchParams]);
  if (!lists.length) notFound();
  const updated = lists.reduce((a, l) => l.updated > a ? l.updated : a, "");
  // The light direction, the default since 2026-11-12 (?look=classic shows the old page) (owner, 2026-11-12): each ranking as a calm card with its top three.
  if (isLight(f.look)) {
    const seen = new Set<string>(), unique = lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug));
    const reviews = new Set(unique.flatMap(l => l.entries.map(e => e.product.id)));
    const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name;
    return <main className={`top-page v2 lt-page lri ${lightFont.className}`}>
      <p className="crumbs"><a href="/">Home</a><span>/</span>Rankings</p>
      <header className="lr-hero">
        <h1>{`${category[0]}${category.slice(1).toLowerCase()} rankings, according to `}<em>{`real ${people.many}`}</em></h1>
        <p className="lr-sub">{`${unique.length} rankings of ${reviews.size} ${w.many}, counted from published reviews · no sponsored placements${updated ? ` · updated ${new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`}</p>
      </header>
      <ul className="lri-grid">{unique.map(({ list, entries }) => <li key={list.slug} className="lri-card">
        <a className="lri-head" href={`${listHref(list.slug)}`}><h2>{list.label}</h2><span>{`${entries.length} ranked →`}</span></a>
        {list.intro && <p className="lri-intro">{list.intro}</p>}
        <ol>{entries.slice(0, 3).map(e => { const r = data.rackets.find(x => x.id === e.product.id); const b = brandOf(e.product.brandId); return <li key={e.product.id}><a href={`${productHref(e.product)}`}>
          <span className="lri-rank">{`#${e.rank}`}</span>
          <span className="lri-art">{r && <ProductArt product={r} brand={b}/>}</span>
          <span className="lri-name">{displayName(e.product.name, b)}</span>
          {e.signal && <b className="lri-sig">{e.signal.signal}</b>}
        </a></li>; })}</ol>
      </li>)}</ul>
      {niche.finder && <a className="lri-finder" href="/finder"><b>{niche.finder.heading}</b><span>{niche.finder.invite}</span><span className="lri-go">{`${niche.finder.navLabel} →`}</span></a>}
    </main>;
  }
  return <main className="top-page v2 rankings-index">
    <div className="page-hero">
      <h1>{heading}</h1>
      <p>{`${w.Many} ranked by what ${people.many} say about them in published reviews. No sponsored placements; every number is counted from reviews you can read.`}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time></p>}
    </div>
    {/* Each ranking as a big image tile with its top three (2026-11 redesign); the click opens the full list. */}
    <div className="btile-row index-tiles">{lists.map(({ list, entries }) => {
      const products = entries.slice(0, 3).map(e => data.rackets.find(r => r.id === e.product.id)).filter((r): r is NonNullable<typeof r> => !!r);
      return products.length ? <BrowseTile key={list.slug} data={data} tile={{ key: list.slug, href: listHref(list.slug), label: list.label, note: `${list.title} ${listYear(list)} · ${entries.length} ranked`, products }}/> : null;
    })}</div>
    <FinderInvite/>
  </main>;
}
