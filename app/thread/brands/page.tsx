// Thread brands index (no mockup: built from the Thread parts, owner 2026-11-19). proxy.ts serves it for /brands. Each brand
// with reviewed rackets: how many models, how many reviews (counts under 5 hidden) and its best-scored current racket.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { threadRows } from "../data";
import { Badge, Photo, plural, SideBox, LinkList } from "../ui";
import { threadRankings } from "../rankings-data";
import { metadata as live } from "../../brands/page";
import { JsonLd, crumbs } from "../seo";
import { th } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { W } from "../../../lib/thread/words";
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const revalidate = 21600;
export const metadata: Metadata = live;

export default async function ThreadBrands() {
  const [{ ctx, all }, lists] = await Promise.all([threadRows(), threadRankings()]);
  const brands = (ctx?.data.listedBrands ?? []).map(b => {
    const rows = all.filter(r => r.brand === b.name && r.n > 0), current = rows.filter(r => r.current !== false);
    const top = [...current].filter(r => r.score != null).sort((x, y) => y.score! - x.score! || y.n - x.n)[0] ?? null;
    return { b, models: current.length, reviews: rows.reduce((n, r) => n + r.n, 0), top, pic: top?.pic ?? current.find(r => r.pic)?.pic ?? null };
  }).filter(x => x.models > 0).sort((a, b) => b.reviews - a.reviews || a.b.name.localeCompare(b.b.name));
  // PadelRecs Brands v3 (owner design 2026-11-21): brand cards with rackets, opinions and the most loved racket (most
  // "loved it" reviews, not a score), sorted by opinions; the rankings move to a row of links under the cards.
  if (niche.id === "padel") return <Shell>
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [crumbs([{ name: "Brands", path: "/brands" }])] }}/>
    <main className="th-main thb3">
      <section className="th-card thb3-title"><h1 className="th-h1">Brands</h1><p>{`${brands.length} brands, sorted by player opinions.`}</p></section>
      <div className="thb3-cards">{brands.map(({ b, models, reviews }) => {
        const loved = all.filter(r => r.brand === b.name && r.current !== false && r.pos > 0).sort((x, y) => y.pos - x.pos || y.n - x.n)[0] ?? null;
        return <a key={b.id} className="th-card thb3-card" href={th(`/brands/${b.slug}`)}>
          <strong className="name">{b.name}</strong>
          <span className="counts">{[plural(models, "racket"), reviews > 0 ? plural(reviews, "opinion") : ""].filter(Boolean).join(" · ")}</span>
          {loved && <span className="loved"><span>Most loved:</span> <strong>{loved.name.replace(new RegExp(`^${b.name}\\s+`, "i"), "")}</strong></span>}
          <span className="go">See rackets →</span>
        </a>; })}</div>
      {lists.length > 0 && <nav className="thb3-links" aria-label="Rankings"><span>Rankings</span>{lists.slice(0, 8).map(l => <a key={l.href} href={th(l.href)}>{l.label}</a>)}</nav>}
    </main>
  </Shell>;
  return <Shell>
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [crumbs([{ name: "Brands", path: "/brands" }])] }}/>
    <main className="th-main"><div className="th-col">
      <section className="th-card th-hero">
        <h1 className="th-h1">{niche.id === "skin" ? "Skincare brands" : niche.id === "discgolf" ? "Disc golf brands" : niche.id === "simracing" ? "Sim racing brands" : `${cap(niche.id)} ${niche.words.one} brands`}</h1>
        <p className="th-lead">{`Every brand with ${niche.words.many} ${W.people} have reviewed, most reviewed first.`}</p>
      </section>
      <section className="th-card th-list"><ul className="th-brands">{brands.map(({ b, models, reviews, top, pic }) =>
        <li key={b.id}><a className="th-brand" href={th(`/brands/${b.slug}`)}>
          <Photo src={pic} className="th-brand-pic"/>
          <span className="th-brand-body"><strong>{b.name}</strong>
            <span className="th-note">{[models > 0 ? plural(models, "racket") : "", reviews > 0 ? plural(reviews, "review") : ""].filter(Boolean).join(" · ")}</span>
            {top && <span className="th-note">{`Top rated: ${top.name.replace(new RegExp(`^${b.name}\\s+`, "i"), "")}`}</span>}</span>
          {top?.score != null && <Badge n={top.score} size="sm"/>}
          <span className="th-link-b" aria-hidden="true">›</span>
        </a></li>)}</ul></section>
    </div>
    {lists.length > 0 && <aside className="th-side"><SideBox title="Rankings"><LinkList links={lists.slice(0, 8).map(l => ({ label: l.label, href: l.href }))}/></SideBox></aside>}
    </main>
  </Shell>;
}
