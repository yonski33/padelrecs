import "./home-v2.css";
import { matchContext } from "./match-context";
import { displayName } from "../lib/brand-name";
import { rankedLists, listHref } from "./rankings/lists";
import { listYear } from "../lib/top-lists";
import { platformName } from "../lib/source-label";
import type { QuickChoice } from "../lib/quick-match";
import { niche, productHref, v2copy } from "../lib/niche";
import { newThisWeek } from "../lib/new-this-week";

import { qtFontVars } from "./qt-fonts";
import { homePayload } from "./home-payload";
import { HomeMatch } from "./home-match";
import { V2Footer } from "./v2-footer";
import { GuideRow } from "./guide/guide-row";

/** The PadelRecs home in design language v2, built around Quick match (owner 2026-11-15: "the home page IS the quiz — you
 *  see the rackets according to what you need, not what we set"). Choices live in the URL (?style=&level=&arm=1); the server
 *  renders each combination's list (a shareable, indexable page) and a tap re-ranks in the browser (app/home-match.tsx,
 *  lib/home-rank.ts). ?home=d: the light home. */

const DAY = 86_400_000;

function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
/** A quote cut at a word boundary, still the player's own words. */
const clip = (t: string, n = 140) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;

export default async function HomeV2({ choice, older = false }: { choice: QuickChoice; older?: boolean }) {
  const [{ data }, payload, lists] = await Promise.all([matchContext(), homePayload(), rankedLists()]);
  const now = Date.now();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const added = newThisWeek(data, now);

  // Fresh off the court: the newest reports with a verdict, one per racket.
  const seen = new Set<string>();
  const fresh = [
    ...data.reviews.map(r => ({ id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, tag: niche.site.name.toLowerCase() })),
    // Our own reviews and YouTube summaries only (owner 2026-11-15).
    ...data.external.filter(e => e.sentiment && e.sourcePlatform === "YouTube").map(e => {
      // Our summary is a paraphrase (no quote marks); an English excerpt is the player's words (quote marks).
      const words = e.excerpt && !e.sourceLanguage ? e.excerpt : null;
      return { id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary ?? words ?? "", quote: !e.summary && !!words,
        tag: platformName(e.sourcePlatform).toLowerCase() };
    }),
  ].filter(x => x.text).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 3);
  const live = <p className="hv2-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${added.toLocaleString("en-US")} new this week`}</p>;
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);

  return <main className={`hv2 ${qtFontVars}`}>
    {/* The mockup's own footer (owner 2026-11-15: "match it 100%"); home-v2.css hides the site's on this page. The header is the site's (site-header.tsx). */}

    <div className="hv2-wrap">
      <section className="hv2-hero">
        <div><h1>Less guessing. <span className="hl">{`Better ${niche.words.many}.`}</span></h1>
          {v2copy.pillInline ? <div className="hv2-subrow"><p className="hv2-sub">{`${v2copy.tellUs ?? "Tell us how you play"}. We'll handle the gear homework.`}</p>{live}</div>
            : <p className="hv2-sub">{`${v2copy.tellUs ?? "Tell us how you play"}. We'll handle the gear homework.`}</p>}</div>
        {!v2copy.pillInline && live}
      </section>

      {/* The picks and the list re-rank in the browser on a tap (app/home-match.tsx); this render is the address's own list. */}
      <HomeMatch payload={payload} choice={choice} older={older} listed={data.listed.length}>
        <aside className="hv2-side">
          <section>
            <div className="hv2-sidehead"><h3>{`Fresh off the ${v2copy.venue ?? "court"}`}</h3><a href="/reviews">all →</a></div>
            <ul className="hv2-feed">{fresh.map(f => { const r = byId.get(f.racketId)!; return <li key={f.id}><a href={productHref(r)}>
              <span className="hv2-src"><span className={`t ${f.tag}`}>{f.tag}</span>{ago(f.date, now)}</span>
              <b>{nameOf(r)}</b>
              <span className="hv2-q">{f.quote ? `“${clip(f.text)}”` : clip(f.text)}</span>
            </a></li>; })}</ul>
          </section>
          {best.length > 0 && <section>
            <h3>Best-of lists</h3>
            <ul className="hv2-best">{best.filter(l => l.list.modelYearsBack === undefined).map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>{
              // This season's overall list reads "best of <this year>" (owner 2026-11-15); last season's list stays on /rankings.
              l.list.maxAgeYears === 0 && !l.list.trait ? `best of ${listYear(l.list)}` : l.list.label.replace(/\{year\}/, String(listYear(l.list))).toLowerCase()}</a></li>)}</ul>
          </section>}
          <section className="hv2-own">
            <p className="t">Own a {niche.words.one}? Add your verdict.</p>
            <p>Two minutes, no account.</p>
            <a href="/add-review">+ add a review</a>
          </section>
        </aside>
      </HomeMatch>
      {/* Below the list: the Shape row and a link to the racket guide, nothing else (owner 2026-11-16). */}
      <GuideRow/>
    </div>

    <V2Footer/>
  </main>;
}
