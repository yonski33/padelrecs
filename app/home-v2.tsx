import "./home-v2.css";
import Link from "next/link";
import { catalog, score } from "../db/data";
import { displayName } from "../lib/brand-name";
import { productSignals } from "./signals";
import { rankedLists, listHref, topLists } from "./rankings/lists";
import { listYear } from "../lib/top-lists";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { shopPhoto, photoHidden } from "../lib/shop-photos";
import { amazonPhoto } from "../lib/amazon-photos";
import { platformName } from "../lib/source-label";
import { finderPool, withRankings } from "../lib/finder";
import { quickMatch, matchTitle, choiceHref, isDefault, LEVELS, STYLES, type QuickChoice, type Level, type LevelEvidence } from "../lib/quick-match";
import { niche, catalogPath, productHref } from "../lib/niche";
import { quickTakeHooks } from "../db/quick-take";
import { qtFontVars } from "./qt-fonts";

/** The PadelRecs home in design language v2, built around Quick match (owner 2026-11-15: "the home page IS the quiz — you
 *  see the rackets according to what you need, not what we set"). Choices live in the URL (?style=&level=&arm=1) and the list
 *  is rendered on the server, so every combination is a shareable page. Ranking: lib/quick-match.ts. ?home=d: the light home. */

const DAY = 86_400_000;
const LIST_SIZE = 10;
const STYLE_WORD: Record<QuickChoice["style"], string> = { any: "any", control: "control", balance: "balance", power: "power" };
const LEVEL_VALUE: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
/** A quote cut at a word boundary, still the player's own words. */
const clip = (t: string, n = 140) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;

export default async function HomeV2({ choice }: { choice: QuickChoice }) {
  const [data, sigs, takes, lists] = await Promise.all([catalog(), productSignals(), quickTakeHooks(), rankedLists()]);
  const finder = niche.finder!;
  const now = Date.now();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const added = [...data.reviews, ...data.external].filter(x => Date.parse(x.createdAt) >= now - 7 * DAY).length;

  // The same pool and tag counting as /finder, over the models the home page shows (niche.feedMaxAgeYears).
  const good = niche.tags.filter(t => t.tone === "pos").map(t => t.label), bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  const pool = withRankings(finderPool({ ...finder, maxAgeYears: niche.feedMaxAgeYears }, data, good), finder, topLists, data, niche.tags);
  // Level evidence: players here who gave their level and liked it (4–5), and the quick-take level band.
  const likedBy = new Map<string, Partial<Record<Level, number>>>();
  for (const r of data.reviews) {
    const lv = LEVELS.find(l => LEVEL_VALUE[l] === r.playerLevel) ?? (r.playerLevel === "Competitive" ? "advanced" : undefined);
    if (!lv || r.rating < 4) continue;
    const m = likedBy.get(r.racketId) ?? {}; m[lv] = (m[lv] ?? 0) + 1; likedBy.set(r.racketId, m);
  }
  const level = (id: string): LevelEvidence | undefined => { const liked = likedBy.get(id), band = takes.get(id)?.band; return liked || band ? { liked: liked ?? {}, band } : undefined; };
  const matches = quickMatch(pool, finder, choice, { signal: id => sigs.get(id)?.signal ?? null, negativeTags: bad, level, count: LIST_SIZE, rankWeight: finder.rankWeight });
  const head = matchTitle(choice, niche.words.many);

  // Fresh off the court: the newest reports with a verdict, one per racket.
  const seen = new Set<string>();
  const fresh = [
    ...data.reviews.map(r => ({ id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, source: `${niche.site.name} player` })),
    ...data.external.filter(e => e.sentiment).map(e => {
      // Our summary is a paraphrase (no quote marks); an English excerpt is the player's words (quote marks).
      const words = e.excerpt && !e.sourceLanguage ? e.excerpt : null;
      return { id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary ?? words ?? "", quote: !e.summary && !!words,
        source: [platformName(e.sourcePlatform), e.sourcePlatform === "Reddit" ? e.sourceName : null].filter(Boolean).join(" · ") };
    }),
  ].filter(x => x.text).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 4);
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);

  const pill = (label: string, next: QuickChoice, on: boolean) => <Link href={choiceHref(next)} scroll={false} replace aria-pressed={on} className={on ? "on" : undefined}>{label}</Link>;
  return <main className={`hv2 ${qtFontVars}`}>
    <div className="hv2-strip">a free, ad-light side project · built by padel players · <a href="/about">how we make these →</a></div>
    <div className="hv2-wrap">
      <section className="hv2-hero">
        <p className="hv2-live"><i aria-hidden="true"/>{`${added.toLocaleString("en-US")} added this week · ${total.toLocaleString("en-US")} player reports`}</p>
        <h1>We read the web so you <span className="hl">{"don't have to."}</span></h1>
        <p className="hv2-sub">We dig through forums, YouTube tests, padel blogs and players&apos; own reviews, then give you the honest take. No sponsored picks.</p>
      </section>

      <section className="hv2-qm" id="match" aria-label="Quick match">
        <p className="hv2-qm-k">quick match</p>
        <div className="hv2-sentence">
          <span>I want</span>
          <span className="hv2-pills" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{pill(STYLE_WORD[s], { ...choice, style: s }, choice.style === s)}</span>)}</span>
          <span>and I&apos;m</span>
          <span className="hv2-pills" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(l, { ...choice, level: l }, choice.level === l)}</span>)}</span>
          <span className="hv2-pills">{pill(`${choice.arm ? "✓" : "+"} sore elbow / wrist`, { ...choice, arm: !choice.arm }, choice.arm)}</span>
        </div>
      </section>

      <div className="hv2-grid">
        <section className="hv2-main" aria-live="polite">
          <h2>{head.title}</h2>
          <div className="hv2-subrow"><p>{head.sub}</p>{!isDefault(choice) && <Link href="/#match" scroll={false} replace>reset</Link>}</div>
          {matches.length === 0 && <p className="hv2-empty">Nothing matches that yet. Try another combination.</p>}
          <ol className="hv2-list">{matches.map((m, i) => {
            const r = byId.get(m.product.id)!, s = score(data, r.id), sig = sigs.get(r.id), pic = photo(r);
            const n = data.reviews.filter(x => x.racketId === r.id).length + data.external.filter(x => x.racketId === r.id).length;
            const line = takes.get(r.id)?.hook ?? shortLine(r) ?? listLine(r);
            const judged = s.positive + s.mixed + s.negative;
            // Each "why" chip shows its count (owner): tag mentions or players at this level who liked it.
            const why = [
              ...(i === 0 && !isDefault(choice) ? [{ k: "best", t: "best match" }] : []),
              ...(m.arm >= 2 && (choice.arm || m.arm >= 5) ? [{ k: "arm", t: `arm-friendly · ${m.arm} players` }] : []),
              ...m.reasons.filter(x => x.tag !== "arm-friendly").slice(0, 2).map(x => ({ k: x.tag, t: `${x.tag} · ${x.count} players` })),
              ...(!isDefault(choice) && m.levelLiked >= 2 ? [{ k: "lvl", t: `${m.levelLiked} ${choice.level === "advanced" ? "advanced players" : `${choice.level}s`} liked it` }] : []),
            ];
            return <li key={r.id}><a className="hv2-row" href={productHref(r)}>
              <span className="hv2-rank">{i + 1}</span>
              <span className="hv2-pic">{pic ? <img src={pic} alt="" loading={i < 3 ? "eager" : "lazy"}/> : <span className="hv2-tile">{nameOf(r).split(" ").slice(0, 2).join(" ")}</span>}</span>
              <span className="hv2-body"><span className="hv2-name">{nameOf(r)}</span>{line && <span className="hv2-line">{line}</span>}
                <span className="hv2-why">{why.map(w => <span key={w.k} className={w.k === "best" ? "best" : undefined}>{w.t}</span>)}{r.shape && <span className="shape">{r.shape.toLowerCase()}</span>}</span></span>
              <span className="hv2-stats">
                {sig && <span className="hv2-score" title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in."><b>{sig.signal}</b>player score</span>}
                {judged > 0 && <span className="hv2-bar" role="img" aria-label={`${s.positive} positive, ${s.mixed} mixed, ${s.negative} negative`}><i className="p" style={{ flex: s.positive }}/><i className="m" style={{ flex: s.mixed }}/><i className="n" style={{ flex: s.negative }}/></span>}
                <span className="hv2-n">{`${n} player reports`}</span>
              </span>
            </a></li>;
          })}</ol>
          <a className="hv2-more" href={catalogPath}>{`see all ${data.listed.length} ${niche.words.many} →`}</a>
        </section>

        <aside className="hv2-side">
          <section>
            <div className="hv2-sidehead"><h2>Fresh off the court</h2><a href="/reviews">all →</a></div>
            <ul className="hv2-feed">{fresh.map(f => { const r = byId.get(f.racketId)!; return <li key={f.id}>
              <p className="hv2-src"><span>{f.source}</span>{ago(f.date, now)}</p>
              <a href={productHref(r)}>{nameOf(r)}</a>
              <p>{f.quote ? `“${clip(f.text)}”` : clip(f.text)}</p>
            </li>; })}</ul>
          </section>
          {best.length > 0 && <section>
            <h2>Best-of lists</h2>
            <ul className="hv2-best">{best.map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>{l.list.label.replace(/\{year\}/, String(listYear(l.list)))}<span aria-hidden="true">→</span></a></li>)}</ul>
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
          <div><h3>2. We count the verdicts</h3><p>Each report is sorted as positive, mixed or negative, and by what it talks about. Quick match ranks rackets on those counts.</p></div>
          <div><h3>3. We write one honest line</h3><p>{"Then we give our take, and say where the data is thin. We don't test rackets and no brand pays for placement."}</p></div>
        </div>
      </section>
      <p className="hv2-made">made by people who own too many rackets 🎾</p>
    </div>
  </main>;
}
