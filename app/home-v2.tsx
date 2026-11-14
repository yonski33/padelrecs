import "./home-v2.css";
import { catalog, score } from "../db/data";
import { displayName } from "../lib/brand-name";
import { activity } from "./components";
import { productSignals } from "./signals";
import { rankedLists, listHref } from "./rankings/lists";
import { listYear } from "../lib/top-lists";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { shopPhoto, photoHidden } from "../lib/shop-photos";
import { amazonPhoto } from "../lib/amazon-photos";
import { platformName } from "../lib/source-label";
import { matchingRackets } from "../lib/racket-search";
import { niche, catalogPath, productHref } from "../lib/niche";
import { quickTakeHooks } from "../db/quick-take";
import { qtFontVars } from "./qt-fonts";

/** The home page in design language v2 (owner 2026-11-15, after the Claude Design home reference in
 *  site-jobs/quick-take-mockups/claude-design-home-*). PadelRecs only for now; ?home=d shows the light home. */

const DAY = 86_400_000;
const LIST_SIZE = 8;
/** "try:" chips: only searches the catalog can answer (checked against the live catalog below; no price data exists). */
const TRY = ["metalbone", "at10", "vertex", "siux"];

function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
/** A quote cut at a word boundary, still the player's own words. */
const clip = (t: string, n = 140) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;

export default async function HomeV2({ shape }: { shape?: string }) {
  const [data, sigs, hooks, lists] = await Promise.all([catalog(), productSignals(), quickTakeHooks(), rankedLists()]);
  const now = Date.now();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const tabs = niche.shapeTabs ?? [];
  const tab = tabs.find(t => t.key === shape);
  const inTab = (r: { shape: string | null }, t = tab) => !t || t.shapes.includes(r.shape ?? "");
  const reportsOf = (id: string) => data.reviews.filter(x => x.racketId === id).length + data.external.filter(x => x.racketId === id).length;

  // Most talked about: most new reports in the last 6 months, inside the chosen shape.
  const talked = activity(data, now - 182 * DAY).filter(x => inTab(x.racket) && data.listed.some(l => l.id === x.racket.id)).slice(0, LIST_SIZE);
  const total = data.reviews.length + data.external.length;
  const thisWeek = [...data.reviews, ...data.external.map(e => ({ ...e, createdAt: e.createdAt }))].filter(x => Date.parse(x.createdAt) >= now - 7 * DAY).length;
  const tabCount = (t?: typeof tab) => data.listed.filter(r => inTab(r, t)).length;
  const tryChips = TRY.filter(q => matchingRackets(data.listed, q).length > 0);

  // Fresh off the court: the newest reports with a verdict, one per racket.
  const seen = new Set<string>();
  const fresh = [
    ...data.reviews.map(r => ({ kind: "own" as const, id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, source: `${niche.site.name} player` })),
    ...data.external.filter(e => e.sentiment).map(e => {
      // Our summary is a paraphrase (no quote marks); an English excerpt is the player's words (quote marks).
      const words = e.excerpt && !e.sourceLanguage ? e.excerpt : null;
      return { kind: "web" as const, id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary ?? words ?? "", quote: !e.summary && !!words,
        source: [platformName(e.sourcePlatform), e.sourcePlatform === "Reddit" ? e.sourceName : null].filter(Boolean).join(" · ") };
    }),
  ].filter(x => x.text).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 4);

  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);

  return <main className={`hv2 ${qtFontVars}`}>
    <div className="hv2-strip">a free, ad-light side project · built by padel players · <a href="/about">how we make these →</a></div>
    <div className="hv2-wrap">
      <section className="hv2-hero">
        <div>
          <p className="hv2-live"><i aria-hidden="true"/>{`${thisWeek.toLocaleString("en-US")} added this week · ${total.toLocaleString("en-US")} player reports`}</p>
          <h1>We read the web so you <span className="hl">{"don't have to."}</span></h1>
          <p className="hv2-sub">We dig through forums, YouTube tests, padel blogs and players&apos; own reviews, then give you the honest take. No sponsored picks.</p>
        </div>
        <div className="hv2-search">
          <form action={catalogPath} method="get"><input type="search" name="q" placeholder="search a racket or brand" aria-label="Search rackets"/><button type="submit">search</button></form>
          {tryChips.length > 0 && <p className="hv2-try"><span>try:</span>{tryChips.map(q => <a key={q} href={`${catalogPath}?q=${encodeURIComponent(q)}`}>{q}</a>)}</p>}
        </div>
      </section>

      <div className="hv2-grid">
        <section className="hv2-main" id="talked">
          <h2>Most talked about right now 🔥</h2>
          <div className="hv2-subrow"><p>Ranked by how many players posted about them in the last 6 months.</p><a href="/rankings">all rankings →</a></div>
          <nav className="hv2-tabs" aria-label="Filter by shape">
            <a href="/#talked" aria-current={!tab ? "page" : undefined}>all <span>{tabCount()}</span></a>
            {tabs.map(t => <a key={t.key} href={`/?shape=${t.key}#talked`} aria-current={tab?.key === t.key ? "page" : undefined}>{t.label.toLowerCase()} <span>{tabCount(t)}</span></a>)}
          </nav>
          <ol className="hv2-list">{talked.map(({ racket: r }, i) => {
            const s = score(data, r.id), sig = sigs.get(r.id), pic = photo(r), n = reportsOf(r.id);
            const line = hooks.get(r.id) ?? shortLine(r) ?? listLine(r);
            const judged = s.positive + s.mixed + s.negative;
            return <li key={r.id}><a className="hv2-row" href={productHref(r)}>
              <span className="hv2-rank">{i + 1}</span>
              <span className="hv2-pic">{pic ? <img src={pic} alt="" loading={i < 3 ? "eager" : "lazy"}/> : <span className="hv2-tile">{nameOf(r).split(" ").slice(0, 2).join(" ")}</span>}</span>
              <span className="hv2-body"><span className="hv2-name">{nameOf(r)}{r.shape && <span className="hv2-pill">{r.shape.toLowerCase()}</span>}</span>{line && <span className="hv2-line">{line}</span>}</span>
              <span className="hv2-stats">
                {sig && <span className="hv2-score" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in."><b>{sig.signal}</b>player score</span>}
                {judged > 0 && <span className="hv2-bar" role="img" aria-label={`${s.positive} positive, ${s.mixed} mixed, ${s.negative} negative`}><i className="p" style={{ flex: s.positive }}/><i className="m" style={{ flex: s.mixed }}/><i className="n" style={{ flex: s.negative }}/></span>}
                <span className="hv2-n">{`${n} player reports`}</span>
              </span>
            </a></li>;
          })}</ol>
          <a className="hv2-more" href={tab ? `${catalogPath}?shape=${tab.key}` : catalogPath}>{`show all ${tabCount(tab)} rackets`}</a>
        </section>

        <aside className="hv2-side">
          <section>
            <div className="hv2-sidehead"><h2>Fresh off the court</h2><a href="/reviews">see all →</a></div>
            <ul className="hv2-feed">{fresh.map(f => { const r = data.rackets.find(x => x.id === f.racketId)!; return <li key={f.id}>
              <p className="hv2-src"><span>{f.source}</span>{ago(f.date, now)}</p>
              <a href={productHref(r)}>{nameOf(r)}</a>
              <p>{f.quote ? `“${clip(f.text)}”` : clip(f.text)}</p>
            </li>; })}</ul>
          </section>
          {best.length > 0 && <section>
            <h2>Best-of lists</h2>
            <ul className="hv2-best">{best.map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>{`${l.list.label.replace(/\{year\}/, String(listYear(l.list)))}`}<span aria-hidden="true">→</span></a></li>)}</ul>
          </section>}
          <section className="hv2-own">
            <h2>Own a racket? Tell us about it.</h2>
            <p>One tap per racket, no account. Every take sharpens the rankings.</p>
            <a href="/rate">{"Rate what you've played"}</a>
          </section>
        </aside>
      </div>

      <section className="hv2-how" id="how-this-works">
        <p className="hv2-how-k">{"// how this works"}</p>
        <div>
          <div><h3>1. We read everything</h3><p>Forums, YouTube tests, padel blogs and the reviews players post here, every one linked back to its source.</p></div>
          <div><h3>2. We count the verdicts</h3><p>Each report is sorted as positive, mixed or negative, and by what it talks about. Every claim needs at least 3 players.</p></div>
          <div><h3>3. We write one honest line</h3><p>{"Then we give our take, and say where the data is thin. We don't test rackets and no brand pays for placement."}</p></div>
        </div>
      </section>
      <p className="hv2-made">made by people who own too many rackets 🎾</p>
    </div>
  </main>;
}
