// "Get to know the top 10" under a ranked list (owner-approved mock 2026-11-19, https://claude.ai/artifact/1SraSpcRFykkPTXZCC3FVB):
// a Quick picks box, a sticky strip of thumbnails, every product as an open block, then how the list was picked, a short FAQ
// and the related lists. Shown on lists with `deep` (lib/niche/types.ts TopList), the padel best-overall pilot for now; the
// words come from lib/ranking-deep.ts, so a beginners or tennis-elbow list can reuse it by config. Server-rendered with the
// page; only the strip's highlight runs in the browser (ranking-deep-strip.tsx).
import "./ranking-deep.css";
import type { Catalog } from "../../../db/data";
import { niche, scoreLabel } from "../../../lib/niche";
import { withoutYear } from "../../../lib/brand-name";
import { pageContent } from "../../../lib/racket-page";
import { voiceTagline } from "../../../lib/voice-taglines";
import { padelWords } from "../../../lib/content-consistency";
import { quickTakeFor } from "../../../db/quick-take";
import { plain as qtPlain } from "../../../lib/quick-take";
import { claimBlock } from "../../../lib/claim-guard";
import { refName } from "../../../lib/compare-names";
import { tagTone } from "../../../lib/tags";
import { gramsOf } from "../../../lib/fine-tune";
import { subOf } from "../../../lib/reddit-cards";
import { platformName } from "../../../lib/source-label";
import { MIN_SIGNAL_REVIEWS } from "../../../lib/signal";
import { MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE, RANKINGS_PATH, listYear } from "../../../lib/top-lists";
import { DEEP_BARS, DEEP_MAX, against, lineOk, whyLine, loveLine, watchLine, skipLine, tipLine, comparedLine, quickPicks, tagPills, type DeepRow, type DeepItem } from "../../../lib/ranking-deep";
import type { matchContext } from "../../match-context";
import type { TopList } from "../../../lib/niche/types";
import { listHref, type RankedList } from "../lists";
import { DeepStrip } from "./ranking-deep-strip";
import { photoOf } from "../rankings-v2";

type Ctx = NonNullable<Awaited<ReturnType<typeof matchContext>>>;
type Product = Catalog["rackets"][number];
/** A ranked row as ranking-v2.tsx builds it. */
export type DeepInput = { r: Product; rank: number; name: string; url: string; pic: string | null; sig: number | null; shop: { url: string; rel: string } | null };

const TRAITS = ["forgiveness", "power", "control", "defence", "arm", "speed"];
const tone = (n: number | null) => n === null ? "" : n >= 85 ? " hi" : n >= 70 ? " mid" : "";
const cleanSpec = (s: string | null | undefined) => (s ?? "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;

/** The FAQ under the section (3–4 questions, the page's FAQPage data too): every answer from the list's own rules. */
export function deepFaq(list: TopList, affiliate: boolean): { q: string; a: string }[] {
  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS), year = listYear(list);
  const yearRule = list.maxAgeYears === 0 || list.modelYearsBack !== undefined ? ` It must also be a ${year} model.` : "";
  return [
    { q: "How is this list picked?", a: `Expert reviewers shortlist the ${niche.words.many}; player reviews decide the order. Each review counts as positive, mixed or negative, and the order follows the ${scoreLabel.toLowerCase()}.` },
    { q: `What is the ${scoreLabel.toLowerCase()}?`, a: `A score out of 100 for how well reviewed a ${niche.words.one} is. Negative and mixed reviews take points off, and so does having only a few reviews. It needs at least ${MIN_SIGNAL_REVIEWS} reviews and moves as new ones come in.` },
    { q: `Why is a ${niche.words.one} missing?`, a: `To be listed a ${niche.words.one} needs at least ${min} reviews, with at least ${Math.round(MIN_POSITIVE_SHARE * 100)}% of them positive (mixed counts as half).${yearRule}${list.maxAgeYears === 0 ? " Last season's models have their own list." : ""}` },
    { q: "Do brands pay to be here?", a: affiliate ? "No. There are no sponsored placements or paid rankings. The Amazon links are affiliate links and never change the order." : "No. There are no sponsored placements or paid rankings." },
  ];
}

export default async function RankingDeep({ data, ctx, list, lists, rows, faq }: { data: Catalog; ctx: Ctx; list: TopList; lists: RankedList[]; rows: DeepInput[]; faq: { q: string; a: string }[] }) {
  const ext = new Map(data.external.map(e => [e.id, e])), own = new Set(data.reviews.map(r => r.id));
  const tagsOf = (id: string) => { const m: Record<string, number> = {}; for (const x of [...data.reviews, ...data.external]) if (x.racketId === id) for (const t of x.tags ?? []) m[t] = (m[t] ?? 0) + 1; return m; };
  const takes = await Promise.all(rows.map(x => quickTakeFor(x.r.id, x.r.slug)));
  const deep: (DeepRow & { x: DeepInput; tips: { text: string; reports: unknown[] }[] })[] = rows.map((x, i) => {
    const sc = ctx.traits(x.r.id).scores, page = pageContent(x.r.slug);
    const item = (it: { title: string; t: string; src: string[] }): DeepItem => ({ title: padelWords(it.title), t: padelWords(it.t), src: it.src });
    return { x, id: x.r.id, rank: x.rank, signal: x.sig, dots: Object.fromEntries(TRAITS.map(k => [k, sc?.[k as keyof typeof sc]?.dots ?? 0])),
      grams: gramsOf(x.r.weight), shape: x.r.shape, balance: x.r.balance, tags: tagsOf(x.r.id), reports: ctx.facts(x.r.id).reports, beginner: ctx.facts(x.r.id).suits?.beginner ?? null,
      yes: (page?.yes ?? []).map(item), no: (page?.no ?? []).map(item), tips: takes[i]?.tips ?? [] };
  });
  const picks = quickPicks(deep), byId = new Map(deep.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const shortOf = (r: Product) => withoutYear(r.name.startsWith(brand(r.brandId)) ? r.name : `${brand(r.brandId)} ${r.name}`);
  const named = (r: Product) => { const b = brand(r.brandId), s = shortOf(r); return { brand: b, model: s.replace(new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "") }; };
  const specOf = (r: Product) => ({ shape: r.shape, core: r.core, surface: r.surface, balance: r.balance, weight: r.weight });
  const season = list.modelYearsBack ? "of last season" : list.maxAgeYears === 0 ? "this season" : "on the list";

  // Where the two review lines come from: the reports behind them, by kind, a YouTube channel by name.
  const fromLine = (items: (DeepItem | undefined)[]) => {
    const ids = items.flatMap(i => i?.src ?? []).map(String);
    const reddit = new Set<string>(), yt = new Map<string, number>(); let mine = false, blog = false;
    for (const id of ids) { if (own.has(id)) { mine = true; continue; } const e = ext.get(id); if (!e) continue;
      if (e.sourcePlatform === "Reddit") reddit.add(subOf(e.sourceUrl, e.sourceName).toLowerCase());
      else if (e.sourcePlatform === "YouTube") yt.set(e.sourceName, (yt.get(e.sourceName) ?? 0) + 1);
      else if (platformName(e.sourcePlatform) === "Blog") blog = true; }
    const top = [...yt].sort((a, b) => b[1] - a[1])[0]?.[0];
    const parts = [...[...reddit].slice(0, 1), ...(mine ? [`${niche.site.name} reviews`] : []), ...(blog ? ["blogs"] : []), ...(top ? [`${top}${/s$/i.test(top) ? "'" : "'s"} video${yt.size > 1 ? " and others" : ""}`] : [])];
    const say = (ps: string[]) => ps.length ? `From ${ps.length > 1 ? `${ps.slice(0, -1).join(", ")} and ${ps.at(-1)}` : ps[0]}` : null;
    // With " · read all reviews →" after it, one line at most: "and others" goes first, then the channel's name.
    const fit = (t: string | null) => !t || t.length + " · read all reviews →".length <= DEEP_MAX;
    const shorter = parts.map(p => p.replace(/ and others$/, "")), plainer = shorter.map(p => / video$/.test(p) ? "YouTube" : p);
    return [say(parts), say(shorter), say(plainer)].find(fit) ?? null;
  };

  const usedSkips = new Set<string>();
  const blocks = deep.map((row, i) => {
    const { x } = row, prev = deep[i - 1] ?? null, next = deep[i + 1] ?? null;
    const angle = [voiceTagline(x.r.slug), pageContent(x.r.slug)?.tagline].map(t => t ? padelWords(t) : t).find(t => lineOk(t) && !against(t, row.dots)) ?? null;
    const love = loveLine(row), watch = watchLine(row);
    const skip = skipLine(row, watch?.item, usedSkips); if (skip) usedSkips.add(skip);
    const tip = tipLine(row.tips, qtPlain);
    const from = love || watch ? fromLine([love?.item, watch?.item]) : null;
    const pills = tagPills(row, tagTone);
    const feel = ctx.fineOf(x.r.id)?.feel;
    const chips = [cleanSpec(x.r.weight).replace(/\s*[–-]\s*/, " to ").replace(/(\d)\s*g\b/, "$1 g"), cleanSpec(x.r.shape), x.r.balance ? `${cleanSpec(x.r.balance)} balance` : "", feel ? `${cap(feel)} feel` : ""].filter(Boolean);
    let compared: { href: string; head: string; line: string } | null = null;
    if (next) {
      const me = x.r, nx = next.x.r, names = [named(me), named(nx)];
      // Each by its model ("the Metalbone CTRL"), two words at most; two of one brand by the word that tells them apart ("the Geo").
      const two = (m: string) => withoutYear(m).split(/\s+/).slice(0, 2).join(" ");
      const same = names[0].brand.toLowerCase() === names[1].brand.toLowerCase(), a = same ? refName(0, names) : two(names[0].model), b = same ? refName(1, names) : two(names[1].model);
      const tr = (id: string, k: string) => ctx.traits(id).scores?.[k as keyof NonNullable<ReturnType<Ctx["traits"]>["scores"]>];
      const better = (k: string, top: Product, low: Product) => claimBlock(niche.id, k, 1, { spec: specOf(top), tr: tr(top.id, k) }, { spec: specOf(low), tr: tr(low.id, k) }) === null;
      // The head, the line and "See #N" read as one line, so together they keep to the limit.
      const head = `Compared with #${next.rank} ${withoutYear(names[1].model) || withoutYear(next.x.name)}:`, see = ` See #${next.rank}`;
      const line = comparedLine(a === b ? withoutYear(x.name) : a, a === b ? withoutYear(next.x.name) : b, (k, dir) => dir > 0 ? better(k, me, nx) : better(k, nx, me),
        DEEP_MAX - head.length - see.length - 1);
      compared = line ? { href: `#rd-${next.rank}`, head, line } : null;
    }
    return { row, x, angle, why: whyLine(row, prev, deep, season), love: love?.line ?? null, watch: watch?.line ?? null, skip, tip, from, pills, chips, compared };
  });

  const seen = new Set<string>(), others = lists.filter(l => l.list.slug !== list.slug && !seen.has(l.list.slug) && seen.add(l.list.slug));
  const labels = new Set(others.map(l => l.list.label.toLowerCase()));
  const soon = [...new Set(list.deep?.soon ?? [])].filter(s => !labels.has(s.toLowerCase()));
  const photo = (id: string) => data.rackets.find(r => r.id === id);

  return <section className="rkd" aria-labelledby="rkd-h">
    <div className="rkd-head"><h2 id="rkd-h">{`Get to know the top ${rows.length}`}</h2><span>Why each one ranks where it does</span></div>

    {picks.length > 0 && <div className="rkd-picks">
      <h3>Quick picks</h3>
      <ul>{picks.map(p => { const r = byId.get(p.id)!.x; return <li key={p.label}>
        <span className="rkd-pp">{r.pic ? <img src={r.pic} alt="" loading="lazy" width={36} height={48}/> : null}</span>
        <span className="rkd-pt"><small>{p.label}</small><a href={`#rd-${r.rank}`}><b>{`#${r.rank}`}</b>{` ${withoutYear(r.name)}`}</a><span>{p.reason}</span></span>
      </li>; })}</ul>
    </div>}

    <div className="rkd-run">
    <DeepStrip items={rows.map(x => ({ rank: x.rank, pic: x.pic, sig: x.sig, name: withoutYear(x.name) }))}/>

    <ol className="rkd-blocks">{blocks.map(b => <li key={b.x.r.id} id={`rd-${b.x.rank}`} className="rkd-b" data-rank={b.x.rank}>
      <div className="rkd-top">
        <span className="rkd-rank">{b.x.rank}</span>
        <a className="rkd-pic" href={b.x.url} tabIndex={-1} aria-hidden="true">{b.x.pic ? <img src={b.x.pic} alt="" loading="lazy"/> : <span>{brand(b.x.r.brandId)}</span>}</a>
        <div className="rkd-id"><a className="rkd-name" href={b.x.url}>{b.x.name}</a>{b.angle && <span className="rkd-angle">{b.angle}</span>}</div>
        <span className={`rkd-sc${tone(b.x.sig)}`}><b>{b.x.sig ?? "–"}</b><small>{scoreLabel.toLowerCase()}</small></span>
      </div>
      {b.why && <p className="rkd-why"><b>{`Why it's #${b.x.rank} here:`}</b>{` ${b.why}`}</p>}
      <div className="rkd-bars">{DEEP_BARS.map(([k, label]) => { const n = b.row.dots[k] ?? 0; return n ? <div key={k}>
        <span className="rkd-bh"><b>{label}</b><span>{`${n}/5`}</span></span>
        <span className="rkd-segs" aria-label={`${label}: ${n} of 5`}>{[1, 2, 3, 4, 5].map(s => <i key={s} className={s <= n ? `on t${n}` : undefined}/>)}</span>
      </div> : null; })}</div>
      {b.pills.length > 0 && <div className="rkd-pills">{b.pills.map(p => <span key={p.tag} className={`rkd-pill ${p.tone}`}>{p.tag}<i>{p.n}</i></span>)}</div>}
      {b.skip && <p className="rkd-skip"><i aria-hidden="true"/><span><b>Skip it if</b>{b.skip.replace(/^Skip it if/, "")}</span></p>}
      {(b.love || b.watch) && <div className="rkd-said">
        {b.love && <p className="love"><i aria-hidden="true"/><span><b>What people love:</b>{` ${b.love}`}</span></p>}
        {b.watch && <p className="watch"><i aria-hidden="true"/><span><b>What to watch:</b>{` ${b.watch}`}</span></p>}
        <p className="rkd-from">{b.from ? `${b.from} · ` : ""}<a href={`${b.x.url}#reviews`}>read all reviews →</a></p>
      </div>}
      {b.tip && <p className="rkd-tip"><Bulb/><span><b>Player tip:</b>{` ${b.tip}`}</span></p>}
      <div className="rkd-foot">
        <span className="rkd-chips">{b.chips.map(c => <span key={c}>{c}</span>)}</span>
        <span className="rkd-links">{b.x.shop && <a href={b.x.shop.url} target="_blank" rel={b.x.shop.rel}>check price ↗</a>}<a className="full" href={b.x.url}>Full review</a></span>
      </div>
      {b.compared && <p className="rkd-cmp"><b>{b.compared.head}</b>{` ${b.compared.line} `}<a href={b.compared.href}>{`See #${b.x.rank + 1}`}</a></p>}
    </li>)}</ol>
    </div>

    <section className="rkd-how" aria-labelledby="rkd-how-h">
      <h2 id="rkd-how-h">How this list was picked</h2>
      <p>{`Expert reviewers shortlist the ${niche.words.many}; player reviews decide the order.`}</p>
      <ol className="rkd-steps">
        <li><b>Expert picks</b><span>{`${cap(niche.words.many)} top reviewers rate highly`}</span></li>
        <li><b>Player reviews</b><span>{`${niche.site.name}, Reddit and YouTube`}</span></li>
        <li><b>{cap(scoreLabel.toLowerCase())}</b><span>Liked, mixed or not, and how many</span></li>
        <li className="end"><b>{`Top ${rows.length}`}</b><span>{`The highest ${scoreLabel.toLowerCase()}s`}</span></li>
      </ol>
    </section>

    <section className="rl2-faq rk3-faq rkd-faq" id="how-we-rank"><h2>Questions</h2>
      <div className="box">{faq.map(f => <details key={f.q}><summary>{f.q}<i aria-hidden="true"/></summary><p>{f.a}</p></details>)}</div></section>

    <section className="rkd-rel" aria-labelledby="rkd-rel-h">
      <div className="rkd-relh"><h2 id="rkd-rel-h">Related lists</h2><a href={RANKINGS_PATH}>All rankings</a></div>
      <ul>
        {others.map(l => { const top = l.entries[0], r = top ? photo(top.product.id) : undefined, pic = r ? photoOf(r) : null;
          return <li key={l.list.slug}><a href={listHref(l.list.slug)}>
            <span className="rkd-rp">{pic ? <img src={pic} alt="" loading="lazy"/> : null}</span>
            <span><b>{l.list.label}</b>{r && <small>{`#1 ${withoutYear(shortOf(r))}`}</small>}</span></a></li>; })}
        {soon.map(s => <li key={s} className="soon"><span><b>{s}</b><small>Coming soon</small></span></li>)}
      </ul>
    </section>
  </section>;
}

/** The player tip's marker: a small lightbulb in the site's line-icon style (1.5 stroke, round caps). */
function Bulb() {
  return <svg className="rkd-bulb" viewBox="0 0 20 20" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.8a5 5 0 0 0-3 9c.6.5 1 1.2 1 2v.7h4v-.7c0-.8.4-1.5 1-2a5 5 0 0 0-3-9Z"/><path d="M8.2 17h3.6"/></g></svg>;
}
