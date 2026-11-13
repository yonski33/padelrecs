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
import { ProductArt, SignalPop } from "../visual";
import { productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { lightFont } from "../light-font";
import { ProductIcon } from "../icons";

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
    // The rankings hub after the owner's mockup (2026-11-13): rankings by type, then by what matters (trait lists), as
    // cards with the type's icon, a line, how many are ranked and the top pick's photo.
    const card = ({ list, entries }: (typeof unique)[number]) => { const top = entries[0], r = top && data.rackets.find(x => x.id === top.product.id), b = top ? brandOf(top.product.brandId) : undefined;
      return <li key={list.slug}><a className="lrx-card" href={`${listHref(list.slug)}`}>
        <span className="lrx-icon" aria-hidden="true"><ProductIcon shape={top?.product.shape ?? null} brand={b}/></span>
        <span className="lrx-text"><b>{list.label}</b>{list.intro && <span className="lrx-intro">{list.intro}</span>}<small>{`${entries.length} ranked`}</small></span>
        {top && <span className="lrx-top"><span className="lrx-art">{r && <ProductArt product={r} brand={b}/>}</span>
          <span className="lrx-pick"><small>Top pick</small><b>{displayName(top.product.name, b)}</b></span></span>}
        <span className="lrx-go" aria-hidden="true">→</span>
      </a></li>; };
    const groups = [{ title: `By ${w.one}`, lists: unique.filter(l => !l.list.trait) }, { title: "By what matters", lists: unique.filter(l => l.list.trait) }].filter(g => g.lists.length);
    return <main className={`top-page v2 lt-page lri lrx ${lightFont.className}`}>
      <p className="crumbs"><a href="/">Home</a><span>/</span>Rankings</p>
      <header className="lrx-hero">
        <h1>{`Explore ${category.split(" ")[0].toLowerCase()} `}<em>rankings</em></h1>
        <p className="lrx-sub">{`The ${w.many} real ${people.many} recommend, organized by type and what matters most.`}</p>
        <p className="lrx-meta">{`${unique.length} rankings · ${reviews.size} ${w.many} · Built from real ${people.one} reviews · No sponsored placements`}<span className="lrx-sep" aria-hidden="true">|</span><SignalPop label="How rankings work"/></p>
      </header>
      {groups.map(g => <section key={g.title} className="lrx-group">
        <h2>{g.title}<span className="lrx-count">{`${g.lists.length} ${g.lists.length === 1 ? "ranking" : "rankings"}`}</span></h2>
        <ul className="lrx-grid">{g.lists.map(card)}</ul>
      </section>)}
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
