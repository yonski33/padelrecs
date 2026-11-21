// PadelRecs compare page v3 (owner mock "Compare", 2026-11-21). Padel only; ?look=classic keeps the older page. No score
// anywhere: the title card with the opinion count, "Which one fits you?" (the site's shared picks; it highlights the best fit
// and never reorders), up to three cards (photo, type and feel pills, the "Most picked for" pill, the sentiment bar and
// counts, See reviews, check price), the TL;DR, today's "Why yes, why not", "Who wins what" from the racket pages' "How does
// it play?" votes, today's "Where they differ", "What players say" and the basics. All counts are real; a vote line shows
// only with 5+ players behind it and 10+ in its group (the home's Top picks rule).
import "../thread/thread.css";
import "../thread/sr-colors.css";
import "../thread/tn-colors.css";
import { Shell } from "../thread/shell";
import { threadRows, threadFeed, traitCounts, traitGroup } from "../thread/data";
import { ago } from "../thread/ui";
import { th } from "../../lib/thread/look";
import { oneShape } from "../../lib/thread/shape";
import { differRows } from "../../lib/compare-verdict";
import { comparePairs, pairHref } from "../../lib/compare-pairs";
import { displayName, withoutYear } from "../../lib/brand-name";
import { avatarOf } from "../../lib/thread/avatar";
import { compareParts, TRAITS } from "./compare-v2";
import { CompareAdd } from "./compare-add";
import { FitBar, Cards, type V3Card } from "./compare-v3-live";
import type { Data } from "./view";
import { niche, catalogPath, hasYears } from "../../lib/niche";
import { W } from "../../lib/thread/words";
import { votePill, AUDIO_PILL_LABELS, SIMRACING_PILL_WORDS, SIMRACING_PILL_LABELS, DISCGOLF_PILL_LABELS } from "../../lib/thread/vote-pill";
import { TRAIT_GROUPS, traitGroupsForType } from "../../lib/thread/traits";

const FONTS = ["https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Atkinson+Hyperlegible:wght@400;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&text=0123456789&display=swap"];
/** Each racket's colour (pills, dots), in card order. */
const TINT = ["#DCE8FB", niche.id === "simracing" ? "oklch(0.92 0.07 30)" : niche.id === "tennis" ? "oklch(0.92 0.05 45)" : "#E3F6B5", "#FBE0D2"], DOT = ["#5B8DEF", "#6DBE45", "#EF8A5B"];
const PLAYS: Record<string, string> = { control: "control", all_round: "all-round play", power: "power" };
/** "Who wins what": the label, the vote group and option, and what those players say. */
const WIN: [string, string, string, string][] = [["Most power", "plays_like", "power", "say power"], ["Most control", "plays_like", "control", "say control"],
  ["Biggest sweet spot", "sweet_spot", "big", "say big"], ["Softest feel", "feel", "soft", "say soft"], ["Easiest on the arm", "arm", "very", "say very arm friendly"],
  ["Most maneuverable", "maneuver", "very", "say very maneuverable"], ["Best for beginners", "level", "beginner", "say beginner"],
  ["Best for advanced", "level", "advanced", "say advanced"]];
const OPT: Record<string, [string, string][]> = {
  plays_like: [["control", "Control"], ["all_round", "All-round"], ["power", "Power"]], sweet_spot: [["big", "Big"], ["medium", "Medium"], ["small", "Small"]],
  // The site's own Feel words (TennisRecs says "Crisp"; padel and pickleball "Hard").
  feel: TRAIT_GROUPS.find(g => g.key === "feel")?.options ?? [["soft", "Soft"], ["medium", "Medium"], ["hard", "Hard"]], arm: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]],
  maneuver: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]], level: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] };
/** AudioRecs (V3-ROLLOUT-BRIEF): "Who wins what" from its own vote groups, its quality-first pills, its words; no fit bar
 *  (its quick match lives on the home, catalogue, product and ranking pages). */
const AUDIO = niche.id === "audio";
const AUDIO_WIN: [string, string, string, string][] = [["Best noise cancelling", "anc", "excellent", "say excellent"], ["Most comfortable", "comfort", "all_day", "say all day"],
  ["Most detailed", "detail", "lots", "say lots of detail"], ["Widest soundstage", "soundstage", "wide", "say wide"], ["Best battery", "battery", "lasts_days", "say it lasts days"],
  ["Clearest calls", "calls", "clear", "say clear"], ["Best value", "value", "worth_it", "say worth it"]];
const AUDIO_OPT: Record<string, [string, string][]> = Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, g.options]));
/** SimRacingRecs (v3 rollout 2026-11-21): "Who wins what" from its gear-type groups (a row shows only where 10+ voted), its
 *  pills from each product's own type, its fit bar in level and budget words. */
const SR = niche.id === "simracing", DG = niche.id === "discgolf";
/** PickleballRecs (wave 2): padel's rows with Most spin in place of Most maneuverable (it has no Maneuverable group). */
const PB = niche.id === "pickleball";
const PB_WIN: [string, string, string, string][] = WIN.map(w => w[1] === "maneuver" ? ["Most spin", "spin", "lots", "say lots of spin"] : w);
/** DiscGolfRecs' "Who wins what", from its "How does it fly?" groups. */
const DG_WIN: [string, string, string, string][] = [["Flies straightest", "stability", "stable", "say stable"], ["Most glide", "glide", "lots", "say lots of glide"],
  ["Best in the wind", "wind", "holds", "say it holds"], ["Easiest for slower arms", "arm_speed", "any", "say any arm"], ["Best grip", "grip", "great", "say great grip"],
  ["Best for beginners", "level", "beginner", "say beginner"]];
const SR_WIN: [string, string, string, string][] = [["Most detailed feedback", "detail", "sharp", "say sharp detail"], ["Most torque", "torque", "plenty", "say plenty of torque"],
  ["Best brake feel", "brake_feel", "realistic", "say realistic"], ["Least flex", "flex", "none", "say no flex"], ["Quietest", "noise", "quiet", "say quiet"],
  ["Easiest software", "software", "easy", "say easy"], ["Best for beginners", "level", "beginner", "say beginner"], ["Best for advanced", "level", "advanced", "say advanced"]];
const total = (g: Record<string, number>) => Object.values(g).reduce((a, b) => a + b, 0);
const hrefFor = (slugs: string[]) => slugs.length ? `/compare?ids=${slugs.map(encodeURIComponent).join(",")}` : "/compare";

export async function CompareV3({ data, products }: { data: Data; products: Data["rackets"] }) {
  const [{ rows, all }, t, feed, parts] = await Promise.all([threadRows(), traitCounts(), threadFeed(), compareParts(data, products)]);
  const { cprods, specDefs, slugs, brandOf } = parts;
  const shorts = cprods.map(c => c.short);
  const cards: V3Card[] = products.map((r, i) => {
    const row = rows.get(r.id), plays = traitGroup(t, r.id, "plays_like"), top = Object.entries(plays).filter(([k]) => PLAYS[k]).sort((a, b) => b[1] - a[1])[0];
    return { id: r.id, name: hasYears ? withoutYear(displayName(r.name, brandOf(r))) : displayName(r.name, brandOf(r)), short: shorts[i], href: th(row?.href ?? cprods[i].href), pic: row?.pic ?? cprods[i].pic,
      shape: oneShape(r.shape) ? r.shape![0].toUpperCase() + r.shape!.slice(1) : null, feel: row?.feel ?? null,
      picked: DG ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(t, r.id, g.key)])), W.people, DISCGOLF_PILL_LABELS, DISCGOLF_PILL_LABELS)
        : SR ? votePill(Object.fromEntries(traitGroupsForType(niche.id, r.shape, r.id).map(g => [g.key, traitGroup(t, r.id, g.key)])), W.people, SIMRACING_PILL_WORDS, SIMRACING_PILL_LABELS)
        : AUDIO ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(t, r.id, g.key)])), W.people, AUDIO_PILL_LABELS, AUDIO_PILL_LABELS)
        : top && top[1] >= 5 && total(plays) >= 10 ? `Most picked for ${PLAYS[top[0]]} · ${top[1]} players` : null,
      ...(AUDIO && row?.audio?.kind ? { shape: row.audio.kind, feel: null } : {}), ...(SR ? { feel: null } : {}), ...(DG ? { feel: null } : {}),
      pos: row?.pos ?? 0, mix: row?.mix ?? 0, neg: row?.neg ?? 0, shop: cprods[i].shop, tint: TINT[i], dot: DOT[i],
      remove: products.length > 1 ? hrefFor(slugs.filter(s => s !== r.slug)) : "/compare" };
  });
  const opinions = cards.reduce((a, c) => a + c.pos + c.mix + c.neg, 0);

  // Who wins what: the highest share for that option, from groups with 10+ in them, a winner with 5+ players and no tie.
  const winners = (AUDIO ? AUDIO_WIN : SR ? SR_WIN : PB ? PB_WIN : DG ? DG_WIN : WIN).flatMap(([label, trait, opt, verb]) => {
    const sc = cards.map((c, i) => { const g = traitGroup(t, c.id, trait), tot = total(g), hit = g[opt] ?? 0; return { i, g, tot, hit, sh: tot >= 10 ? hit / tot : 0 }; });
    const ranked = [...sc].sort((a, b) => b.sh - a.sh), w = ranked[0];
    if (cards.length < 2 || !w || w.hit < 5 || w.tot < 10 || (ranked[1] && ranked[1].sh === w.sh)) return [];
    return [{ label, win: w.i, why: `${w.hit} of ${w.tot} ${W.people} ${verb}`, rows: sc.map(s => ({ i: s.i, tot: s.tot, opts: (AUDIO || SR || PB || DG ? AUDIO_OPT : OPT)[trait].map(([k, l]) => ({ l, n: s.g[k] ?? 0, on: k === opt })) })) }];
  });
  const diffs = cards.length > 1 ? differRows(cprods, TRAITS) : [];
  // What players say: each racket's newest member review of a readable length.
  const quotes = cards.flatMap((c, i) => { const q = feed.find(f => f.racketId === c.id && f.kind === "player" && f.text.length >= 40 && f.text.length <= 280)
    ?? feed.find(f => f.racketId === c.id && f.kind === "player" && f.text.length >= 40);
    if (!q) return []; const a = avatarOf(q.who);
    return [{ i, who: q.who, init: a.init, bg: a.bg, when: ago(q.date), info: q.info ?? null, text: q.text.length > 280 ? `${q.text.slice(0, 277).replace(/\s+\S*$/, "")}…` : q.text }]; });
  // The empty slot's picks: the most talked-about current rackets not in the comparison.
  const add = [...all].filter(x => x.current !== false && !slugs.includes(x.slug)).sort((a, b) => b.n - a.n).slice(0, 3).map(x => ({ name: x.name, href: hrefFor([...slugs, x.slug]) }));
  const { partners } = comparePairs(data);
  const nameOf = (r: Data["rackets"][number]) => displayName(r.name, brandOf(r));
  const more = products.flatMap(r => (partners.get(r.id) ?? []).filter(x => !(products.length === 2 && products.includes(x))).map(x => ({ r, x })))
    .filter((v, i, xs) => xs.findIndex(o => pairHref(o.r.slug, o.x.slug) === pairHref(v.r.slug, v.x.slug)) === i).slice(0, 6);
  const n = cards.length, cols = { "--n": n } as React.CSSProperties;
  const name = (i: number) => <><i className="dot" style={{ background: cards[i].dot }} aria-hidden="true"/><strong>{cards[i].short}</strong></>;

  return <>
    {[...FONTS, ...(AUDIO ? ["https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@600;700&display=swap"] : [])].map(href => <link key={href} rel="stylesheet" href={href} precedence="default"/>)}
    <Shell active="rackets">
      <main className="th-main cp3">
        <div className="th-crumbs"><a href={th(catalogPath)}>{AUDIO ? "Headphones" : SR ? "Products" : PB ? "Paddles" : DG ? "Discs" : "Rackets"}</a><span>/</span><span>Compare</span></div>
        <section className="th-card cp3-top">
          <div className="cp3-title"><span><h1 className="th-h1">{`Compare ${W.items}`}</h1>
            <small>{n ? `Side by side, from ${opinions.toLocaleString("en-US")} ${W.person} opinions.` : AUDIO ? "Pick up to three pairs to see them side by side." : SR ? "Pick up to three products to see them side by side." : PB ? "Pick up to three paddles to see them side by side." : DG ? "Pick up to three discs to see them side by side." : "Pick up to three rackets to see them side by side."}</small></span>
            <span className="cp3-count">{AUDIO ? `${n} of 3` : SR ? `${n} of 3 products` : PB ? `${n} of 3 paddles` : DG ? `${n} of 3 discs` : `${n} of 3 rackets`}</span></div>
          {n > 0 && !AUDIO && <FitBar {...(SR ? { hint: "Pick your level and budget. The best fit gets highlighted below.", arm: "I race on console" } : DG ? { arm: "Slower arm" } : {})}/>}
          <Cards cards={cards} add={n < 3 ? <div className="cp3-add">
            <b>{AUDIO ? "+ Add a pair" : SR ? "+ Add a product" : PB ? "+ Add a paddle" : DG ? "+ Add a disc" : "+ Add a racket"}</b>
            <CompareAdd slugs={slugs} label={`Search ${W.items}`}/>
            {add.map(a => <a key={a.href} href={a.href}>{a.name}</a>)}
          </div> : null}/>
        </section>

        {n > 0 && cards.some(c => rows.get(c.id)?.line) && <section className="cp3-tldr"><h2>TL;DR</h2>
          {cards.map((c, i) => rows.get(c.id)?.line && <p key={c.id}><i className="dot" style={{ background: c.dot }} aria-hidden="true"/>
            <span><strong>{c.name}</strong>{` ${rows.get(c.id)!.line}`}</span></p>)}
        </section>}

        {n > 1 && cprods.some(p => p.yes.length || p.no) && <section className="th-card cp3-sec"><h2 className="th-h2">Why yes, why not</h2>
          <div className="cp3-yn" style={cols}>{cprods.map((p, i) => <div key={p.id}>
            <span className="who">{name(i)}</span>
            {p.yes.map((y, k) => <span key={k} className="yes"><i aria-hidden="true">✓</i>{y}</span>)}
            {p.no && <span className="no"><i aria-hidden="true">!</i>{p.no}</span>}
          </div>)}</div>
        </section>}

        {winners.length > 0 && <section className="th-card cp3-sec"><h2 className="th-h2">Who wins what</h2><small className="sub">{`Based on ${W.person} votes.`}</small>
          {winners.map(w => <details key={w.label} className="cp3-win">
            <summary><span className="lbl">{w.label}</span><span className="res">{name(w.win)}<small>{w.why}</small></span><span className="caret" aria-hidden="true"/></summary>
            <div className="det"><small>{`All votes for "${w.label.toLowerCase()}"`}</small>
              {w.rows.map(r => <div key={r.i} className="r"><span className="nm">{name(r.i)}{r.i === w.win && <em>Winner</em>}</span>
                <span className="bars">{r.opts.map(o => <span key={o.l} className={o.on ? "on" : undefined}><span><span>{o.l}</span><span>{o.n}</span></span>
                  <span className="b"><i style={{ width: r.tot ? `${Math.round(o.n / r.tot * 100)}%` : "0" }}/></span></span>)}</span>
                <span className="tot">{`${r.tot} votes`}</span></div>)}
            </div>
          </details>)}
        </section>}

        {diffs.length > 0 && <section className="th-card cp3-sec"><h2 className="th-h2">Where they differ</h2>
          <div className="cp3-diffs">{diffs.map(d => { const i = cards.findIndex(c => c.id === d.id); return <div key={d.label}><span>{d.label}</span><span>{name(i)}</span></div>; })}</div>
        </section>}

        {quotes.length > 0 && <section className="th-card cp3-sec"><h2 className="th-h2">{`What ${W.people} say`}</h2>
          <div className="cp3-quotes" style={cols}>{quotes.map(q => <div key={q.i}>
            <span className="pill" style={{ background: cards[q.i].tint }}>{cards[q.i].short}</span>
            <p>{`"${q.text}"`}</p>
            <span className="by"><span className="av" style={{ background: q.bg }} aria-hidden="true">{q.init}</span><span><strong>{q.who}</strong>{` · ${q.info ? `${q.info} · ` : ""}${q.when}`}</span></span>
          </div>)}</div>
        </section>}

        {n > 0 && specDefs.length > 0 && <section className="th-card cp3-sec cp3-basics"><h2 className="th-h2">The basics</h2>
          <div className="scroll"><div className="grid" style={cols}>
            <div className="r head"><span/>{cards.map((c, i) => <span key={c.id}>{name(i)}</span>)}</div>
            {specDefs.map((d, k) => <div key={d.label} className="r"><span className="k">{d.label[0].toUpperCase() + d.label.slice(1)}</span>
              {cprods.map(p => <strong key={p.id}>{p.specs[k] ?? "Not listed"}</strong>)}</div>)}
          </div></div>
        </section>}

        {more.length > 0 && <section className="th-card cp3-sec"><h2 className="th-h2">More comparisons</h2>
          <div className="cp3-more">{more.map(({ r, x }) => <a key={pairHref(r.slug, x.slug)} href={pairHref(r.slug, x.slug)}>{nameOf(r)} <i>vs</i> {nameOf(x)}</a>)}</div>
        </section>}
      </main>
    </Shell>
  </>;
}
