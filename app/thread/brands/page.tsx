// Thread brands index (no mockup: built from the Thread parts, owner 2026-11-19). proxy.ts serves it for /brands. Each brand
// with reviewed rackets: how many models, how many reviews (counts under 5 hidden) and its best-scored current racket.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { threadRows } from "../data";
import { Badge, Photo, plural, MIN_SHOWN, SideBox, LinkList } from "../ui";
import { threadRankings } from "../rankings-data";
import { metadata as live } from "../../brands/page";
import { JsonLd, crumbs } from "../seo";
import { th } from "../../../lib/thread/look";

export const revalidate = 21600;
export const metadata: Metadata = live;

export default async function ThreadBrands() {
  const [{ ctx, all }, lists] = await Promise.all([threadRows(), threadRankings()]);
  const brands = (ctx?.data.listedBrands ?? []).map(b => {
    const rows = all.filter(r => r.brand === b.name && r.n > 0), current = rows.filter(r => r.current !== false);
    const top = [...current].filter(r => r.score != null).sort((x, y) => y.score! - x.score! || y.n - x.n)[0] ?? null;
    return { b, models: current.length, reviews: rows.reduce((n, r) => n + r.n, 0), top, pic: top?.pic ?? current.find(r => r.pic)?.pic ?? null };
  }).filter(x => x.models > 0).sort((a, b) => b.reviews - a.reviews || a.b.name.localeCompare(b.b.name));
  return <Shell>
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [crumbs([{ name: "Brands", path: "/brands" }])] }}/>
    <main className="th-main"><div className="th-col">
      <section className="th-card th-hero">
        <h1 className="th-h1">Padel racket brands</h1>
        <p className="th-lead">Every brand with rackets players have reviewed, most reviewed first.</p>
      </section>
      <section className="th-card th-list"><ul className="th-brands">{brands.map(({ b, models, reviews, top, pic }) =>
        <li key={b.id}><a className="th-brand" href={th(`/brands/${b.slug}`)}>
          <Photo src={pic} className="th-brand-pic"/>
          <span className="th-brand-body"><strong>{b.name}</strong>
            <span className="th-note">{[models >= MIN_SHOWN ? plural(models, "racket") : "", reviews >= MIN_SHOWN ? plural(reviews, "review") : ""].filter(Boolean).join(" · ")}</span>
            {top && <span className="th-note">{`Top rated: ${top.name.replace(new RegExp(`^${b.name}\\s+`, "i"), "")}`}</span>}</span>
          {top?.score != null && <Badge n={top.score} size="sm"/>}
          <span className="th-link-b" aria-hidden="true">›</span>
        </a></li>)}</ul></section>
    </div>
    {lists.length > 0 && <aside className="th-side"><SideBox title="Rankings"><LinkList links={lists.slice(0, 8).map(l => ({ label: l.label, href: l.href }))}/></SideBox></aside>}
    </main>
  </Shell>;
}
