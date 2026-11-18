import "./home-v2.css";
import { catalogShownCount } from "./rackets/catalog-count";
import "./home-v2-m.css";
import "./home-v2-more.css";
import { matchContext } from "./match-context";
import { displayName, withoutYear } from "../lib/brand-name";
import { rankedLists, listHref } from "./rankings/lists";
import { listYear } from "../lib/top-lists";
import { platformName } from "../lib/source-label";
import type { QuickChoice } from "../lib/quick-match";
import { niche, productHref, v2copy } from "../lib/niche";
import { fitConfigFor } from "../lib/fit-config";
// A site's own words (SimRacingRecs: "driver reviews", "added to the site this week"); unset elsewhere.
const WORDS = fitConfigFor(niche)?.words;
import { newThisWeek, WEEK_SHORT, WEEK_LONG } from "../lib/new-this-week";

import { qtFontVars } from "./qt-fonts";
import { homePayload, homeSeed } from "./home-payload";
import { HomeMatch } from "./home-match";
import { V2Footer } from "./v2-footer";
import { GuideRow } from "./guide/guide-row";
import { rankHome } from "../lib/home-rank";

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
    // Who wrote it (Grok pickleball audits 2026-11-17 #35 and 2026-11-18): our own reviews carry no source tag, only the
    // writer's name; a YouTube summary keeps its "youtube" tag.
    ...data.reviews.map(r => ({ id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, tag: null as string | null, who: r.alias || null })),
    // Our own reviews and YouTube summaries only (owner 2026-11-15).
    ...data.external.filter(e => e.sentiment && e.sourcePlatform === "YouTube").map(e => {
      // Our summary is a paraphrase (no quote marks); an English excerpt is the player's words (quote marks).
      const words = e.excerpt && !e.sourceLanguage ? e.excerpt : null;
      return { id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary ?? words ?? "", quote: !e.summary && !!words,
        tag: platformName(e.sourcePlatform).toLowerCase(), who: e.sourceName || null };
    }),
  ].filter(x => x.text).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 3);
  const live = <p className="hv2-live" title={`${added.toLocaleString("en-US")} ${WEEK_LONG}`}><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${added.toLocaleString("en-US")} ${WEEK_SHORT}`}</p>;
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);

  // A site's own home mock (niche.v2home; PickleballRecs): the rankings tiles, the "how we score" strip and Questions follow the
  // guide row. A Questions answer's {top:beginner} / {top:arm} names the two first paddles of that live list.
  const M = niche.v2home;
  // The same sections on a site that keeps its own look (niche.homeMore: padel, disc golf).
  const more = M ?? niche.homeMore;
  // The heading names the sport and stands alone (owner 2026-11-18: no "we'll handle…" service line under it).
  const H1 = niche.v2copy?.homeH1 ?? M?.h1;
  const heroSub = niche.v2copy?.homeH1 ? null : M?.h1 ? M.sub : `${v2copy.tellUs ?? "Tell us how you play"}. We'll handle the gear homework.`;
  const SETUP = { ...niche.finder!, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
  const BAD = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  const topTwo = (pick: "beginner" | "arm") => {
    const rows = rankHome(payload.items, SETUP, BAD, pick === "arm" ? { style: "any", arm: true } : { style: "any", level: "beginner", arm: false }, false, 2).rows;
    const names = rows.map(r => payload.cards[r.id]?.name).filter((n): n is string => !!n).map(withoutYear);
    return names.length === 2 ? `the ${names[0]} and the ${names[1]}` : names[0] ? `the ${names[0]}` : `the ${niche.words.many} at the top of that list`;
  };
  const channels = new Set(data.external.filter(e => e.sourcePlatform === "YouTube" && e.sourceName).map(e => e.sourceName!.toLowerCase())).size;
  const tileFills = M ? ["var(--acc)", "#e9edf6", "oklch(0.9 0.06 235)"] : ["var(--acc)", "var(--paper)", "var(--marker)"];

  return <main className={`hv2${M ? " hv2-m" : more ? ` hv2-x${niche.productPath === "discs" ? " hv2-disc" : ""}` : ""} ${qtFontVars}`}>
    {/* The mockup's own footer (owner 2026-11-15: "match it 100%"); home-v2.css hides the site's on this page. The header is the site's (site-header.tsx). */}

    <div className="hv2-wrap">
      <section className="hv2-hero">
        {/* The "N reviews · N new this week" pill on the headline's line, to its right, on every site (owner 2026-11-18); the
            subtitle, where a site still has one, under them. */}
        <div><div className="hv2-hrow"><h1>{`${H1?.[0] ?? "Less guessing."} `}<span className="hl">{H1?.[1] ?? `Better ${v2copy.better ?? niche.words.many}.`}</span></h1>{live}</div>
          {heroSub && <div className="hv2-subrow"><p className="hv2-sub">{heroSub}</p></div>}</div>
      </section>

      {/* The picks and the list re-rank in the browser on a tap (app/home-match.tsx); this render is the address's own list. */}
      <HomeMatch seed={homeSeed(payload, choice, older)} listed={catalogShownCount(data)}>
        <aside className="hv2-side">
          <section>
            <div className="hv2-sidehead"><h3>{`Fresh off the ${v2copy.venue ?? "court"}`}</h3><a href="/reviews">all →</a></div>
            <ul className="hv2-feed">{fresh.map(f => { const r = byId.get(f.racketId)!; return <li key={f.id}><a href={productHref(r)}>
              <span className="hv2-src">{f.tag && <span className={`t ${f.tag}`}>{f.tag}</span>}{f.who && <span className="hv2-who">{f.who}</span>}{ago(f.date, now)}</span>
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
      {more && <>
        <section className="hv2-rt" aria-labelledby="hv2-rt-t">
          <div className="hv2-rthead"><h2 id="hv2-rt-t">Explore the rankings</h2><a href="/rankings">all rankings →</a></div>
          <div className={`hv2-rtgrid${!M && best.length % 3 && best.length % 2 === 0 ? " two" : ""}`}>{best.map((l, k) => {
            const title = l.list.maxAgeYears === 0 && !l.list.trait ? `Best of ${listYear(l.list)}` : l.list.label.replace(/\{year\}/, String(listYear(l.list)));
            return <a key={l.list.slug} href={listHref(l.list.slug)}><span className="t"><b>{title}<span aria-hidden="true"> →</span></b><em>{`${l.entries.length} ${niche.words.many}`}</em></span>
              <span className="mini" aria-hidden="true">{[0, 1, 2].map(j => <i key={j} className={`p${j}`} style={{ "--f": tileFills[(j + k) % 3] } as React.CSSProperties}/>)}</span></a>; })}</div>
        </section>
        <section className="hv2-steps" aria-label="How we score">
          <span className="k">{v2copy.plain ? "how scoring works" : "how we score"}</span>
          {[`${total.toLocaleString("en-US")} ${WORDS?.person ?? "player"} reviews + ${channels} YouTube channels + forums`, "we count every verdict", "one honest line"].map((t, j) => <span key={j} className="s"><i>{j + 1}</i>{t}</span>)}
          <b>No sponsored picks.</b>
          <a href="/how-we-make-these">how it works →</a>
        </section>
        <section className="hv2-faq" aria-labelledby="hv2-faq-t">
          <h2 id="hv2-faq-t">Questions</h2>
          <div className="box">{more.faq.map(f => <details key={f.q}><summary><span>{f.q}</span><i aria-hidden="true"/></summary>
            <p>{`${f.a.replace(/\{top:(beginner|arm)\}/g, (_, p: "beginner" | "arm") => topTwo(p))} `}<a href={f.href}>{f.link}</a></p></details>)}</div>
        </section>
      </>}
    </div>

    <V2Footer/>
  </main>;
}
