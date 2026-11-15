import "./home-v2.css";
import Link from "next/link";
import { matchContext } from "./match-context";
import { listShopLink } from "../lib/amazon-offer";
import { score } from "../db/data";
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
import { fitVerdict, ARM_BAR, MIN_FIT_REPORTS } from "../lib/fit-verdict";
import { rowOfFamily } from "../lib/compare-pairs";
import { newThisWeek } from "../lib/new-this-week";

const MATCH_NOTE = "How well it fits your picks, from player reports. Not a % of happy players.";
import { qtFontVars } from "./qt-fonts";
import { SHAPES, WEIGHTS, FEELS, SHAPE_LABEL, fineEmpty, fineWords } from "../lib/fine-tune";
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

export default async function HomeV2({ choice, older: allYears = false }: { choice: QuickChoice; older?: boolean }) {
  const [{ data, sigs, takes, finder, bad, pool, level, signal, factsFor, matchPct, fineOf }, lists] = await Promise.all([matchContext(), rankedLists()]);
  const now = Date.now();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const added = newThisWeek(data, now);
  // With picks, rows are ordered by the match % (lib/match-score.ts), which always agrees with the fit word; quick match picks
  // the candidates. Thin data has no % and goes last. No picks: quick match's own order (Player score).
  // With picks, every model in the pool is a candidate (a shape pick hides other shapes, and unknown ones), ordered by the
  // spread match % (app/match-context.ts matchPct, the same number the racket page shows). No picks: the Player score order.
  const candidates = quickMatch(pool, finder, choice, { signal, negativeTags: bad, level, count: pool.length, rankWeight: finder.rankWeight })
    .filter(m => isDefault(choice) || !choice.fine?.shape || fineOf(m.product.id)?.shape === choice.fine.shape);
  const pcts = isDefault(choice) ? null : matchPct(choice);
  // One model, newest year first (owner 2026-11-15: "2 Air Vipers and 2 Electra Pros in the top 5"): a model's years
  // (lib/compare-pairs.ts modelFamily: same brand, same name without the year and generation number) share one row, the newest year's, ranked by
  // the shown year's own % (or its own Player score order), never another year's. Older years stay on their own pages, in search and in the rankings.
  // A newest year without enough reports for a % yet hands the row to the newest year that has them, and gets a "new:" link
  // (owner 2026-11-15, "Yes, fall back").
  const reportsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
  const rowOf = (id: string) => rowOfFamily(byId.get(id)!, data.listed, r => (reportsOf.get(r.id) ?? 0) >= MIN_FIT_REPORTS);
  // "show older models" (?older=1, owner 2026-11-15): every year as its own row. The rows never link other years.
  const newestOf = (id: string) => allYears ? id : rowOf(id).shown.id;
  const order = new Map(candidates.map((m, i) => [m.product.id, i]));
  const seenModel = new Set<string>();
  // A picked shape holds for the row too: a family whose newest year is another shape keeps the year that matched.
  const shapeOk = (id: string) => !choice.fine?.shape || fineOf(id)?.shape === choice.fine.shape;
  const models = candidates.flatMap(m => { const n = newestOf(m.product.id), id = shapeOk(n) ? n : m.product.id; if (seenModel.has(id)) return []; seenModel.add(id);
    return [{ id, i: order.get(id) ?? candidates.length + (order.get(m.product.id) ?? 0), arm: factsFor(choice, id).tags["arm-friendly"] ?? 0 }]; });
  const rated = models.map(m => ({ m, i: m.i, fit: pcts ? fitVerdict(choice, factsFor(choice, m.id)) : null, pct: pcts?.get(m.id) ?? null }));
  const rows = [...rated].sort((a, b) => (pcts ? (b.pct ?? -1) - (a.pct ?? -1) : 0) || a.i - b.i).slice(0, LIST_SIZE);
  const olderN = allYears ? 0 : candidates.filter(m => newestOf(m.product.id) !== m.product.id).length;
  // Rows carry the picks to the racket page, so its fit check answers for this visitor (RACKET-FIT-PAGE.md).
  const picks = isDefault(choice) ? "" : choiceHref(choice, "").replace(/^\/\??/, "?");
  const head = matchTitle(choice, niche.words.many);

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
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);

  const pill = (label: string, next: QuickChoice, on: boolean) => <Link href={choiceHref(next)} scroll={false} replace aria-current={(on) ? "true" : undefined} className={on ? "on" : undefined}>{label}</Link>;
  const picked = !isDefault(choice);
  return <main className={`hv2 ${qtFontVars}`}>
    {/* The mockup's own footer (owner 2026-11-15: "match it 100%"); home-v2.css hides the site's on this page. The header is the site's (site-header.tsx). */}

    <div className="hv2-wrap">
      <section className="hv2-hero">
        <div><h1>Less guessing. <span className="hl">Better rackets.</span></h1>
          <p className="hv2-sub">{"Tell us how you play. We'll handle the gear homework."}</p></div>
        <p className="hv2-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${added.toLocaleString("en-US")} new this week`}</p>
      </section>

      <section className="hv2-qm" id="match" aria-label="Quick match">
        <span className="hv2-qk"><b>quick match</b>I want</span>
        <span className="hv2-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{pill(STYLE_WORD[s], { ...choice, style: s }, picked && choice.style === s)}</span>)}</span>
        <span className="hv2-qk">and I&apos;m</span>
        <span className="hv2-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(l, { ...choice, level: l }, picked && choice.level === l)}</span>)}</span>
        <Link className="hv2-arm" href={choiceHref({ ...choice, arm: !choice.arm })} scroll={false} replace aria-current={(choice.arm) ? "true" : undefined}><i aria-hidden="true">{choice.arm ? "✓" : ""}</i>sore elbow / wrist</Link>
        {/* Not sure yet? fine-tune (owner 2026-11-15): optional shape / weight / feel / sweet-spot picks, in the URL like the rest. */}
        {picked && <details className="hv2-fine" open={!fineEmpty(choice.fine)}>
          <summary><span className="c">Not sure yet? <b>fine-tune ▾</b></span><span className="o">fewer filters ▴</span></summary>
          <div className="hv2-fine-rows">
            {([["Shape", "shape", SHAPES.map(v => [v, SHAPE_LABEL[v]] as const)], ["Weight", "weight", WEIGHTS.map(v => [v, v] as const)], ["Feel on impact", "feel", FEELS.map(v => [v, v] as const)]] as const).map(([label, key, opts]) => {
              const cur = choice.fine?.[key];
              const with_ = (v: string | undefined) => ({ ...choice, fine: { ...choice.fine, [key]: v } });
              return <div key={key} className="hv2-fine-row"><span className="hv2-fk">{label}</span><span className="hv2-lv" role="group" aria-label={label}>
                {opts.map(([v, l]) => <span key={v}>{pill(l, with_(cur === v ? undefined : v), cur === v)}</span>)}
                {key !== "feel" && <span>{pill("any", with_(undefined), !cur)}</span>}</span></div>; })}
            <Link className="hv2-arm" href={choiceHref({ ...choice, fine: { ...choice.fine, sweet: !choice.fine?.sweet || undefined } })} scroll={false} replace aria-current={(!!choice.fine?.sweet) ? "true" : undefined}><i aria-hidden="true">{choice.fine?.sweet ? "✓" : ""}</i>bigger sweet spot</Link>
          </div>
        </details>}
        {picked && <p className="hv2-game">{"Your game: "}<b>{[choice.level[0].toUpperCase() + choice.level.slice(1), STYLE_WORD[choice.style][0].toUpperCase() + STYLE_WORD[choice.style].slice(1), choice.arm ? "sore arm" : null, ...fineWords(choice.fine)].filter(Boolean).join(" · ")}</b>
          <Link href="/" scroll={false} replace>reset ↺</Link></p>}
      </section>

      <div className="hv2-grid">
        <section className="hv2-main" aria-live="polite">
          <div className="hv2-lhead"><h2>{picked ? head.title : `Top ${niche.words.many} right now`}</h2>
            <span>{picked ? <>{`ranked for ${choice.level === "advanced" ? "advanced players" : `${choice.level}s`}${choice.arm ? " · arm-friendly first" : ""} · `}<details className="hv2-what"><summary>{"what's the %?"}</summary><span>{`${MATCH_NOTE} `}<a href="/how-we-make-these#match">how it works</a></span></details></> : "ranked by player score · pick above to personalise"}</span></div>
          {rows.length === 0 && <p className="hv2-empty">Nothing matches that yet. Try another combination.</p>}
          <div className="hv2-box">
          <ol className={`hv2-list${picked ? " hv2-picked" : ""}`}>{rows.map(({ m, fit, pct }, i) => {
            const r = byId.get(m.id)!, sig = sigs.get(r.id), pic = photo(r);
            const n = data.reviews.filter(x => x.racketId === r.id).length + data.external.filter(x => x.racketId === r.id).length;
            const line = takes.get(r.id)?.hook ?? shortLine(r) ?? listLine(r);
            // The fit check's verdict for the picks (lib/fit-verdict.ts), with one short real reason; none without picks or on thin data.
            const fitWord = fit && fit.kind !== "thin" ? { good: "Strong fit", maybe: "Worth a look", no: "Probably not your match" }[fit.kind] : null;
            const chips = [
              ...(i === 0 && picked && fit?.kind === "good" ? [{ k: "best", t: "best match" }] : []),
              ...(r.shape ? [{ k: "shape", t: r.shape.toLowerCase() }] : []),
              ...(m.arm >= ARM_BAR && choice.arm ? [{ k: "arm", t: "arm-friendly" }] : []),
            ];
            // The row is one link (the name's, stretched over the row) with "check price" as a quiet text link under the
            // summary line (owner 2026-11-15: low-key, close to the text). Reviews over the sentiment bar, then the score box.
            const shop = listShopLink(r), c = score(data, r.id);
            return <li key={r.id} className={i === 0 && picked ? "top" : undefined}><div className="hv2-row">
              <span className="hv2-rank">{i + 1}</span>
              <span className="hv2-pic">{pic ? <img src={pic} alt="" width={408} height={620} decoding="async" loading={i < 3 ? "eager" : "lazy"}/> : <span className="hv2-tile">{nameOf(r).split(" ").slice(0, 2).join(" ")}</span>}</span>
              <span className="hv2-body"><span className="hv2-nrow"><a className="hv2-name" href={`${productHref(r)}${picks}`}>{nameOf(r)}</a>{chips.map(c => <span key={c.k} className={`hv2-chip ${c.k}`}>{c.t}</span>)}</span>
                {line && <span className="hv2-line">{line}</span>}
                {shop && <a className="hv2-buy" href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a>}
                {fitWord && <span className={`hv2-fit ${fit!.kind}`}><b>{fitWord}</b>{fit!.short && <span>{fit!.short}</span>}</span>}</span>
              <span className="hv2-sent"><span><strong>{n.toLocaleString("en-US")}</strong>{` ${n === 1 ? "review" : "reviews"}`}</span>
                {c.judged > 0 && <span className="hv2-bar" aria-label={`${c.positive} positive, ${c.mixed} mixed, ${c.negative} negative`}><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>}</span>
              {picked ? <span className={`hv2-sc ${pct === null ? "none" : pct >= 80 ? "hi" : pct >= 60 ? "mid" : ""}`} title={MATCH_NOTE} aria-label={pct === null ? "No match % yet: not enough reports" : `${pct}% match. ${MATCH_NOTE}`}>
                  <b>{pct === null ? "—" : `${pct}%`}</b><small>{pct === null ? "too few reports" : "match"}</small></span>
                : <span className={`hv2-sc ${!sig ? "none" : sig.signal >= 85 ? "hi" : sig.signal >= 75 ? "mid" : ""}`} title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">
                  <b>{sig ? sig.signal : "—"}</b><small>player score</small></span>}
            </div></li>;
          })}</ol>
          {(olderN > 0 || allYears) && <Link className="hv2-older" href={`${choiceHref(choice, "")}${allYears ? "" : `${choiceHref(choice, "").includes("?") ? "&" : "?"}older=1`}#match`} scroll={false} replace>{allYears ? "hide older models ▴" : "show older models ▾"}</Link>}
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
      </div>
    </div>

    <V2Footer/>
  </main>;
}
