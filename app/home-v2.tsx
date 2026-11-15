import "./home-v2.css";
import Link from "next/link";
import { score } from "../db/data";
import { matchContext } from "./match-context";
import { displayName } from "../lib/brand-name";
import { rankedLists, listHref } from "./rankings/lists";
import { listYear } from "../lib/top-lists";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { shopPhoto, photoHidden } from "../lib/shop-photos";
import { amazonPhoto } from "../lib/amazon-photos";
import { platformName } from "../lib/source-label";
import { quickMatch, matchTitle, choiceHref, isDefault, LEVELS, STYLES, type QuickChoice } from "../lib/quick-match";
import { niche, catalogPath, productHref } from "../lib/niche";
import { qtFontVars } from "./qt-fonts";
import { V2Footer } from "./v2-footer";

/** The PadelRecs home in design language v2, built around Quick match (owner 2026-11-15: "the home page IS the quiz — you
 *  see the rackets according to what you need, not what we set"). Choices live in the URL (?style=&level=&arm=1) and the list
 *  is rendered on the server, so every combination is a shareable page. Ranking: lib/quick-match.ts. ?home=d: the light home. */

const DAY = 86_400_000;
const LIST_SIZE = 10;
const STYLE_WORD: Record<QuickChoice["style"], string> = { any: "any", control: "control", balance: "balance", power: "power" };

function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
/** A quote cut at a word boundary, still the player's own words. */
const clip = (t: string, n = 140) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;

export default async function HomeV2({ choice }: { choice: QuickChoice }) {
  const [{ data, sigs, takes, finder, bad, pool, level, signal }, lists] = await Promise.all([matchContext(), rankedLists()]);
  const now = Date.now();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const added = [...data.reviews, ...data.external].filter(x => Date.parse(x.createdAt) >= now - 7 * DAY).length;
  const matches = quickMatch(pool, finder, choice, { signal, negativeTags: bad, level, count: LIST_SIZE, rankWeight: finder.rankWeight });
  // Rows carry the picks to the racket page, so its fit check answers for this visitor (RACKET-FIT-PAGE.md).
  const picks = isDefault(choice) ? "" : choiceHref(choice, "").replace(/^\/\??/, "?");
  const head = matchTitle(choice, niche.words.many);

  // Fresh off the court: the newest reports with a verdict, one per racket.
  const seen = new Set<string>();
  const fresh = [
    ...data.reviews.map(r => ({ id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, tag: niche.site.name.toLowerCase() })),
    ...data.external.filter(e => e.sentiment).map(e => {
      // Our summary is a paraphrase (no quote marks); an English excerpt is the player's words (quote marks).
      const words = e.excerpt && !e.sourceLanguage ? e.excerpt : null;
      return { id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary ?? words ?? "", quote: !e.summary && !!words,
        tag: platformName(e.sourcePlatform).toLowerCase() };
    }),
  ].filter(x => x.text).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 3);
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);

  const pill = (label: string, next: QuickChoice, on: boolean) => <Link href={choiceHref(next)} scroll={false} replace aria-pressed={on} className={on ? "on" : undefined}>{label}</Link>;
  const picked = !isDefault(choice);
  return <main className={`hv2 ${qtFontVars}`}>
    {/* The mockup's own footer (owner 2026-11-15: "match it 100%"); home-v2.css hides the site's on this page. The header is the site's (site-header.tsx). */}

    <div className="hv2-wrap">
      <section className="hv2-hero">
        <h1>Every {niche.words.one}, reviewed by <span className="hl">real players</span></h1>
        <p className="hv2-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${added.toLocaleString("en-US")} new this week`}</p>
      </section>

      <section className="hv2-qm" id="match" aria-label="Quick match">
        <span className="hv2-qk"><b>quick match</b>I want</span>
        <span className="hv2-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{pill(STYLE_WORD[s], { ...choice, style: s }, picked && choice.style === s)}</span>)}</span>
        <span className="hv2-qk">and I&apos;m</span>
        <span className="hv2-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(l, { ...choice, level: l }, picked && choice.level === l)}</span>)}</span>
        <Link className="hv2-arm" href={choiceHref({ ...choice, arm: !choice.arm })} scroll={false} replace aria-pressed={choice.arm}><i aria-hidden="true">{choice.arm ? "✓" : ""}</i>sore elbow / wrist</Link>
      </section>

      <div className="hv2-grid">
        <section className="hv2-main" aria-live="polite">
          <div className="hv2-lhead"><h2>{picked ? head.title : `Top ${niche.words.many} right now`}</h2>
            <span>{picked ? <>{`ranked for ${choice.level === "advanced" ? "advanced players" : `${choice.level}s`}${choice.arm ? " · arm-friendly first" : ""} · `}<Link href="/" scroll={false} replace>reset</Link></> : "ranked by player score · pick above to personalise"}</span></div>
          {matches.length === 0 && <p className="hv2-empty">Nothing matches that yet. Try another combination.</p>}
          <div className="hv2-box">
          <ol className="hv2-list">{matches.map((m, i) => {
            const r = byId.get(m.product.id)!, s = score(data, r.id), sig = sigs.get(r.id), pic = photo(r);
            const n = data.reviews.filter(x => x.racketId === r.id).length + data.external.filter(x => x.racketId === r.id).length;
            const line = takes.get(r.id)?.hook ?? shortLine(r) ?? listLine(r);
            const judged = s.positive + s.mixed + s.negative;
            const chips = [
              ...(i === 0 && picked ? [{ k: "best", t: "best match" }] : []),
              ...(r.shape ? [{ k: "shape", t: r.shape.toLowerCase() }] : []),
              ...(m.arm >= 2 && choice.arm ? [{ k: "arm", t: "arm-friendly" }] : []),
            ];
            return <li key={r.id} className={i === 0 && picked ? "top" : undefined}><a className="hv2-row" href={`${productHref(r)}${picks}`}>
              <span className="hv2-rank">{i + 1}</span>
              <span className="hv2-pic">{pic ? <img src={pic} alt="" loading={i < 3 ? "eager" : "lazy"}/> : <span className="hv2-tile">{nameOf(r).split(" ").slice(0, 2).join(" ")}</span>}</span>
              <span className="hv2-body"><span className="hv2-nrow"><span className="hv2-name">{nameOf(r)}</span>{chips.map(c => <span key={c.k} className={`hv2-chip ${c.k}`}>{c.t}</span>)}</span>
                {line && <span className="hv2-line">{line}</span>}</span>
              <span className="hv2-stats">
                <span title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">{sig ? <><strong>{sig.signal}</strong> player score · </> : null}{n}</span>
                {judged > 0 && <span className="hv2-bar" role="img" aria-label={`${s.positive} positive, ${s.mixed} mixed, ${s.negative} negative`}><i className="p" style={{ flex: s.positive }}/><i className="m" style={{ flex: s.mixed }}/><i className="n" style={{ flex: s.negative }}/></span>}
              </span>
            </a></li>;
          })}</ol>
          <a className="hv2-more" href={catalogPath}>{`see all ${data.listed.length} ${niche.words.many} →`}</a>
          </div>
        </section>

        <aside className="hv2-side">
          <section>
            <div className="hv2-sidehead"><h3>Fresh off the court</h3><a href="/reviews">all →</a></div>
            <ul className="hv2-feed">{fresh.map(f => { const r = byId.get(f.racketId)!; return <li key={f.id}><a href={productHref(r)}>
              <span className="hv2-src"><span className={`t ${f.tag}`}>{f.tag}</span>{ago(f.date, now)}</span>
              <b>{nameOf(r)}</b>
              <span className="hv2-q">{f.quote ? `“${clip(f.text)}”` : clip(f.text)}</span>
            </a></li>; })}</ul>
          </section>
          {best.length > 0 && <section>
            <h3>Best-of lists</h3>
            <ul className="hv2-best">{best.map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>{l.list.label.replace(/\{year\}/, String(listYear(l.list))).toLowerCase()}</a></li>)}</ul>
          </section>}
          <section className="hv2-own">
            <p className="t">Own a {niche.words.one}? Add your verdict.</p>
            <p>Two minutes, no account.</p>
            <a href="/add-review">+ add a review</a>
          </section>
        </aside>
      </div>
    </div>

    <V2Footer/>
  </main>;
}
