import "../rankings-v2.css";
import { niche, productHref } from "../../../lib/niche";
import { listYear, MIN_LIST_REVIEWS, RANKINGS_PATH } from "../../../lib/top-lists";
import { displayName } from "../../../lib/brand-name";
import { listLine } from "../../../lib/list-lines";
import { shortLine } from "../../../lib/short-lines";
import { websiteButton } from "../../../lib/product-links";
import type { AmazonButton } from "../../../lib/amazon-offer";
import { score, type Catalog } from "../../../db/data";
import { readChoice, LEVELS, type QuickChoice } from "../../../lib/quick-match";
import { fitVerdict, bestFor } from "../../../lib/fit-verdict";
import { matchScore } from "../../../lib/match-score";
import { qtFontVars } from "../../qt-fonts";
import { V2Footer } from "../../v2-footer";
import { matchContext } from "../../match-context";
import { listHref, type RankedList } from "../lists";
import { photoOf, shortDate } from "../rankings-v2";
import RankPicks from "./rank-picks";

// A ranking in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/TTmbZPDFLuRzQiqsAG3Nc1), PadelRecs
// only: the lists as tabs, a big title, "your match" (the home's quick-match picks, in the URL, with the match % on every row),
// the top three as cards with why it's here / the catch (the quick take's own hook), the rest as quiet rows. The order is
// always the list's own (Player score); picks only add the match %. The FAQ stays below for search.
export type Search = { style?: string; level?: string; arm?: string; pct?: string };
const MATCH_NOTE = "How well it fits your picks, from player reports. Not a % of happy players.";

export default async function RankingV2({ data, lists, found, amazon, affiliate, faq, jsonLd, search }: {
  data: Catalog; lists: RankedList[]; found: RankedList; amazon: (AmazonButton | null)[]; affiliate: boolean;
  faq: { q: string; a: string }[]; jsonLd: object; search: Search }) {
  const { list, entries, reviews, updated } = found;
  const ctx = await matchContext();
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  // Picked once a level is in the URL (the picks pane always sets one); a style alone doesn't answer yet.
  const choice: QuickChoice = readChoice(search), picked = !!search.level && (LEVELS as readonly string[]).includes(search.level);
  const showPct = picked && search.pct !== "0";
  const href = listHref(list.slug);
  const picks = picked ? `?${new URLSearchParams([...(choice.style !== "any" ? [["style", choice.style]] : []), ["level", choice.level], ...(choice.arm ? [["arm", "1"]] : [])])}` : "";
  // "The 10 best padel rackets overall in 2026": the label after "Best" is the highlighted part.
  const year = listYear(list), many = `${niche.seo.productCategory.toLowerCase()}s`;
  const hl = list.label.replace(/^best\s+/i, "").toLowerCase();
  const yearPart = /\d{4}/.test(hl) ? "" : ` in ${year}`;
  const seen = new Set<string>(), tabs = lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug));
  const others = tabs.filter(l => l.list.slug !== list.slug);
  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const profileLine = [choice.level, choice.style !== "any" ? choice.style : null, choice.arm ? "sore arm" : null].filter(Boolean).join(" · ");
  const pctHref = (on: boolean) => { const q = new URLSearchParams(picks.replace(/^\?/, "")); if (!on) q.set("pct", "0"); return `${href}?${q}`; };

  return <main className={`rl2 ${qtFontVars}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="rl2-wrap">
      {tabs.length > 1 && <nav className="rl2-tabs" aria-label="Rankings">{tabs.map(l => <a key={l.list.slug} href={`${listHref(l.list.slug)}${picks}`} aria-current={l.list.slug === list.slug ? "page" : undefined}>{l.list.label.toLowerCase()}</a>)}</nav>}

      <section className="rl2-hero">
        <div className="rl2-crumbs"><a href={RANKINGS_PATH}>rankings</a> / {list.label.toLowerCase()}</div>
        <h1>{`The ${entries.length} best ${many} `}<span className="hl">{hl}</span>{yearPart}</h1>
        <p className="rl2-sub">{`${entries.length} ${entries.length === 1 ? niche.words.one : niche.words.many}, ranked from ${reviews.toLocaleString("en-US")} ${niche.people.one} reviews on ${niche.site.name.toLowerCase()}, YouTube and forums. Not by us, not by brands.`}</p>
        <div className="rl2-meta">
          {updated && <><span>{`updated ${shortDate(updated)}`}</span><span>·</span></>}
          <details className="rl2-how"><summary>how we rank <span className="closed">+</span><span className="open">−</span></summary>
            <div className="rl2-howbox"><strong>Player score</strong>{` = how much players like it, adjusted for how many spoke up. 5 glowing reviews can't beat 60 good ones. Min. ${min} reviews to be ranked. `}<a href="/how-we-make-these">full method →</a></div></details>
          {affiliate && <><span>·</span><span>{"* some links are affiliate, they don't change the order"}</span></>}
        </div>
      </section>

      <section className="rl2-match" aria-label="Your match">
        <input type="checkbox" id="rl2-edit" className="rl2-edit-t"/>
        {picked ? <>
          <span className="rl2-you"><span className="rl2-badge">⚡ your match</span><span>Showing how each fits <strong>{profileLine}</strong></span></span>
          <span className="rl2-ctl">
            <a className="rl2-sw" href={pctHref(!showPct)} role="switch" aria-checked={showPct}><i aria-hidden="true"/>show match %</a>
            <label htmlFor="rl2-edit" className="rl2-edit-l"><span className="off">edit</span><span className="on">done ✓</span></label>
          </span>
          {showPct && <p className="rl2-note">{`match % = ${MATCH_NOTE.toLowerCase()}`}</p>}
        </> : <span className="rl2-none">
          <span><strong>{"#1 for everyone isn't always #1 for you."}</strong>{" Answer 2 questions to see your match % on every racket."}</span>
          <label htmlFor="rl2-edit" className="rl2-go"><span>find my match →</span></label>
        </span>}
        <div className="rl2-pane"><RankPicks href={href} current={picked ? choice : null} finder={niche.finder ? "/finder" : undefined}/></div>
      </section>

      <ol className="rl2-list">{entries.map((e, i) => {
        const r = byId.get(e.product.id); if (!r) return null;
        const name = displayName(r.name, brand(r.brandId)), url = `${productHref(r)}${picks}`, pic = photoOf(r);
        const sc = score(data, r.id), facts = ctx.facts(r.id), take = ctx.takes.get(r.id);
        const sig = e.signal?.signal ?? null, top = e.rank <= 3;
        const best = bestFor(facts);
        let pct: number | null = null;
        if (showPct) { const fit = fitVerdict(choice, facts), t = ctx.traits(r.id).scores, lv = ctx.level(r.id);
          pct = matchScore(choice, { verdict: fit, control: t?.control?.score ?? null, power: t?.power?.score ?? null, arm: t?.arm?.score ?? null, band: lv?.band, likedAtLevel: lv?.liked[choice.level] ?? 0, suits: lv?.suits?.[choice.level], signal: ctx.signal(r.id) }); }
        const a = amazon[i], site = websiteButton({ websiteUrl: e.product.websiteUrl ?? null, affiliateUrl: e.product.affiliateUrl ?? null });
        const shop = a ? { url: a.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
        const total = sc.positive + sc.mixed + sc.negative;
        return <li key={r.id} id={`n${e.rank}`} className={`rl2-row${top ? " top" : ""}${e.rank === 1 ? " first" : ""}`}>
          <div className="rl2-grid">
            <span className="rl2-rank">{`#${e.rank}`}</span>
            <a className="rl2-pic" href={url} tabIndex={-1} aria-hidden="true">{pic ? <img src={pic} alt="" loading={i < 3 ? "eager" : "lazy"}/> : <span>{brand(r.brandId)}</span>}</a>
            <div className="rl2-body">
              <div className="rl2-nrow"><a className="rl2-name" href={url}>{name}</a>{e.rank === 1 && <span className="rl2-chip">★ #1 pick</span>}</div>
              {(shortLine(e.product) ?? listLine(e.product)) && <p className="rl2-line">{shortLine(e.product) ?? listLine(e.product)}</p>}
              <div className="rl2-facts">
                {best.length > 0 && <span><strong>best for</strong> {best.join(", ")}</span>}
                {total > 0 && <span className="rl2-bar" role="img" aria-label={`${sc.positive} positive, ${sc.mixed} mixed, ${sc.negative} negative reviews`}>
                  <span className="p" style={{ flex: sc.positive }}/><span className="m" style={{ flex: sc.mixed }}/><span className="n" style={{ flex: sc.negative }}/></span>}
                {list.trait && <span>{`${e.traitReviews} mention ${list.trait.noun}`}</span>}
              </div>
            </div>
            {shop ? <a className="rl2-buy" href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a> : <span/>}
            <a className="rl2-score" href={url} title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">
              {sig !== null ? <b className={sig >= 85 ? "hi" : sig >= 75 ? "mid" : undefined}>{sig}</b> : <b>–</b>}
              <small>player score</small>
              {showPct && (pct === null ? <span className="rl2-pct thin" title="Too few reports from players like you for a match %">match: few reports</span>
                : <span className={`rl2-pct${pct >= 80 ? " hi" : pct >= 60 ? " mid" : ""}`} title={MATCH_NOTE}>{`${pct}% match`}</span>)}
            </a>
          </div>
          {top && take && <div className="rl2-wc">
            <div className="why"><i aria-hidden="true">✓</i><span><small>{"why it's here"}</small><p>{take.good}</p></span></div>
            <div className="catch"><i aria-hidden="true">!</i><span><small>the catch</small><p>{take.catch}</p></span></div>
          </div>}
        </li>; })}</ol>

      <section className="rl2-after">
        <div className="rl2-played"><div><div className="rl2-played-h">Played one of these?</div><div className="rl2-played-p">Your verdict moves the list. One tap, no account.</div></div>
          <a href="/add-review">+ add a review</a></div>
        {others.length > 0 && <div className="rl2-others"><div className="rl2-others-h">{others.every(l => l.entries.length >= 10) ? "Other top 10s" : "Other rankings"}</div>
          <div>{others.map(l => <a key={l.list.slug} href={`${listHref(l.list.slug)}${picks}`}>{l.list.label.replace(/^best\s+/i, "").toLowerCase()}</a>)}</div></div>}
      </section>

      <section className="rl2-faq" id="how-we-rank"><h2>Common questions</h2>
        {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
    </div>
    <V2Footer/>
  </main>;
}
