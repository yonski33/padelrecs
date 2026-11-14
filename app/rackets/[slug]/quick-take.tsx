import type { ReactNode } from "react";
import "./quick-take.css";
import { COURT_ROWS, about, chipRank, chipTone, levelBand, monthYear, roundedDown, sentimentWords, sourcePills, spans, MODULE_TITLES, type Chip, type Module, type QuickTake, type Verdict } from "../../../lib/quick-take";
import { phraseSegments } from "../../../lib/highlights";
import { platformName } from "../../../lib/source-label";
import QuickTakeComposer from "./quick-take-composer";

/** The quick-take racket page (owner 2026-11-15; site-jobs/QUICK-TAKE-RECIPE.md, mockups in site-jobs/quick-take-mockups/).
 *  Everything editorial comes from the stored block; the counts, dates, score, sources and community reviews are live. */

export type QtReport = { id: string; platform: string; sourceName: string | null; url: string | null; date: string | null; sentiment: string | null };
export type QtReview = { id: string; alias: string | null; playerLevel: string | null; createdAt: string; rating: number; reviewText: string; tags: string[]; highlights: string[] | null };
export type QtProduct = { slug: string; name: string; href: string; photo: string | null };

/** **bold** and ==marker== text. */
function Rich({ text }: { text: string }) {
  return <>{spans(text).map((s, i) => s.mark ? <mark key={i}>{s.text}</mark> : s.b ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>)}</>;
}
const Bullets = ({ items }: { items: string[] }) => <ul>{items.map((t, i) => <li key={i}><Rich text={t}/></li>)}</ul>;
const chipClass = (c: Chip) => `chip ${chipTone(c)}`;
/** A section heading with its optional verdict chip. */
const Heading = ({ text, verdict, as = "h2" }: { text: string; verdict?: Verdict; as?: "h2" | "h3" }) => {
  const H = as;
  return <H className={as === "h3" ? "byb-title" : undefined}>{text}{verdict && <span className={`hchip ${verdict.tone}`}>{verdict.text}</span>}</H>;
};
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const verdictOf = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
const VERDICT_WORD = { positive: "Positive", mixed: "Mixed", negative: "Negative" } as const;
const listWords = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "";

/** The page, top to bottom (owner 2026-11-15: sections move often, so the order is this one list). The hero is always
 *  first; each key is a section component below, and one that has nothing to show renders nothing. */
export const PAGE_ORDER = ["tldr", "plays", "themes", "version", "catch", "compare", "setup", "beforeYouBuy", "answers", "community", "spot"] as const;
export type SectionKey = typeof PAGE_ORDER[number];

type Props = {
  qt: QuickTake; racketId: string; name: string; shortName: string; year: number; shape: string | null; photo: string | null;
  crumbs: ReactNode; reports: QtReport[]; reviews: QtReview[]; signal: number | null; site: string;
  products: Map<string, QtProduct>; heroSpecs: string[]; buy: { url: string; label: string; rel: string } | null;
  fontClass: string; tags: string[]; nicknames: string[]; rest: ReactNode; jsonLd: object;
};
/** What every section reads: the props plus the live counts and helpers worked out once. */
type Ctx = Props & {
  total: number; pos: number; mix: number; neg: number; pills: string[]; from?: string; to?: string;
  tipsAt: (place: string) => ReactNode; receipts: (list?: { id: string; text: string; verbatim?: boolean }[]) => ReactNode;
  art: (slug: string | null, tile: string, cls: string) => ReactNode; module: <T extends Module["type"]>(t: T) => Extract<Module, { type: T }> | undefined;
};

export default function QuickTakePage(props: Props) {
  const { qt, reports, reviews } = props;
  const count = (k: string) => reports.filter(r => r.sentiment === k).length;
  const dates = reports.map(r => r.date).filter((d): d is string => !!d).sort();
  const byId = new Map(reports.map(r => [r.id, r]));
  const ctx: Ctx = {
    ...props, total: reports.length, pos: count("positive"), mix: count("mixed"), neg: count("negative"), from: dates[0], to: dates[dates.length - 1],
    pills: sourcePills(reports.filter(r => r.platform !== props.site).map(r => r.platform), reviews.length, props.site),
    tipsAt: place => qt.tips.filter(t => t.after === place).map((t, i) => <div key={`${place}-${i}`} className="margin-note"><b>{t.label}</b><span><Rich text={t.text}/></span></div>),
    receipts: list => {
      const shown = (list ?? []).filter(x => byId.has(x.id));
      if (!shown.length) return null;
      return <details className="show"><summary>Show me what players said</summary><ul className="snips">{shown.map(x => {
        const r = byId.get(x.id)!;
        const where = r.platform === props.site ? `${props.site} player` : [platformName(r.platform), r.sourceName && r.sourceName !== r.platform ? r.sourceName : null].filter(Boolean).join(" · ");
        return <li key={x.id}>{x.verbatim ? `“${x.text}”` : x.text}<small>{[where, r.date ? monthYear(r.date) : null].filter(Boolean).join(" · ")}{r.url && <> · <a href={r.url} target="_blank" rel="noopener noreferrer nofollow">original</a></>}</small></li>;
      })}</ul></details>;
    },
    art: (slug, tile, cls) => { const p = slug ? props.products.get(slug) : undefined;
      return p?.photo ? <img className={cls} src={p.photo} alt="" loading="lazy"/> : <span className={`${cls} none`}>{tile}</span>; },
    module: t => qt.modules.find(m => m.type === t) as never,
  };
  return <main className={`qt ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="wrap">
      {props.crumbs}
      <Hero c={ctx}/>
      <div className="col">{PAGE_ORDER.map(k => { const S = SECTIONS[k]; return <S key={k} c={ctx}/>; })}</div>
      <Footer c={ctx}/>
    </div>
    {props.rest && <div className="qt-rest">{props.rest}</div>}
  </main>;
}

function Hero({ c }: { c: Ctx }) {
  const { qt } = c, words = sentimentWords(c.pos, c.mix, c.neg);
  return <section className="hero">
    <div className="shot">{c.photo ? <img src={c.photo} alt={c.name}/> : <span className="tile">{c.shortName}</span>}</div>
    <div>
      <h1 className="name">{`${c.shortName} review `}<span>{["", String(c.year), c.shape].filter(x => x !== null).join(" · ")}</span></h1>
      <p className="hook">{qt.hook.good} <mark>{qt.hook.catch}</mark></p>
      <div className="qt-tag"><span className="pill">What players said</span><span>{`We read ${roundedDown(c.total)}+ player reports so you don't have to. Here's what they told us.`}</span></div>
      <div className="meter">
        {c.signal !== null && <span className="ps"><b>{c.signal}</b><a href="#how-we-read">Player score</a></span>}
        {words && <div className="sent">
          <div className="bar" role="img" aria-label={[words.lead, ...words.rest.map(x => x.words)].join(", ")}><i style={{ flex: c.pos }}/><i style={{ flex: c.mix }}/><i style={{ flex: c.neg }}/></div>
          <div className="mood">
            <span><i style={{ "--c": `var(--${words.leadKey === "negative" ? "neg" : words.leadKey === "positive" ? "pos" : "mute"})` } as React.CSSProperties}/><b>{words.lead}</b></span>
            {words.rest.map(x => <span key={x.key}><i style={{ "--c": `var(--${x.key === "positive" ? "pos" : x.key === "mixed" ? "mix" : "neg"})` } as React.CSSProperties}/>{x.words}</span>)}
          </div>
        </div>}
      </div>
      {c.heroSpecs.length > 0 && <div className="hero-specs">{c.heroSpecs.map(x => <span key={x} className="spec">{x}</span>)}</div>}
      {c.buy && <div className="hcta"><a className="buy" href={c.buy.url} target="_blank" rel={c.buy.rel}>{c.buy.label} <span aria-hidden="true">↗</span></a></div>}
      <div className="read">
        {c.pills.map(p => <span key={p} className="src-pill"><i/>{p}</span>)}
        {c.from && c.to && <span>Reports from <b>{`${monthYear(c.from)} to ${monthYear(c.to)}`}</b></span>}
      </div>
      <details className="howread" id="how-we-read"><summary>How we read this</summary><p>
        {"We read "}<b>{`${c.total} reports from ${listWords(c.pills)}${c.from && c.to ? `, ${monthYear(c.from, true)} to ${monthYear(c.to, true)}` : ""}`}</b>
        {". Each one was sorted as positive, mixed or negative, then by what it talks about. Every main claim has at least 3 players behind it, and quote marks only go on their actual words. We don't test rackets and no brand paid us. "}
        {c.signal !== null && <>{"The "}<b>{`Player score (${c.signal})`}</b>{" blends how much players like it with how many of them have weighed in, compared with every other racket we track. So a racket everyone talks about can score high even when opinions are split. "}</>}
        <b>Thin spot:</b> <Rich text={qt.thinSpot}/>
      </p></details>
    </div>
  </section>;
}

const Tldr = ({ c }: { c: Ctx }) => <section id="tldr">
  <h2>TL;DR</h2>
  <p className="lead"><Rich text={c.qt.tldr.lead}/></p>
  <div className="split">
    <div className="tldr-box"><h3>Made for</h3><Bullets items={c.qt.tldr.madeFor}/></div>
    <div className="tldr-box no"><h3>Not for</h3><Bullets items={c.qt.tldr.notFor}/></div>
  </div>
  {c.qt.level && <Level level={c.qt.level}/>}
  {c.tipsAt("tldr")}
</section>;

function Plays({ c }: { c: Ctx }) {
  const p = c.qt.plays, hardness = c.module("hardness");
  if (!p) return null;
  // Rows the court map covers are left out; the rest go strongest chip first (owner 2026-11-15).
  const rows = (p.court ? p.rows.filter(r => !COURT_ROWS.test(r.label)) : p.rows).map((r, i) => ({ r, i })).sort((a, b) => chipRank(a.r.chip) - chipRank(b.r.chip) || a.i - b.i).map(x => x.r);
  return <section id="plays">
    <Heading text="How it plays" verdict={p.verdict}/>
    <p className="lead"><Rich text={p.lead}/></p>
    {p.court && <Court court={p.court}/>}
    {rows.length > 0 && <div className="rows play">{rows.map(r =>
      <div key={r.label} className="r"><b>{r.label}</b><span className={chipClass(r.chip)}>{r.chip}</span><span>{r.key && r.line.startsWith(r.key) ? <><strong>{r.key}</strong><Rich text={r.line.slice(r.key.length)}/></> : <Rich text={r.line}/>}</span></div>)}</div>}
    {hardness && <Hardness m={hardness}/>}
    {c.tipsAt("plays")}
  </section>;
}

/** One module as its own section (themes, version, setup). */
const moduleSection = (type: "themes" | "version" | "setup") => function ModuleSlot({ c }: { c: Ctx }) {
  const m = c.module(type);
  return m ? <ModuleSection m={m} selfPhoto={c.photo} tips={c.tipsAt(type)} receipts={c.receipts("receipts" in m ? m.receipts : undefined)} art={c.art}/> : null;
};

const Catch = ({ c }: { c: Ctx }) => <section id="catch">
  <Heading text="The catch" verdict={c.qt.catch.verdict}/>
  <p className="lead"><Rich text={c.qt.catch.lead}/></p>
  <div className="box catch"><Bullets items={c.qt.catch.bullets}/></div>
  <div className="from"><span>{`From ${c.qt.catch.about ? `about ${about(c.qt.catch.reports.length)}` : c.qt.catch.reports.length} player reports${c.qt.catch.what ? ` ${c.qt.catch.what}` : ""}`}</span></div>
  {c.receipts(c.qt.catch.receipts)}
  {c.tipsAt("catch")}
</section>;

function Compare({ c }: { c: Ctx }) {
  const cmp = c.qt.compare;
  if (!cmp) return null;
  return <section id="compare">
    <Heading text={`How the ${c.shortName} compares`} verdict={cmp.verdict}/>
    <p className="lead"><Rich text={cmp.lead}/></p>
    <div className="vsgrid">{cmp.cards.map(card => {
      const p = card.slug ? c.products.get(card.slug) : undefined, n = new Set(card.reports).size;
      return <div key={card.slug} className="vscard">{c.art(card.slug, card.tile || card.name.split(" ").slice(-1)[0], "vsimg")}
        <h3>{p ? <a href={p.href}>{`vs ${card.name}`}</a> : `vs ${card.name}`}<span>{`from ${n} ${n === 1 ? "player" : "players"}`}</span></h3>
        <div className="arrows">{card.arrows.map((a, i) => <span key={i} className={`ar${a.dir === "up" ? " up" : a.dir === "down" ? " dn" : ""}`}>{`${a.dir === "up" ? "↑ " : a.dir === "down" ? "↓ " : a.dir === "same" ? "= " : ""}${a.text}`}</span>)}</div>
      </div>;
    })}</div>
    {cmp.went && <p className="went"><b>{cmp.went.label}</b> <Rich text={cmp.went.text}/></p>}
    {c.tipsAt("compare")}
  </section>;
}

/** "Before you buy" (owner 2026-11-15): weight, durability and arm as stacked cards under one heading. */
function BeforeYouBuy({ c }: { c: Ctx }) {
  const cards = (["weigh", "durability", "arm"] as const).map(t => c.module(t)).filter((m): m is Extract<Module, { type: "weigh" | "durability" | "arm" }> => !!m);
  if (!cards.length) return null;
  return <section id="before-you-buy">
    <h2>Before you buy</h2>
    <div className="byb">{cards.map(m => <div key={m.type} className="byb-card" id={m.type}>
      <ModuleSection m={m} selfPhoto={c.photo} tips={c.tipsAt(m.type)} receipts={c.receipts("receipts" in m ? m.receipts : undefined)} art={c.art} card/>
    </div>)}</div>
  </section>;
}

function Answers({ c }: { c: Ctx }) {
  // Only questions the page hasn't answered already; with fewer than 3 the section is skipped (owner 2026-11-15).
  if (c.qt.answers.length < 3) return null;
  return <section id="answers">
    <h2>Quick answers</h2>
    <p className="lead">What people ask before buying, answered by people who bought it.</p>
    <div className="qa2">{c.qt.answers.map(a => <div key={a.q} className="q"><h3>{a.q}</h3>
      <p><span className={`badge${a.tone === "maybe" ? " m" : a.tone === "no" ? " n" : ""}`}>{a.badge}</span><span><Rich text={a.a}/></span></p></div>)}</div>
    {c.tipsAt("answers")}
  </section>;
}

const Community = ({ c }: { c: Ctx }) => <section id="community">
  <h2>From the community{c.reviews.length > 0 && <span className="cs-count">{`${c.reviews.length} ${c.reviews.length === 1 ? "review" : "reviews"}`}</span>}</h2>
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
</section>;

const Spot = ({ c }: { c: Ctx }) => <section id="spot"><div className="spot"><h2>Spot something wrong?</h2>
  <p>{`Played the ${c.shortName} and think we got something off? Tell us. We'll fix the page and credit you by name.`}</p>
  <div className="act"><a className="btn" href="/contact">Suggest a fix</a><small>Corrections so far: none yet. Be the first to catch us out.</small></div></div></section>;

/** The page footer (owner 2026-11-15: specs moved to the hero chips). */
const Footer = ({ c }: { c: Ctx }) => <p className="how">{`Every line on this page comes from what players said on ${listWords(c.pills.map(p => p.replace(/ (testers|players)$/, "")))}. We don't test rackets and no brand paid for this. Updated ${new Date(c.qt.written).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · `}<a href="#community">Played it? Add your take ↑</a></p>;

const SECTIONS: Record<SectionKey, (p: { c: Ctx }) => ReactNode> = {
  tldr: Tldr, plays: Plays, themes: moduleSection("themes"), version: moduleSection("version"), catch: Catch, compare: Compare,
  setup: moduleSection("setup"), beforeYouBuy: BeforeYouBuy, answers: Answers, community: Community, spot: Spot,
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

function ModuleSection({ m, selfPhoto, tips, receipts, art, card }: { m: Module; selfPhoto: string | null; card?: boolean; tips: ReactNode; receipts: ReactNode; art: (slug: string | null, tile: string, cls: string) => ReactNode }) {
  if (m.type === "hardness") return null;
  const title = m.type === "version" ? m.title : MODULE_TITLES[m.type];
  const id = m.type === "version" ? "version" : m.type;
  let body: ReactNode = null, foot: ReactNode = null;
  if (m.type === "themes") {
    const top = Math.max(...m.bars.map(b => b.reports.length));
    body = <><div className="themes">{m.bars.map(b => <div key={b.label} className={`th${b.complaint ? " c" : ""}`}><span>{b.label}</span><span className="t"><i style={{ width: `${b.reports.length / top * 100}%` }}/></span><small>{b.reports.length}</small></div>)}</div>
      <p className="small">How many players bring each one up. Red is a complaint.</p></>;
  }
  if (m.type === "setup") body = <><div className="rows">{m.rows.map(r => <div key={r.label} className="r"><b>{r.label}</b><span><Rich text={r.line}/></span></div>)}</div>
    {m.numbers?.length ? <><p className="sub">Players got out the kitchen scales</p><div className="nums">{m.numbers.map(x => <div key={x.value}><b>{x.value}</b><span><Rich text={x.note}/></span></div>)}</div></> : null}
    {m.note && <p className="small"><Rich text={m.note}/></p>}</>;
  if (m.type === "version") body = <>
    <div className="faceoff"><div className="fo"><span className="pic">{art(m.other.slug, m.other.short, "")}</span><b>{m.other.short}</b><small>{m.other.says}</small></div><span className="vs">VS</span>
      <div className="fo"><span className="pic">{selfPhoto ? <img src={selfPhoto} alt=""/> : art(null, m.self.short, "")}</span><b>{m.self.short}</b><small>{m.self.says}</small></div></div>
    <div className="split"><div><h3>{`Pick the ${m.self.short} if you want`}</h3><Bullets items={m.pickSelf}/></div><div><h3>{`Pick the ${m.other.short} if you want`}</h3><Bullets items={m.pickOther}/></div></div></>;
  if (m.type === "durability") body = <div className="rows">{m.rows.map(r => <div key={r.label} className="r"><b>{r.label}</b><span><Rich text={r.line}/></span></div>)}</div>;
  if (m.type === "weigh") {
    body = <div className="split"><div><h3><Rich text={m.heavy.title}/></h3><Bullets items={m.heavy.bullets}/></div><div><h3><Rich text={m.light.title}/></h3><Bullets items={m.light.bullets}/></div></div>;
    foot = <div className="from"><span>{`From ${m.weights.length} players who gave their racket's weight`}</span></div>;
  }
  if (m.type === "arm") body = <div className="split"><div><h3>Easier on the arm</h3><Bullets items={m.kind}/></div><div><h3>Harder on the arm</h3><Bullets items={m.harsh}/></div></div>;
  if (card) return <><Heading as="h3" text={CARD_TITLES[m.type as "weigh"] ?? title} verdict={"verdict" in m ? m.verdict : undefined}/><p className="lead"><Rich text={m.lead}/></p>{body}{tips}{foot}{receipts}</>;
  return <section id={id}>
    <h2>{title}</h2>
    <p className="lead"><Rich text={m.lead}/></p>
    {body}{tips}{foot}{receipts}
  </section>;
}
