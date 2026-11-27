// A creator's page (owner mock "PickleballRecs Creator Page", 2026-11-27), served for /creators/<slug> (lib/thread/look.ts):
// the breadcrumb, the head (initials, platform, subscribers, language, name, bio, topic chips, channel and social links), the
// "On PickleballRecs" box (reviews summed up, reviewing since, their takes, how often they agree with the other reviewers),
// their favourites, all their reviews (live/reviewer-list.tsx: filters and sort in the browser) and creators with a similar
// taste. No scores anywhere (owner: the "player score" boxes were dropped). Only creators with 5+ live reviews have a page.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { JsonLd, crumbs } from "../../seo";
import { th } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";
import { withoutYear } from "../../../../lib/brand-name";
import { langCode } from "../../../../lib/thread/creators";
import { favourites, similarTaste, subsShort } from "../../../../lib/thread/reviewers";
import { reviewersData, profileOf } from "../../reviewers-data";
import { Avatar } from "../../live/creator-reviews";
import { ReviewerList, type ReviewerListRow } from "../../live/reviewer-list";
import "../reviewers.css";

export const revalidate = 21600;
export async function generateStaticParams() { return (await reviewersData()).list.map(r => ({ slug: r.slug })); }
type P = { params: Promise<{ slug: string }> };
const PLATFORM = { youtube: "YouTube", blog: "Blog", tiktok: "TikTok" } as const;
const ITEMS = niche.words.many;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params, rv = (await reviewersData()).list.find(r => r.slug === slug);
  if (!rv) return { title: "Creator not found", robots: { index: false } };
  const bio = profileOf(slug)?.bio;
  return { title: { absolute: `${rv.name}: ${rv.n} ${niche.words.one} reviews summed up | ${niche.site.name}` },
    description: bio ?? `Every ${niche.words.one} review by ${rv.name}, summed up: what they loved, what they did not, and how often they agree with other reviewers.`,
    alternates: { canonical: `/creators/${slug}` } };
}

export default async function ReviewerPage({ params }: P) {
  const { slug } = await params;
  const d = await reviewersData(), rv = d.list.find(r => r.slug === slug);
  if (!rv) notFound();
  const pf = profileOf(slug), subs = subsShort(pf?.subs);
  const channel = pf?.channel ?? rv.channel, links = [...(pf?.site && pf.site !== channel ? [{ label: "Website", url: pf.site }] : []), ...(pf?.links ?? [])];
  const loved = (s: string) => d.takes.get(s)?.pos ?? 0;
  const rows: ReviewerListRow[] = rv.reviews.map(r => { const p = d.product(r.productSlug)!;
    return { id: r.id, creator: rv.name, kind: r.kind, url: r.url, video: r.video, len: r.len, stance: r.stance, date: r.date, product: withoutYear(r.productName),
      href: p.href, shape: p.shape, line: r.line, tie: r.tie, disclosure: r.disclosure, loved: loved(r.productSlug), price: d.price(r.productSlug) }; });
  const favs = favourites(rv, d.takes), similar = similarTaste(rv, d.list);
  const total = rv.pos + rv.mix + rv.neg;
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: "Creators", path: "/creators" }, { name: rv.name, path: `/creators/${slug}` }])] };

  return <Shell active="creators">
    <JsonLd data={ld}/>
    <main className="th-main rvp">
      <nav className="rvp-crumbs" aria-label="Breadcrumb"><a href={th("/creators")}>Creators</a><span aria-hidden="true">›</span><span>{rv.name}</span></nav>
      <section className="rvp-head">
        <div className="rvp-who">
          <span className="rvp-av"><Avatar name={rv.name} kind={rv.kind}/></span>
          <div className="rvp-who-b">
            <span className="rvp-plat"><i className={rv.kind} aria-hidden="true"/>{[PLATFORM[rv.kind], subs ? `${subs} subscribers` : null].filter(Boolean).join(" · ")}<span className="rvp-lang">{langCode(rv.lang)}</span></span>
            <h1>{rv.name}</h1>
            {pf?.bio && <p className="rvp-bio">{pf.bio}</p>}
            {(pf?.topics.length ?? 0) > 0 && <span className="rvp-topics">{pf!.topics.map((t, i) => <span key={t} className={i === 0 ? "on" : undefined}>{t}</span>)}</span>}
            <span className="rvp-links"><a href={channel} target="_blank" rel="noopener nofollow">{`Visit ${rv.kind === "blog" ? "site" : "channel"} ↗`}</a>
              {links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noopener nofollow">{`${l.label} ↗`}</a>)}</span>
          </div>
        </div>
        <div className="rvp-on">
          <h2>{`On ${niche.site.name}`}</h2>
          <div className="rvp-stats"><span><b>{rv.n}</b>reviews summed up</span>{rv.since && <span><b>{rv.since}</b>reviewing since</span>}</div>
          <span className="rvp-takes-h"><strong>Their takes</strong><span>{`${total} reviews`}</span></span>
          <span className="rvp-bar" aria-hidden="true"><i className="p" style={{ flex: rv.pos }}/><i className="m" style={{ flex: rv.mix }}/><i className="n" style={{ flex: rv.neg }}/></span>
          <span className="rvp-cnt"><span><i className="p"/>{`${rv.pos} loved`}</span><span><i className="m"/>{`${rv.mix} mixed`}</span><span><i className="n"/>{`${rv.neg} not for them`}</span></span>
          {rv.agree != null && <p className="rvp-agree">Agrees with most other reviewers <b>{`${rv.agree}%`}</b> of the time.</p>}
        </div>
      </section>

      {favs.length > 0 && <section className="rvp-favs">
        <div className="rvp-sec-h"><h2>Their favourites</h2><span>{`The ${ITEMS} they loved, most reviewed first`}</span></div>
        <div className="rvp-fav-g">{favs.map((f, i) => { const p = d.product(f.productSlug)!, pr = d.price(f.productSlug);
          return <div key={f.id} className="rvp-fav">
            <a className="pic" href={th(p.href)} tabIndex={-1} aria-hidden="true">{p.pic ? <img src={p.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</a>
            <span className="b"><small>{`#${i + 1}`}</small><a className="nm" href={th(p.href)}>{withoutYear(f.productName)}</a><span className="ln">{f.line}</span>
              {pr && <a className="buy" href={pr.url} target="_blank" rel={pr.rel}>check price ↗</a>}</span>
          </div>; })}</div>
      </section>}

      <ReviewerList rows={rows}/>
      <p className="rvp-note">{`Summaries are written by ${niche.site.name} from the creator's own review. Watch or read the original for their exact words.`}</p>

      {similar.length > 0 && <section className="rvp-sim">
        <h2>Creators with a similar taste</h2>
        <div className="rvp-sim-g">{similar.map(s => <a key={s.reviewer.slug} className="rvp-sim-c" href={th(`/creators/${s.reviewer.slug}`)}>
          <Avatar name={s.reviewer.name} kind={s.reviewer.kind} size="sm"/>
          <span><strong>{s.reviewer.name}</strong><span>{`Same take on ${s.same} of ${s.shared} shared ${ITEMS}`}</span></span>
        </a>)}</div>
      </section>}
    </main>
  </Shell>;
}
