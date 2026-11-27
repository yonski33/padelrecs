// The creators home (owner handoff "PickleballRecs Home Thread v6", 2026-11-22), served at "/" on the CREATOR_PAGE sites
// (lib/thread/sites.ts). Sections, as the mock: hero + quick match + fine-tune, Top paddles right now (live/creators-home.tsx),
// Top picks, 2027 paddles just in (only when real 2027 paddles are listed), Latest YouTube review summaries, Latest questions
// from the community; sidebar: Latest from the comments, Rankings, New from around the web.
// Owner 2026-11-22, after the first live day: the list and Top picks rank by the site's own players again (padelListData and
// threadTopPicks, the same rows, votes and curated order as the catalogue and the rankings, PR #600). Creator reviews are few
// and almost all positive, so they never set the order or the loved/mixed bar; they add a praise line ("Praised for spin in
// 13 reviews"), a price and the YouTube summaries. Reusable: lib/thread/creator-home.ts rowExtras and lib/thread/site-sentiment.ts
// take the site's own words (SkinRecs: "people").
import { Shell } from "./shell";
import { threadRows, threadFeed, threadHomeSide, threadTopPicks } from "./data";
import { threadRankings } from "./rankings-data";
import { padelListData } from "./padel-list-data";
import { LatestQuestions } from "./latest-questions";
import { th } from "../../lib/thread/look";
import { niche, catalogPath } from "../../lib/niche";
import { commenterName } from "../../lib/thread/display-name";
import { dayLabel } from "../../lib/thread/web-sources";
import { justIn } from "../../lib/thread/just-in";
import { withoutYear } from "../../lib/brand-name";
import { oneShape } from "../../lib/thread/shape";
import { ago } from "./ui";
import { Ago } from "./live/ago";
import { STANCE_LABEL } from "../../lib/thread/creators";
import { rowLinks } from "./row-links";
import { opinionsLabel } from "../../lib/thread/site-sentiment";
import { SHOWN } from "../../lib/thread/top-picks";
import { W } from "../../lib/thread/words";
import { creatorHome } from "../../lib/thread/creator-data";
import { creatorPageFor, creatorPageOn, CREATOR_VIEW, justInSite } from "../../lib/thread/sites";
import { CreatorsHomeTop, type HomeExtra } from "./live/creators-home";
import { storiesSite } from "../../lib/thread/sites";
import { threadStories } from "./stories-data";
import { MemberMark } from "./live/member-mark";
import "./creators-home.css";


const ICON = {
  target: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="8.5"/><circle cx="10" cy="10" r="5"/><circle cx="10" cy="10" r="1.6"/></svg>,
  arm: <svg width="21" height="19" viewBox="0 0 22 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 18h18c0-4-3-6-7-6l-3-6c-1-2-3-3-5-2l2 5-3 2v7"/></svg>,
  ctrl: <svg width="21" height="17" viewBox="0 0 22 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M1 3h20M1 9h20M1 15h20"/><circle cx="7" cy="3" r="2" fill="#fff"/><circle cx="15" cy="9" r="2" fill="#fff"/><circle cx="9" cy="15" r="2" fill="#fff"/></svg>,
  bolt: <svg width="15" height="19" viewBox="0 0 12 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d="M7 1L1.5 8.5H6L5 14l5.5-7.5H6z"/></svg>,
  spin: <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8.5"/><path d="M5 7c3 2 7 2 10 0M5 13c3-2 7-2 10 0"/></svg>,
  shield: <svg width="17" height="19" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M9 1l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V4z"/><path d="M6 10l2 2 4-4"/></svg>,
} as const;
/** Each vote board's icon (lib/thread/top-picks.ts keys). */
const BOARD_ICON: Record<string, keyof typeof ICON> = { sweet: "target", arm: "arm", control: "ctrl", power: "bolt", spin: "spin", beginner: "target", pop: "bolt", soft: "shield",
  // LaptopRecs' boards (lib/thread/top-picks.ts LAPTOP_CATS).
  battery: "bolt", fast: "bolt", screen: "target", keyboard: "ctrl",
  // PadelRecs' boards (lib/thread/top-picks.ts PADEL_CATS).
  net: "ctrl", intermediate: "target", defence: "shield", trampoline: "spin",
  // SkinRecs' boards (lib/thread/top-picks.ts SKIN_CATS).
  gentle: "shield", dry: "target", oily: "target", rich: "ctrl", light: "ctrl", dewy: "spin", matte: "spin", makeup: "target", value: "bolt",
  // CoffeeRecs' boards (lib/thread/top-picks.ts COFFEE_CATS).
  taste: "target", easy: "shield", consistent: "spin", build: "ctrl", quiet: "shield" };
const PILL_BG = { pos: "oklch(0.93 0.08 145)", mix: "oklch(0.95 0.08 95)", neg: "oklch(0.93 0.05 35)" } as const;
const TYPE_BG: Record<string, string> = { Widebody: "oklch(0.94 0.06 125)", Standard: "oklch(0.94 0.04 250)", Elongated: "oklch(0.93 0.05 35)", Hybrid: "oklch(0.94 0.04 250)",
  // PadelRecs' shapes.
  Round: "oklch(0.94 0.06 125)", Teardrop: "oklch(0.94 0.04 250)", Diamond: "oklch(0.93 0.05 35)" };

/** The creators home (the owner's Home Thread v6 handoff). */
export async function CreatorsHomeBody() {
  const home = await creatorHome(niche.id);
  const [{ all, rows: byId, ctx }, d, side, lists, feed, picks, tales] = await Promise.all([threadRows(), padelListData(), threadHomeSide(), threadRankings(), threadFeed(), threadTopPicks(),
    storiesSite(niche.id) ? threadStories(3) : []]);
  const bySlug = new Map(all.map(r => [r.slug, r]));
  // With CREATOR_PAGE on, the normal address is the creator page; the ?view= preview link only while it is off.
  const hrefOf = (slug: string, href: string) => !creatorPageOn(niche.id) && creatorPageFor(niche.id, slug) ? `${href}?view=${CREATOR_VIEW}` : href;
  // Ranked by the site's own players (owner 2026-11-22, after #649 went live): the same rows, votes, curated order and filters
  // as the catalogue list (padelListData, PR #600). Creator reviews add a praise line and a price, never the order or counts.
  const rows = d.rows, curated = d.curated, brands = d.brands;
  // Each row's links (app/thread/row-links.ts, shared with the ranking lists): praise pill, See reviews, the current price.
  const extra: Record<string, HomeExtra> = await rowLinks(rows, { pills: d.pills ?? {}, hrefOf });
  const now = Date.now();
  const total = home ? `${home.total.toLocaleString("en-US")} reviews ${niche.id === "pickleball" || niche.id === "skin" ? "summarized" : "summarised"}` : "";
  const name = (slug: string) => { const r = bySlug.get(slug); return r ? withoutYear(r.name) : slug; };

  // Top picks: the site's vote boards (threadTopPicks, the same lists the other homes show), six at most.
  const bd = picks.lists.slice(0, SHOWN);
  // 2027 paddles just in: real 2027 models only (the catalogue's just-in rule); hidden otherwise.
  const listed = new Map((ctx?.data.listed ?? []).map(x => [x.id, x]));
  const added = Object.fromEntries(all.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  const ji = ctx && justInSite(niche.id) ? justIn(all.filter(r => listed.has(r.id)), added) : null, fresh = ji && ji.year === 2027 ? ji.rows : [];
  // The sidebar, from the site's own data: newest comments, the rankings, Reddit summaries.
  const said = side.filter(x => x.kind === "comment").slice(0, 3);
  // PickleballRecs has 8 lists (Grok audit 2026-11-24: Best hybrid was cut off the home list while Best elongated showed).
  const rankLinks = lists.slice(0, niche.id === "pickleball" ? 8 : 7).map(l => ({ label: l.label, href: l.href }));
  // LaptopRecs: older generations never list (lib/thread/laptop-lines.ts), here or in the YouTube summaries below.
  const LT = niche.id === "laptop";
  const web = feed.filter(f => f.kind === "reddit" && byId.has(f.racketId) && (!LT || byId.get(f.racketId)!.current)).slice(0, 2);
  // Listed paddles only, four (Grok audit 2026-11-24: two linked unlisted pages without a photo); LaptopRecs: current only.
  const latest = (home?.latest ?? []).filter(c => bySlug.has(c.slug) && (!LT || bySlug.get(c.slug)?.current)).slice(0, 4);
  const cut = (t: string, n: number) => t.length > n ? `${t.slice(0, t.lastIndexOf(" ", n - 3))}...` : t;

  return <Shell>
    <main className="tch">
      <CreatorsHomeTop rows={rows} extra={extra} curated={curated} added={d.added} total={total} brands={brands} {...(d.laptop ? { laptop: d.laptop } : {})} {...(d.skin ? { skin: d.skin } : {})} {...(d.coffee ? { coffee: d.coffee } : {})}
        after={<>
          {bd.length > 0 && <section key="tp" className="tch-card tch-sec">
            <div className="tch-sec-h"><h2><svg width="28" height="26" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/><g fill="currentColor" stroke="none"><circle cx="10" cy="12.5" r="1.5"/><circle cx="15" cy="12.5" r="1.5"/><circle cx="20" cy="12.5" r="1.5"/></g></svg>{`Top picks by ${W.people}`}
              <svg width="17" height="20" viewBox="0 0 20 22" fill="none" stroke="oklch(0.92 0.17 105)" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true"><path d="M4 9L10 3M6 14L16 10M7 19L17 19"/></svg></h2>
              <span>{`From ${opinionsLabel(picks.total, W.person)} and votes`}</span></div>
            <div className="tch-boards">{bd.map(b => <div key={b.cat.key} className="tch-board">
              <span className="tch-board-h">{ICON[BOARD_ICON[b.cat.key] ?? "shield"]}<b>{b.cat.title}</b><a href={th(b.cat.href)}>See all</a></span>
              {b.rows.map((o, j) => { const r = byId.get(o.id);
                return <a key={o.id} className={j === 0 ? "first" : undefined} href={th(r ? hrefOf(r.slug, r.href) : catalogPath)}
                  title={`${o.n} ${o.n === 1 ? W.person : W.people} picked it`}><span>{`${j + 1}.`}</span><span>{withoutYear(o.name)}</span><span>{o.n}</span></a>; })}
            </div>)}</div>
          </section>}

          {fresh.length > 0 && <section key="ji" className="tch-card tch-sec">
            <div className="tch-sec-h"><h2><span className="tch-new">NEW</span>{`2027 ${niche.words.many} just in`}</h2><a className="tch-all" href={th(catalogPath)}>{`All new ${niche.words.many} →`}</a></div>
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

          {home && latest.length > 0 && <section key="yt" id="reviews" className="tch-card tch-sec tch-yt">
            <div className="tch-sec-h"><h2><svg width="28" height="26" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/><g fill="currentColor" stroke="none"><circle cx="10" cy="12.5" r="1.5"/><circle cx="15" cy="12.5" r="1.5"/><circle cx="20" cy="12.5" r="1.5"/></g></svg>Latest YouTube review summaries</h2></div>
            {latest.map(c => { const r = bySlug.get(c.slug), href = r ? hrefOf(c.slug, r.href) : catalogPath;
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
          {/* PadelRecs' member stories (the pilot): the latest 3, under Rankings as on its earlier home. */}
          {tales.length > 0 && <section key="st" className="tch-card tch-sbox">
            <h3>Stories</h3>
            {tales.map(t => <a key={t.id} href={th(`/stories/${t.slug}`)}><span className="tch-sm"><strong>{t.author.name}</strong><MemberMark/></span><b>{t.title}</b></a>)}
            <a className="tch-all" href={th("/stories")}>All stories →</a>
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
