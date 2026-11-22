// The creators home preview (owner handoff "PickleballRecs Home Thread v6", 2026-11-22: "do this with the exact mockup").
// proxy.ts serves it for "/?view=creators" on the CREATOR_PAGE_SITES (lib/thread/sites.ts); the live home is unchanged.
// Sections, as the mock: hero + quick match + fine-tune, Top paddles right now (live/creators-home.tsx), Top picks by
// creators, 2027 paddles just in (only when real 2027 paddles are listed), Latest YouTube review summaries, Latest questions
// from the community; sidebar: Latest from the comments, Rankings, New from around the web.
// Real data: the 20 staged paddles' review takes and words (db/creators/<site>-home.json), their photos, lines and filters
// (the catalogue rows), the real match engine, prices from the price sweep (quiet "check price" links only), and the site's
// own comments, questions, rankings and Reddit summaries. No score badge (owner rule; the README's badge waits on the owner).
import type { Metadata } from "next";
import { Shell } from "../shell";
import { homeMetadata } from "../../home-metadata";
import { liveOr } from "../seo";
import { DEFAULT_CHOICE } from "../../../lib/quick-match";
import { threadRows, threadFeed, threadHomeSide } from "../data";
import { threadRankings } from "../rankings-data";
import { padelListData } from "../padel-list-data";
import { LatestQuestions } from "../latest-questions";
import { th } from "../../../lib/thread/look";
import { niche, catalogPath } from "../../../lib/niche";
import { commenterName } from "../../../lib/thread/display-name";
import { dayLabel } from "../../../lib/thread/web-sources";
import { justIn } from "../../../lib/thread/just-in";
import { withoutYear } from "../../../lib/brand-name";
import { oneShape } from "../../../lib/thread/shape";
import { ago } from "../ui";
import { Ago } from "../live/ago";
import { STANCE_LABEL } from "../../../lib/thread/creators";
import { boards, praiseLine, usd } from "../../../lib/thread/creator-home";
import { creatorHome } from "../../../lib/thread/creator-data";
import { creatorPageFor, CREATOR_VIEW } from "../../../lib/thread/sites";
import { CreatorsHomeTop, type HomeExtra } from "../live/creators-home";
import "../creators-home.css";

export const revalidate = 21600;
// The live home's title, description, canonical ("/") and share card.
export const generateMetadata = (): Promise<Metadata> => liveOr(() => homeMetadata(DEFAULT_CHOICE, false));

const ICON = {
  target: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="8.5"/><circle cx="10" cy="10" r="5"/><circle cx="10" cy="10" r="1.6"/></svg>,
  arm: <svg width="21" height="19" viewBox="0 0 22 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 18h18c0-4-3-6-7-6l-3-6c-1-2-3-3-5-2l2 5-3 2v7"/></svg>,
  ctrl: <svg width="21" height="17" viewBox="0 0 22 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M1 3h20M1 9h20M1 15h20"/><circle cx="7" cy="3" r="2" fill="#fff"/><circle cx="15" cy="9" r="2" fill="#fff"/><circle cx="9" cy="15" r="2" fill="#fff"/></svg>,
  bolt: <svg width="15" height="19" viewBox="0 0 12 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d="M7 1L1.5 8.5H6L5 14l5.5-7.5H6z"/></svg>,
  spin: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8.5"/><path d="M5 7c3 2 7 2 10 0M5 13c3-2 7-2 10 0"/></svg>,
  shield: <svg width="17" height="19" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M9 1l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V4z"/><path d="M6 10l2 2 4-4"/></svg>,
} as const;
const PILL_BG = { pos: "oklch(0.93 0.08 145)", mix: "oklch(0.95 0.08 95)", neg: "oklch(0.93 0.05 35)" } as const;
const TYPE_BG: Record<string, string> = { Widebody: "oklch(0.94 0.06 125)", Standard: "oklch(0.94 0.04 250)", Elongated: "oklch(0.93 0.05 35)", Hybrid: "oklch(0.94 0.04 250)" };

export default async function CreatorsHome() {
  const home = creatorHome(niche.id);
  const [{ all, rows: byId, ctx }, d, side, lists, feed] = await Promise.all([threadRows(), padelListData(), threadHomeSide(), threadRankings(), threadFeed()]);
  const bySlug = new Map(all.map(r => [r.slug, r]));
  const hrefOf = (slug: string, href: string) => creatorPageFor(niche.id, slug) ? `${href}?view=${CREATOR_VIEW}` : href;
  // The 20 staged paddles, with their reviews' takes in place of the vote counts.
  const rows = home ? Object.entries(home.paddles).flatMap(([slug, p]) => { const r = bySlug.get(slug);
    return r ? [{ ...r, pos: p.pos, mix: p.mix, neg: p.neg, n: p.reviews, current: true }] : []; }) : [];
  const extra: Record<string, HomeExtra> = Object.fromEntries(rows.map(r => { const p = home!.paddles[r.slug]!;
    return [r.id, { pill: praiseLine(p), href: hrefOf(r.slug, r.href), reviews: p.reviews,
      price: p.price ? { label: `from ${usd(p.price.usd)} · check price ↗`, url: p.price.url, rel: p.price.affiliate ? "sponsored nofollow noopener" : "nofollow noopener" } : null }]; }));
  const ids = new Set(rows.map(r => r.id)), curated = d.curated.filter(id => ids.has(id));
  const count = new Map<string, number>(); for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([b]) => b);
  const now = Date.now();
  const total = home ? `${home.total.toLocaleString("en-US")} reviews summarised` : "";
  const name = (slug: string) => { const r = bySlug.get(slug); return r ? withoutYear(r.name) : slug; };

  // Top picks by creators: the six boards from the reviews' words.
  const bd = home ? boards(home.paddles) : [];
  // 2027 paddles just in: real 2027 models only (the catalogue's just-in rule); hidden otherwise.
  const listed = new Map((ctx?.data.listed ?? []).map(x => [x.id, x]));
  const added = Object.fromEntries(all.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  const ji = ctx ? justIn(all.filter(r => listed.has(r.id)), added) : null, fresh = ji && ji.year === 2027 ? ji.rows : [];
  // The sidebar, from the site's own data: newest comments, the rankings, Reddit summaries.
  const said = side.filter(x => x.kind === "comment").slice(0, 3);
  const rankLinks = lists.slice(0, 7).map(l => ({ label: l.label, href: l.href }));
  const web = feed.filter(f => f.kind === "reddit" && byId.has(f.racketId)).slice(0, 2);
  const cut = (t: string, n: number) => t.length > n ? `${t.slice(0, t.lastIndexOf(" ", n - 3))}...` : t;

  return <Shell>
    <main className="tch">
      <CreatorsHomeTop rows={rows} extra={extra} curated={curated} added={d.added} total={total} brands={brands}
        after={<>
          {bd.length > 0 && <section key="tp" className="tch-card tch-sec">
            <div className="tch-sec-h"><h2><svg width="28" height="26" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/><g fill="currentColor" stroke="none"><circle cx="10" cy="12.5" r="1.5"/><circle cx="15" cy="12.5" r="1.5"/><circle cx="20" cy="12.5" r="1.5"/></g></svg>Top picks by creators
              <svg width="17" height="20" viewBox="0 0 20 22" fill="none" stroke="oklch(0.92 0.17 105)" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true"><path d="M4 9L10 3M6 14L16 10M7 19L17 19"/></svg></h2>
              <span>{`From ${home!.total.toLocaleString("en-US")} creator reviews`}</span></div>
            <div className="tch-boards">{bd.map(b => <div key={b.key} className="tch-board">
              <span className="tch-board-h">{ICON[b.icon]}<b>{b.title}</b><a href={th("/rankings")}>See all</a></span>
              {b.rows.map((o, j) => { const r = bySlug.get(o.slug);
                return <a key={o.slug} className={j === 0 ? "first" : undefined} href={th(r ? hrefOf(o.slug, r.href) : catalogPath)}
                  title={`${o.n} of ${o.reviews} reviews call it Excellent or Great`}><span>{`${j + 1}.`}</span><span>{name(o.slug)}</span><span>{o.n}</span></a>; })}
            </div>)}</div>
          </section>}

          {fresh.length > 0 && <section key="ji" className="tch-card tch-sec">
            <div className="tch-sec-h"><h2><span className="tch-new">NEW</span>2027 paddles just in</h2><a className="tch-all" href={th(catalogPath)}>All new paddles →</a></div>
            <div className="tch-new-g">{fresh.map(r => { const t = r.pos + r.mix + r.neg, at = added[r.id], shape = oneShape(r.shape);
              return <a key={r.id} className="tch-new-c" href={th(r.href)}>
                <span className="tch-new-ph">{at && <span className="tch-when"><Ago at={at} initial={ago(at, now)}/></span>}{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="tch-noimg"/>}</span>
                <strong>{withoutYear(r.name)}</strong>
                <span className="tch-new-chips">{shape && <span style={{ background: TYPE_BG[shape] ?? "#fff" }}>{shape}</span>}{r.feel && <span>{`${r.feel} feel`}</span>}</span>
                {t > 0 && <span className="tch-new-s"><span className="tch-bar" aria-hidden="true"><i className="p" style={{ flex: r.pos }}/><i className="m" style={{ flex: r.mix }}/><i className="n" style={{ flex: r.neg }}/></span>
                  <span>{`${r.pos} loved · ${r.mix} mixed · ${r.neg} not for me`}</span></span>}
                <span className="tch-new-f"><span>See reviews ›</span></span>
              </a>; })}</div>
          </section>}

          {home && home.latest.length > 0 && <section key="yt" id="reviews" className="tch-card tch-sec tch-yt">
            <div className="tch-sec-h"><h2><svg width="28" height="26" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/><g fill="currentColor" stroke="none"><circle cx="10" cy="12.5" r="1.5"/><circle cx="15" cy="12.5" r="1.5"/><circle cx="20" cy="12.5" r="1.5"/></g></svg>Latest YouTube review summaries</h2></div>
            {home.latest.map(c => { const r = bySlug.get(c.slug), href = r ? hrefOf(c.slug, r.href) : catalogPath;
              return <article key={`${c.slug}:${c.creator}`}>
                <a className="tch-yt-p" href={th(href)}><span>{r?.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="tch-noimg"/>}</span><b>{name(c.slug)}</b></a>
                <span className="tch-yt-m"><strong>{c.creator}</strong><span className="tch-take" style={{ background: PILL_BG[c.stance] }}>{STANCE_LABEL[c.stance]}</span>
                  <a className="tch-ytag" href={c.url} target="_blank" rel="noopener nofollow">▶ YouTube</a><span>{`· ${dayLabel(c.date)}`}</span></span>
                <p>{c.text}</p>
              </article>; })}
            <a className="tch-all c" href={th(catalogPath)}>See all summaries →</a>
          </section>}

          <LatestQuestions key="lq"/>
        </>}
        side={<aside className="tch-side">
          {said.length > 0 && <section key="cm" className="tch-card tch-sbox">
            <h3>Latest from the comments<svg width="15" height="17" viewBox="0 0 20 22" fill="none" stroke="oklch(0.92 0.17 105)" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true"><path d="M4 9L10 3M6 14L16 10M7 19L17 19"/></svg></h3>
            {said.map(c => { const r = byId.get(c.racketId)!;
              return <a key={c.id} href={th(`${r.href}#comments`)}><span className="tch-sm"><strong>{commenterName(c.alias)}</strong>{" · "}<Ago at={c.at} initial={ago(c.at, now)}/></span>
                <b>{withoutYear(r.name)}</b><span>{cut(c.body, 110)}</span></a>; })}
          </section>}
          {rankLinks.length > 0 && <section key="rk" className="tch-rank-box">
            <div>Rankings</div>
            <nav>{rankLinks.map(k => <a key={k.href} href={th(k.href)}><span>{k.label}</span><span aria-hidden="true">→</span></a>)}</nav>
          </section>}
          {web.length > 0 && <section key="wb" className="tch-card tch-sbox">
            <h3>New from around the web</h3>
            {web.map(w => { const r = byId.get(w.racketId)!;
              return <a key={w.id} href={th(`${r.href}#reviews`)}><span className="tch-sm"><span className="tch-reddit">Reddit</span>{w.who}</span>
                <b>{withoutYear(r.name)}</b><span>{cut(w.text, 110)}</span></a>; })}
          </section>}
        </aside>}/>
    </main>
  </Shell>;
}
