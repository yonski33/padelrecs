import type { ReactNode } from "react";
import "./quick-take.css";
import { COURT_ROWS, chipRank, chipTone, decisiveRows, distinctPlayers, evidenceLabel, levelBand, monthYear, roundedDown, sentimentWords, sourcePills, spans, MODULE_TITLES, type Chip, type Module, type QuickTake, type Verdict } from "../../../lib/quick-take";
import { phraseSegments } from "../../../lib/highlights";
import { platformName } from "../../../lib/source-label";
import QuickTakeComposer, { QuickVoteLine } from "./quick-take-composer";

/** The quick-take racket page (owner 2026-11-15; site-jobs/QUICK-TAKE-RECIPE.md, mockups in site-jobs/quick-take-mockups/),
 *  in design language v2 (the Claude Design reference): cream, ink borders, numbered sections, an "// on this page" index.
 *  Everything editorial comes from the stored block; the counts, dates, score, sources and community reviews are live. */

export type QtReport = { id: string; platform: string; sourceName: string | null; url: string | null; date: string | null; sentiment: string | null; nickname?: string | null; level?: string | null };
export type QtReview = { id: string; alias: string | null; playerLevel: string | null; createdAt: string; rating: number; reviewText: string; tags: string[]; highlights: string[] | null };
export type QtProduct = { slug: string; name: string; href: string; photo: string | null };

/** **bold** and ==marker== text. */
function Rich({ text }: { text: string }) {
  return <>{spans(text).map((s, i) => s.mark ? <mark key={i}>{s.text}</mark> : s.b ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>)}</>;
}
const Bullets = ({ items }: { items: string[] }) => <ul>{items.map((t, i) => <li key={i}><Rich text={t}/></li>)}</ul>;
const chipClass = (c: Chip) => `chip ${chipTone(c)}`;
const VChip = ({ v }: { v?: Verdict }) => v ? <span className={`hchip ${v.tone}`}>{v.text}</span> : null;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const verdictOf = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
const VERDICT_WORD = { positive: "Positive", mixed: "Mixed", negative: "Negative" } as const;
const listWords = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "";

/** The page, top to bottom (owner 2026-11-15: sections move often, so the order is this one list). Sections that have
 *  nothing to show are skipped, and the rest are numbered 01, 02… in this order. */
export const PAGE_ORDER = ["tldr", "plays", "themes", "version", "catch", "compare", "setup", "beforeYouBuy", "headsUp", "answers", "community", "spot"] as const;
export type SectionKey = typeof PAGE_ORDER[number];
/** Trial (owner 2026-11-15): a one-line "Played it?" vote under the TL;DR, on these pages only. */
const QUICK_VOTE_LINE = new Set(["siux-electra-pro-st4-2025"]);

type Props = {
  qt: QuickTake; racketId: string; slug: string; name: string; shortName: string; year: number; shape: string | null; photo: string | null;
  crumbs: ReactNode; reports: QtReport[]; reviews: QtReview[]; signal: number | null; site: string;
  products: Map<string, QtProduct>; heroSpecs: string[]; buy: { url: string; label: string; rel: string } | null;
  fontClass: string; tags: string[]; nicknames: string[]; rest: ReactNode; jsonLd: object;
};
/** What every section reads: the props plus the live counts and helpers worked out once. */
type Ctx = Props & {
  total: number; pos: number; mix: number; neg: number; pills: string[]; from?: string; to?: string;
  receipts: (list?: { id: string; text: string; verbatim?: boolean }[]) => ReactNode; who: (id: string) => string | null;
  evidence: (ids: readonly string[]) => ReactNode;
  art: (slug: string | null, tile: string, cls: string) => ReactNode; module: <T extends Module["type"]>(t: T) => Extract<Module, { type: T }> | undefined;
};

export default function QuickTakePage(props: Props) {
  const { qt, reports, reviews } = props;
  const count = (k: string) => reports.filter(r => r.sentiment === k).length;
  const dates = reports.map(r => r.date).filter((d): d is string => !!d).sort();
  const byId = new Map(reports.map(r => [r.id, r]));
  const who = (id: string) => { const r = byId.get(id); if (!r) return null;
    if (r.platform === props.site) return [r.nickname || `A ${props.site} player`, r.level].filter(Boolean).join(" · ");
    return [platformName(r.platform), r.sourceName && r.sourceName !== r.platform ? r.sourceName : null].filter(Boolean).join(" · "); };
  const ctx: Ctx = {
    ...props, total: reports.length, pos: count("positive"), mix: count("mixed"), neg: count("negative"), from: dates[0], to: dates[dates.length - 1],
    pills: sourcePills(reports.filter(r => r.platform !== props.site).map(r => r.platform), reviews.length, props.site), who,
    evidence: ids => { const l = evidenceLabel(distinctPlayers(ids, id => byId.get(id)?.url)); return l && <small className="ev">{l}</small>; },
    receipts: list => {
      const shown = (list ?? []).filter(x => byId.has(x.id));
      if (!shown.length) return null;
      return <details className="show"><summary>show me what players said</summary><ul className="snips">{shown.map(x => {
        const r = byId.get(x.id)!;
        return <li key={x.id}>{x.verbatim ? `“${x.text}”` : x.text}<small>{[who(x.id), r.date ? monthYear(r.date) : null].filter(Boolean).join(" · ")}{r.url && <> · <a href={r.url} target="_blank" rel="noopener noreferrer nofollow">original</a></>}</small></li>;
      })}</ul></details>;
    },
    art: (slug, tile, cls) => { const p = slug ? props.products.get(slug) : undefined;
      return p?.photo ? <img className={cls} src={p.photo} alt="" loading="lazy"/> : <span className={`${cls} none`}>{tile}</span>; },
    module: t => qt.modules.find(m => m.type === t) as never,
  };
  const shown = PAGE_ORDER.filter(k => SECTIONS[k].show(ctx));
  const toc = shown.filter(k => k !== "spot").map((k, i) => ({ k, n: String(i + 1).padStart(2, "0"), label: SECTIONS[k].toc(ctx) }));
  return <main className={`qt ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="qt-strip">a free, ad-light side project · built by padel players · <a href="#how-we-read">how we make these →</a></div>
    <div className="wrap">
      {props.crumbs}
      <Hero c={ctx}/>
      <div className="qt-body">
        <aside className="toc" aria-label="On this page"><p>{"// on this page"}</p>
          <nav>{toc.map(t => <a key={t.k} href={`#${SECTIONS[t.k].id}`}><span>{t.n}</span>{t.label}</a>)}</nav></aside>
        <article className="col">{shown.map(k => { const S = SECTIONS[k], n = toc.find(t => t.k === k)?.n;
          return <section key={k} id={S.id} className={`sec sec-${k}`}>
            {S.title && <h2>{n && <span className="num">{n}</span>}<span className="ttl">{S.title(ctx)}</span><VChip v={S.verdict?.(ctx)}/></h2>}
            <S.Body c={ctx}/>
          </section>; })}</article>
      </div>
      <Footer c={ctx}/>
    </div>
    {props.rest && <div className="qt-rest">{props.rest}</div>}
  </main>;
}

function Hero({ c }: { c: Ctx }) {
  const { qt } = c;
  return <section className="hero">
    <div className="hero-txt">
      <div className="pills">{[c.shape, String(c.year), ...c.heroSpecs].filter(Boolean).map(x => <span key={x} className="mpill">{x!.toLowerCase()}</span>)}</div>
      <h1 className="name">{`${c.shortName} review`}</h1>
      <p className="hook">{qt.hook.good} <mark>{qt.hook.catch}</mark></p>
      <p className="intro">We read <mark>{`${roundedDown(c.total)}+ player reports`}</mark> so you don't have to. Here's what they told us.</p>
      <p className="byline">Compiled by the {c.site} crew · last edit {day(qt.written)} · <a href="/contact">suggest a fix</a></p>
      <div className="cta">
        {c.buy && <a className="btn ink" href={c.buy.url} target="_blank" rel={c.buy.rel}>{c.buy.label} ↗</a>}
        <a className="btn ghost" href="#tldr">tl;dr ↓</a>
      </div>
      {c.buy && <p className="aff">* affiliate link — it keeps the site running, doesn't change our take</p>}
      <div className="read">
        {c.pills.map(p => <span key={p} className="src-pill">{p}</span>)}
        {c.from && c.to && <span>reports from <b>{`${monthYear(c.from)} to ${monthYear(c.to)}`}</b></span>}
      </div>
      <details className="howread" id="how-we-read"><summary>how we read this</summary><p>
        {"We read "}<b>{`${c.total} reports from ${listWords(c.pills)}${c.from && c.to ? `, ${monthYear(c.from, true)} to ${monthYear(c.to, true)}` : ""}`}</b>
        {". Each one was sorted as positive, mixed or negative, then by what it talks about. Every main claim has at least 3 players behind it, and quote marks only go on their actual words. We don't test rackets and no brand paid us. "}
        {c.signal !== null && <>{"The "}<b>{`Player score (${c.signal})`}</b>{" blends how much players like it with how many of them have weighed in, compared with every other racket we track. So a racket everyone talks about can score high even when opinions are split. "}</>}
        <b>Thin spot:</b> <Rich text={qt.thinSpot}/>
      </p></details>
    </div>
    <div className="hero-pic">
      <div className="shot">{c.photo ? <img src={c.photo} alt={c.name}/> : <span className="tile">{c.shortName}</span>}</div>
      {c.signal !== null && <div className="ps"><b>{c.signal}</b><span className="ps-label" tabIndex={0} aria-describedby="ps-note">player score <span aria-hidden="true">ⓘ</span>
        <span className="ps-note" id="ps-note" role="tooltip">Not a % of happy players. It blends how much players like it with how many have weighed in.</span></span></div>}
    </div>
  </section>;
}

/** A section: whether it shows, its index label, its heading and its body. The heading gets the running number. */
type Sec = { id: string; show: (c: Ctx) => boolean; toc: (c: Ctx) => string; title?: (c: Ctx) => ReactNode; verdict?: (c: Ctx) => Verdict | undefined; Body: (p: { c: Ctx }) => ReactNode };

function Tally({ c }: { c: Ctx }) {
  const words = sentimentWords(c.pos, c.mix, c.neg), judged = c.pos + c.mix + c.neg;
  if (!words || !judged) return null;
  const rows = [["liked it", c.pos, "pos"], ["mixed", c.mix, "mix"], ["not for them", c.neg, "neg"]] as const;
  return <div className="tally" role="img" aria-label={[words.lead, ...words.rest.map(x => x.words)].join(", ")}>
    <p>{`what ${judged} players said · `}<b>{words.lead.toLowerCase()}</b></p>
    {rows.map(([label, n, k]) => <div key={k} className="trow"><span>{label}</span><span className="tbar"><i className={k} style={{ width: `${n / judged * 100}%` }}/></span><span>{n}</span></div>)}
  </div>;
}

const TldrBody = ({ c }: { c: Ctx }) => <>
  <p className="verdict"><Rich text={c.qt.tldr.lead}/></p>
  <div className="getskip">
    <div className="gs yes"><h3>👍 Get it if you…</h3><Bullets items={c.qt.tldr.madeFor}/></div>
    <div className="gs no"><h3>👎 Skip it if you…</h3><Bullets items={c.qt.tldr.notFor}/></div>
  </div>
  <Tally c={c}/>
  {c.qt.level && <Level level={c.qt.level}/>}
  {QUICK_VOTE_LINE.has(c.slug) && <QuickVoteLine racketId={c.racketId} name={c.shortName}/>}
</>;

function PlaysBody({ c }: { c: Ctx }) {
  const p = c.qt.plays!, hardness = c.module("hardness");
  // Rows the court map covers are left out; the rest go strongest chip first (owner 2026-11-15).
  const rows = (p.court ? p.rows.filter(r => !COURT_ROWS.test(r.label)) : p.rows).map((r, i) => ({ r, i })).sort((a, b) => chipRank(a.r.chip) - chipRank(b.r.chip) || a.i - b.i).map(x => x.r);
  return <>
    <p className="lead"><Rich text={p.lead}/></p>
    {p.court && <Court court={p.court}/>}
    {rows.length > 0 && <PlayRows rows={rows}/>}
    {hardness && <Hardness m={hardness}/>}
  </>;
}

/** The 3 most decisive rows (strongest, most divided, weakest), then "+ show all N" for the rest (owner 2026-11-15). */
function PlayRows({ rows }: { rows: NonNullable<QuickTake["plays"]>["rows"] }) {
  const top = decisiveRows(rows), rest = rows.filter(r => !top.includes(r));
  const Row = ({ r }: { r: typeof rows[number] }) => <div className="r"><div className="rl"><b>{r.label}</b><span className={chipClass(r.chip)}>{r.chip.toLowerCase()}</span></div>
    <p>{r.key && r.line.startsWith(r.key) ? <><strong>{r.key}</strong><Rich text={r.line.slice(r.key.length)}/></> : <Rich text={r.line}/>}</p></div>;
  return <div className="rows play">{top.map(r => <Row key={r.label} r={r}/>)}
    {rest.length > 0 && <details className="more-rows"><summary>{`+ show all ${rows.length}`}</summary>{rest.map(r => <Row key={r.label} r={r}/>)}</details>}</div>;
}

/** "The <topic> debate 🔥" (design v2): the disagreement, then one take it worked for and one it didn't. */
function CatchBody({ c }: { c: Ctx }) {
  const k = c.qt.catch, d = k.debate;
  const Take = ({ t, ok }: { t: { id: string; text: string; verbatim?: boolean }; ok: boolean }) => <div className={`take-card ${ok ? "ok" : "nope"}`}>
    <p className="who">{c.who(t.id)}</p><p className="said">{t.verbatim ? `“${t.text}”` : t.text}</p><p className="side">{ok ? "✓ worked for me" : "✗ not for me"}</p></div>;
  return <>
    <p className="lead"><Rich text={k.lead}/></p>
    <Bullets items={k.bullets}/>
    <div className="from">{c.evidence(k.reports)}{k.what && <span>{`reports ${k.what}`}</span>}</div>
    {d && <div className="takes"><Take t={d.for} ok/><Take t={d.against} ok={false}/></div>}
    {c.receipts(k.receipts)}
  </>;
}

function CompareBody({ c }: { c: Ctx }) {
  const cmp = c.qt.compare!;
  return <>
    <p className="lead"><Rich text={cmp.lead}/></p>
    <div className="vsgrid">{cmp.cards.map(card => {
      const p = c.products.get(card.slug), n = new Set(card.reports).size;
      return <div key={card.slug} className="vscard">{c.art(card.slug, card.tile || card.name.split(" ").slice(-1)[0], "vsimg")}
        <div><h3>{p ? <a href={p.href}>{`vs ${card.name}`}</a> : `vs ${card.name}`}</h3><small>{`from ${n} ${n === 1 ? "player" : "players"}`}</small></div>
        <p className="take">{card.takeaway}</p>
        <div className="arrows">{card.arrows.map((a, i) => <span key={i} className={`ar${a.dir === "up" ? " up" : a.dir === "down" ? " dn" : ""}`}>{`${a.dir === "up" ? "↑ " : a.dir === "down" ? "↓ " : a.dir === "same" ? "= " : ""}${a.text}`}</span>)}</div>
      </div>;
    })}</div>
    {cmp.went && <p className="went"><b>{cmp.went.label}</b> <Rich text={cmp.went.text}/></p>}
  </>;
}

/** "Before you buy" (owner 2026-11-15): weight, durability and arm as stacked cards under one heading. */
function BybBody({ c }: { c: Ctx }) {
  const cards = (["weigh", "durability", "arm"] as const).map(t => c.module(t)).filter((m): m is Extract<Module, { type: "weigh" | "durability" | "arm" }> => !!m);
  return <div className="byb">{cards.map(m => <div key={m.type} className="byb-card" id={m.type}>
    <h3>{CARD_TITLES[m.type]}{"verdict" in m && <VChip v={m.verdict}/>}</h3>
    {c.evidence(m.type === "weigh" ? m.weights.map(w => w.id) : m.reports)}
    <ModuleBody m={m} c={c}/>
  </div>)}</div>;
}

/** "Heads up ⚠️" (design v2): the practical tips, numbered, each with how many players it comes from. */
const HeadsUpBody = ({ c }: { c: Ctx }) => <ol className="heads">{c.qt.tips.map((t, i) => <li key={i}><span className="hn">{`${i + 1}.`}</span>
  <div><b>{`${t.label}.`}</b> <Rich text={t.text}/>{c.evidence(t.reports)}</div></li>)}</ol>;

const AnswersBody = ({ c }: { c: Ctx }) => <div className="faq">{c.qt.answers.map(a => <details key={a.q}><summary><span>{a.q}</span><span className={`badge${a.tone === "maybe" ? " m" : a.tone === "no" ? " n" : ""}`}>{a.badge}</span></summary>
  <p><Rich text={a.a}/></p></details>)}</div>;

const CommunityBody = ({ c }: { c: Ctx }) => <>
  <QuickTakeComposer racketId={c.racketId} name={c.shortName} tags={c.tags} nicknames={c.nicknames} hasReviews={c.reviews.length > 0}/>
  {c.reviews.length > 0 && <ul className="cms">{c.reviews.map(r => {
    const v = verdictOf(r.rating);
    const segs = r.highlights?.length ? phraseSegments(r.reviewText, r.highlights) : [{ text: r.reviewText }];
    return <li key={r.id} className="cm"><div className="bub">
      <div className="cm-head"><b>{r.alias || `A ${c.site} player`}</b><span>{[r.playerLevel, day(r.createdAt)].filter(Boolean).join(" · ")}</span><span className={`vchip ${v}`}>{VERDICT_WORD[v]}</span></div>
      <p>{segs.map((s, i) => s.tone ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>)}</p>
      {r.tags.length > 0 && <div className="cm-tags">{r.tags.map(t => <span key={t}>{t}</span>)}</div>}
    </div></li>;
  })}</ul>}
  <p className="cs-more">Want to go long? <a href={`/add-review?racket=${c.racketId}`}>Write a full review</a>.</p>
</>;

const SpotBody = ({ c }: { c: Ctx }) => <div className="spot"><h2>Spot something wrong?</h2>
  <p>{`Played the ${c.shortName} and think we got something off? Tell us. We'll fix the page and credit you by name.`}</p>
  <div className="act"><a className="btn ink" href="/contact">suggest a fix</a><small>corrections so far: none yet. Be the first to catch us out.</small></div></div>;

/** The page footer (owner 2026-11-15: specs moved to the hero chips). */
const Footer = ({ c }: { c: Ctx }) => <footer className="qt-foot">
  <p>{`Every line on this page comes from what players said on ${listWords(c.pills.map(p => p.replace(/ (testers|players)$/, "")))}. We don't test rackets and no brand paid for this. Updated ${new Date(c.qt.written).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · `}<a href="#community">Played it? Add your take ↑</a></p>
  <p className="made">made by people who own too many rackets 🎾</p>
</footer>;

const moduleSec = (type: "themes" | "version" | "setup"): Sec => ({
  id: type, show: c => !!c.module(type), toc: c => { const m = c.module(type)!; return m.type === "version" ? m.title.replace(/\?$/, "") : MODULE_TITLES[type as "themes" | "setup"]; },
  title: c => { const m = c.module(type)!; return m.type === "version" ? m.title : MODULE_TITLES[type as "themes" | "setup"]; },
  Body: ({ c }) => <ModuleBody m={c.module(type)!} c={c}/>,
});
const SECTIONS: Record<SectionKey, Sec> = {
  tldr: { id: "tldr", show: () => true, toc: () => "tl;dr", title: () => "tl;dr", Body: TldrBody },
  plays: { id: "plays", show: c => !!c.qt.plays, toc: () => "How it plays", title: () => "How it plays", verdict: c => c.qt.plays?.verdict, Body: PlaysBody },
  themes: moduleSec("themes"), version: moduleSec("version"), setup: moduleSec("setup"),
  catch: { id: "catch", show: () => true, toc: c => c.qt.catch.debate ? `The ${c.qt.catch.debate.topic} debate` : "The catch",
    title: c => c.qt.catch.debate ? `The ${c.qt.catch.debate.topic} debate 🔥` : "The catch", verdict: c => c.qt.catch.verdict, Body: CatchBody },
  compare: { id: "compare", show: c => !!c.qt.compare?.cards.length, toc: () => "How it compares", title: c => `How the ${c.shortName} compares`, verdict: c => c.qt.compare?.verdict, Body: CompareBody },
  beforeYouBuy: { id: "before-you-buy", show: c => !!(c.module("weigh") || c.module("durability") || c.module("arm")), toc: () => "Before you buy", title: () => "Before you buy", Body: BybBody },
  headsUp: { id: "heads-up", show: c => c.qt.tips.length > 0, toc: () => "Heads up", title: () => "Heads up ⚠️", Body: HeadsUpBody },
  // Only questions the page hasn't answered already; with fewer than 3 the section is skipped (owner 2026-11-15).
  answers: { id: "answers", show: c => c.qt.answers.length >= 3, toc: () => "Questions people ask", title: () => "Questions people ask", Body: AnswersBody },
  community: { id: "community", show: () => true, toc: () => "From the community", title: c => <>From the community{c.reviews.length > 0 && <span className="cs-count">{`${c.reviews.length} ${c.reviews.length === 1 ? "review" : "reviews"}`}</span>}</>, Body: CommunityBody },
  spot: { id: "spot", show: () => true, toc: () => "", Body: SpotBody },
};

function Level({ level }: { level: NonNullable<QuickTake["level"]> }) {
  const band = levelBand(level.from, level.to);
  const on = (i: number) => i >= level.from && i <= level.to ? "lt on" : "lt";
  return <div className="lvl" aria-label="Which level players say it suits">
    <h3>{"Who's it for? "}<span className="lvl-ans">{level.answer}</span></h3>
    <div className="ltrack"><div className="lband" style={{ left: band.left, right: band.right }}/>
      <span className={on(0)} style={{ left: "12%" }}>Beginner</span><span className={on(1)} style={{ left: "50%" }}>Intermediate</span><span className={on(2)} style={{ left: "85%" }}>Advanced</span></div>
    <small><Rich text={level.note}/></small>
  </div>;
}

const ZONE_FILL: Record<string, string> = { g: "#eef6e3", m: "#f8efd6", b: "#fbe5e2" };
function Court({ court }: { court: NonNullable<NonNullable<QuickTake["plays"]>["court"]> }) {
  const zones = [["net", "At the net", 40, 156, 118], ["overheads", "Overheads", 196, 205, 298], ["defence", "Defence", 401, 159, 480]] as const;
  return <figure className="court" aria-label="What players said about each part of the court">
    <svg viewBox="0 0 600 250" role="img">
      {zones.map(([k, , x, w]) => { const z = court[k]; const tone = z ? chipTone(z.chip) : null;
        return <rect key={k} fill={z ? (z.chip === "Strong" || z.chip === "Loved" ? "#dcefe2" : ZONE_FILL[tone!]) : "#f3f1ec"} x={x} y={20} width={w} height={200}/>; })}
      <rect className="ln" x="40" y="20" width="520" height="200"/>
      <line className="ln" x1="401" y1="20" x2="401" y2="220"/><line className="ln" x1="40" y1="120" x2="401" y2="120"/>
      <line className="net" x1="40" y1="12" x2="40" y2="228"/>
      <line className="glass" x1="563" y1="20" x2="563" y2="220"/><line className="glass" x1="470" y1="17" x2="563" y2="17"/><line className="glass" x1="470" y1="223" x2="563" y2="223"/>
      <text className="edge" x="40" y="244" textAnchor="middle">NET</text><text className="edge" x="560" y="244" textAnchor="middle">BACK GLASS</text>
      {zones.map(([k, label, , , cx]) => { const z = court[k]; const t = z ? chipTone(z.chip) : "n", word = z?.chip ?? "Not enough said", w = word.length * 7.2 + 18;
        return <g key={k}><text className="zn" x={cx} y="108" textAnchor="middle">{label}</text>
          <rect className={`chip-${t}`} x={cx - w / 2} y="118" width={w} height="22" rx="11"/><text className={`chip-t c-${t}`} x={cx} y="133" textAnchor="middle">{word}</text></g>; })}
    </svg>
    <figcaption className="court-key">{zones.map(([k, label]) => <div key={k}><b>{label}</b>{court[k] ? <span><Rich text={court[k]!.line}/></span> : <span className="zone-thin">Not enough said: fewer than 5 players mention it.</span>}</div>)}</figcaption>
  </figure>;
}

function Hardness({ m }: { m: Extract<Module, { type: "hardness" }> }) {
  const n = [m.soft.length, m.medium.length, m.hard.length], total = n[0] + n[1] + n[2];
  return <div className="hard"><h3>{"How hard is it? "}<span className="hard-ans">{m.answer}</span></h3>
    <div className="hbar">{(["Soft", "Medium", "Hard"] as const).map((w, i) => n[i] > 0 && <span key={w} style={{ flex: n[i] }}><b>{w}</b>{n[i]}</span>)}</div>
    <small>{`From ${total} players who described the feel.${m.brand ? ` The brand says: ${m.brand}.` : ""}`}</small></div>;
}

/** Card titles inside "Before you buy". */
const CARD_TITLES = { weigh: "Weight", durability: "Durability", arm: "Your arm" } as const;

/** A module's content; its heading comes from the section (or the Before you buy card). */
function ModuleBody({ m, c }: { m: Module; c: Ctx }) {
  if (m.type === "hardness") return null;
  const receipts = c.receipts("receipts" in m ? m.receipts : undefined);
  let body: ReactNode = null;
  if (m.type === "themes") {
    const top = Math.max(...m.bars.map(b => b.reports.length));
    body = <><div className="themes">{m.bars.map(b => <div key={b.label} className={`th${b.complaint ? " c" : ""}`}><span>{b.label}</span><span className="t"><i style={{ width: `${b.reports.length / top * 100}%` }}/></span><small>{b.reports.length}</small></div>)}</div>
      <p className="small">How many players bring each one up. Red is a complaint.</p></>;
  }
  if (m.type === "setup") body = <><div className="setup">{m.rows.map(r => <div key={r.label} className="su"><b>{r.label}</b><p><Rich text={r.line}/></p></div>)}</div>
    {m.numbers?.length ? <><p className="sub">players got out the kitchen scales</p><div className="nums">{m.numbers.map(x => <div key={x.value}><b>{x.value}</b><span><Rich text={x.note}/></span></div>)}</div></> : null}
    {m.note && <p className="small"><Rich text={m.note}/></p>}</>;
  if (m.type === "version") body = <div className="vtable">
    <div className="vt"><div className="vpic">{c.photo ? <img src={c.photo} alt=""/> : null}</div><h3>{m.self.short}</h3><p className="vsays">{m.self.says}</p><p className="vpick">{`pick it if you want`}</p><Bullets items={m.pickSelf}/></div>
    <div className="vt alt"><div className="vpic">{c.art(m.other.slug, m.other.short, "")}</div><h3>{m.other.short}</h3><p className="vsays">{m.other.says}</p><p className="vpick">{`pick it if you want`}</p><Bullets items={m.pickOther}/></div>
  </div>;
  if (m.type === "durability") body = <div className="rows">{m.rows.map(r => <div key={r.label} className="r"><div className="rl"><b>{r.label}</b></div><p><Rich text={r.line}/></p></div>)}</div>;
  if (m.type === "weigh") body = <div className="split"><div><h4><Rich text={m.heavy.title}/></h4><Bullets items={m.heavy.bullets}/></div><div><h4><Rich text={m.light.title}/></h4><Bullets items={m.light.bullets}/></div></div>;
  if (m.type === "arm") body = <div className="split"><div><h4>Easier on the arm</h4><Bullets items={m.kind}/></div><div><h4>Harder on the arm</h4><Bullets items={m.harsh}/></div></div>;
  return <><p className="lead"><Rich text={m.lead}/></p>{body}{receipts}</>;
}
