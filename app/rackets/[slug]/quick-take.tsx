import type { ReactNode } from "react";
import "./quick-take.css";
import { about, chipTone, levelBand, monthYear, roundedDown, sentimentWords, sourcePills, spans, MODULE_TITLES, type Chip, type Module, type QuickTake } from "../../../lib/quick-take";
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
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const verdictOf = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
const VERDICT_WORD = { positive: "Positive", mixed: "Mixed", negative: "Negative" } as const;
const listWords = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "";

export default function QuickTakePage(props: {
  qt: QuickTake; racketId: string; name: string; shortName: string; year: number; shape: string | null; photo: string | null;
  crumbs: ReactNode; reports: QtReport[]; reviews: QtReview[]; signal: number | null; site: string;
  products: Map<string, QtProduct>; specs: string[]; fontClass: string; tags: string[]; nicknames: string[]; rest: ReactNode; jsonLd: object;
}) {
  const { qt, name, shortName, reports, reviews } = props;
  const total = reports.length;
  const count = (k: string) => reports.filter(r => r.sentiment === k).length;
  const [pos, mix, neg] = [count("positive"), count("mixed"), count("negative")];
  const words = sentimentWords(pos, mix, neg);
  const dates = reports.map(r => r.date).filter((d): d is string => !!d).sort();
  const from = dates[0], to = dates[dates.length - 1];
  const pills = sourcePills(reports.filter(r => r.platform !== props.site).map(r => r.platform), reviews.length, props.site);
  const byId = new Map(reports.map(r => [r.id, r]));
  const tipsAt = (place: string) => qt.tips.filter(t => t.after === place).map((t, i) =>
    <div key={`${place}-${i}`} className="margin-note"><b>{t.label}</b><span><Rich text={t.text}/></span></div>);
  const Receipts = ({ list }: { list?: { id: string; text: string; verbatim?: boolean }[] }) => {
    const shown = (list ?? []).filter(x => byId.has(x.id));
    if (!shown.length) return null;
    return <details className="show"><summary>Show me what players said</summary><ul className="snips">{shown.map(x => {
      const r = byId.get(x.id)!;
      const where = r.platform === props.site ? `${props.site} player` : [platformName(r.platform), r.sourceName && r.sourceName !== r.platform ? r.sourceName : null].filter(Boolean).join(" · ");
      return <li key={x.id}>{x.verbatim ? `“${x.text}”` : x.text}<small>{[where, r.date ? monthYear(r.date) : null].filter(Boolean).join(" · ")}{r.url && <> · <a href={r.url} target="_blank" rel="noopener noreferrer nofollow">original</a></>}</small></li>;
    })}</ul></details>;
  };
  const productArt = (slug: string | null, tile: string, cls: string) => {
    const p = slug ? props.products.get(slug) : undefined;
    return p?.photo ? <img className={cls} src={p.photo} alt="" loading="lazy"/> : <span className={`${cls} none`}>{tile}</span>;
  };
  const before = qt.modules.filter(m => m.type === "themes" || m.type === "version");
  const after = qt.modules.filter(m => m.type !== "themes" && m.type !== "version" && m.type !== "hardness");
  const hardness = qt.modules.find(m => m.type === "hardness");

  return <main className={`qt ${props.fontClass}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(props.jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="wrap">
      {props.crumbs}
      <section className="hero">
        <div className="shot">{props.photo ? <img src={props.photo} alt={name}/> : <span className="tile">{shortName}</span>}</div>
        <div>
          <h1 className="name">{`${shortName} review `}<span>{["", String(props.year), props.shape].filter(x => x !== null).join(" · ")}</span></h1>
          <p className="hook">{qt.hook.good} <mark>{qt.hook.catch}</mark></p>
          <div className="qt-tag"><span className="pill">What players said</span><span>{`We read ${roundedDown(total)}+ player reports so you don't have to. Here's what they told us.`}</span></div>
          <div className="meter">
            {props.signal !== null && <span className="ps"><b>{props.signal}</b><a href="#how-we-read">Player score</a></span>}
            {words && <div className="sent">
              <div className="bar" role="img" aria-label={[words.lead, ...words.rest.map(x => x.words)].join(", ")}><i style={{ flex: pos }}/><i style={{ flex: mix }}/><i style={{ flex: neg }}/></div>
              <div className="mood">
                <span><i style={{ "--c": `var(--${words.leadKey === "negative" ? "neg" : words.leadKey === "positive" ? "pos" : "mute"})` } as React.CSSProperties}/><b>{words.lead}</b></span>
                {words.rest.map(x => <span key={x.key}><i style={{ "--c": `var(--${x.key === "positive" ? "pos" : x.key === "mixed" ? "mix" : "neg"})` } as React.CSSProperties}/>{x.words}</span>)}
              </div>
            </div>}
          </div>
          <div className="read">
            {pills.map(p => <span key={p} className="src-pill"><i/>{p}</span>)}
            {from && to && <span>Reports from <b>{`${monthYear(from)} to ${monthYear(to)}`}</b></span>}
          </div>
          <details className="howread" id="how-we-read"><summary>How we read this</summary><p>
            {"We read "}<b>{`${total} reports from ${listWords(pills)}${from && to ? `, ${monthYear(from, true)} to ${monthYear(to, true)}` : ""}`}</b>
            {". Each one was sorted as positive, mixed or negative, then by what it talks about. Every main claim has at least 3 players behind it, and quote marks only go on their actual words. We don't test rackets and no brand paid us. "}
            {props.signal !== null && <>{"The "}<b>{`Player score (${props.signal})`}</b>{" blends how much players like it with how many of them have weighed in, compared with every other racket we track. So a racket everyone talks about can score high even when opinions are split. "}</>}
            <b>Thin spot:</b> <Rich text={qt.thinSpot}/>
          </p></details>
        </div>
      </section>

      <div className="col">
        <section id="tldr">
          <h2>TL;DR</h2>
          <p className="lead"><Rich text={qt.tldr.lead}/></p>
          <div className="split">
            <div className="tldr-box"><h3>Made for</h3><Bullets items={qt.tldr.madeFor}/></div>
            <div className="tldr-box no"><h3>Not for</h3><Bullets items={qt.tldr.notFor}/></div>
          </div>
          {qt.level && <Level level={qt.level}/>}
          {tipsAt("tldr")}
        </section>

        {qt.plays && <section id="plays">
          <h2>How it plays</h2>
          <p className="lead"><Rich text={qt.plays.lead}/></p>
          {qt.plays.court && <Court court={qt.plays.court}/>}
          {qt.plays.rows.length > 0 && <div className="rows play">{qt.plays.rows.map(r =>
            <div key={r.label} className="r"><b>{r.label}</b><span className={chipClass(r.chip)}>{r.chip}</span><span><Rich text={r.line}/></span></div>)}</div>}
          {hardness?.type === "hardness" && <Hardness m={hardness}/>}
          {tipsAt("plays")}
        </section>}

        {before.map(m => <ModuleSection key={m.type} m={m} selfPhoto={props.photo} tips={tipsAt(m.type)} receipts={<Receipts list={"receipts" in m ? m.receipts : undefined}/>} art={productArt}/>)}

        <section id="catch">
          <h2>The catch</h2>
          <p className="lead"><Rich text={qt.catch.lead}/></p>
          <div className="box catch"><Bullets items={qt.catch.bullets}/></div>
          <div className="from"><span>{`From ${qt.catch.about ? `about ${about(qt.catch.reports.length)}` : qt.catch.reports.length} player reports${qt.catch.what ? ` ${qt.catch.what}` : ""}`}</span></div>
          <Receipts list={qt.catch.receipts}/>
          {tipsAt("catch")}
        </section>

        {after.map(m => <ModuleSection key={m.type} m={m} selfPhoto={props.photo} tips={tipsAt(m.type)} receipts={<Receipts list={"receipts" in m ? m.receipts : undefined}/>} art={productArt}/>)}

        {qt.compare && <section id="compare">
          <h2>{`How the ${shortName} compares`}</h2>
          <p className="lead"><Rich text={qt.compare.lead}/></p>
          <div className="vsgrid">{qt.compare.cards.map(c => {
            const p = c.slug ? props.products.get(c.slug) : undefined, n = new Set(c.reports).size;
            return <div key={c.name} className="vscard">{productArt(c.slug, c.tile || c.name.split(" ").slice(-1)[0], "vsimg")}
              <h3>{p ? <a href={p.href}>{`vs ${c.name}`}</a> : `vs ${c.name}`}<span>{`from ${n} ${n === 1 ? "player" : "players"}`}</span></h3>
              <div className="arrows">{c.arrows.map((a, i) => <span key={i} className={`ar${a.dir === "up" ? " up" : a.dir === "down" ? " dn" : ""}`}>{`${a.dir === "up" ? "↑ " : a.dir === "down" ? "↓ " : a.dir === "same" ? "= " : ""}${a.text}`}</span>)}</div>
            </div>;
          })}</div>
          {qt.compare.went && <p className="went"><b>{qt.compare.went.label}</b> <Rich text={qt.compare.went.text}/></p>}
          {tipsAt("compare")}
        </section>}

        <section id="answers">
          <h2>Quick answers</h2>
          <p className="lead">What people ask before buying, answered by people who bought it.</p>
          <div className="qa2">{qt.answers.map(a => <div key={a.q} className="q"><h3>{a.q}</h3>
            <p><span className={`badge${a.tone === "maybe" ? " m" : a.tone === "no" ? " n" : ""}`}>{a.badge}</span><span><Rich text={a.a}/></span></p></div>)}</div>
          {tipsAt("answers")}
        </section>

        <section id="community">
          <h2>From the community{reviews.length > 0 && <span className="cs-count">{`${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`}</span>}</h2>
          <QuickTakeComposer racketId={props.racketId} name={shortName} tags={props.tags} nicknames={props.nicknames} hasReviews={reviews.length > 0}/>
          {reviews.length > 0 && <ul className="cms">{reviews.map(r => {
            const v = verdictOf(r.rating);
            const segs = r.highlights?.length ? phraseSegments(r.reviewText, r.highlights) : [{ text: r.reviewText }];
            return <li key={r.id} className="cm"><div className="bub">
              <div className="cm-head"><b>{r.alias || `A ${props.site} player`}</b><span>{[r.playerLevel, day(r.createdAt)].filter(Boolean).join(" · ")}</span><span className={`vchip ${v}`}>{VERDICT_WORD[v]}</span></div>
              <p>{segs.map((s, i) => s.tone ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>)}</p>
              {r.tags.length > 0 && <div className="cm-tags">{r.tags.map(t => <span key={t}>{t}</span>)}</div>}
            </div></li>;
          })}</ul>}
          <p className="cs-more">Want to go long? <a href={`/add-review?racket=${props.racketId}`}>Write a full review</a>.</p>
        </section>

        <section id="spot"><div className="spot"><h2>Spot something wrong?</h2>
          <p>{`Played the ${shortName} and think we got something off? Tell us. We'll fix the page and credit you by name.`}</p>
          <div className="act"><a className="btn" href="/contact">Suggest a fix</a><small>Corrections so far: none yet. Be the first to catch us out.</small></div></div></section>

        <section id="specs">
          <h2>Specs</h2>
          {props.specs.length > 0 && <div className="specs">{props.specs.map(s => <span key={s} className="spec">{s}</span>)}</div>}
          <p className="how">{`Every line on this page comes from what players said on ${listWords(pills.map(p => p.replace(/ (testers|players)$/, "")))}. We don't test rackets and no brand paid for this. Updated ${new Date(qt.written).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · `}<a href="#reviews">Read every player report ↓</a></p>
        </section>
      </div>
    </div>
    <div className="qt-rest">{props.rest}</div>
  </main>;
}

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
    <figcaption className="court-key">{zones.map(([k, label]) => court[k] && <div key={k}><b>{label}</b><span><Rich text={court[k]!.line}/></span></div>)}</figcaption>
  </figure>;
}

function Hardness({ m }: { m: Extract<Module, { type: "hardness" }> }) {
  const n = [m.soft.length, m.medium.length, m.hard.length], total = n[0] + n[1] + n[2];
  return <div className="hard"><h3>{"How hard is it? "}<span className="hard-ans">{m.answer}</span></h3>
    <div className="hbar">{(["Soft", "Medium", "Hard"] as const).map((w, i) => n[i] > 0 && <span key={w} style={{ flex: n[i] }}><b>{w}</b>{n[i]}</span>)}</div>
    <small>{`From ${total} players who described the feel.${m.brand ? ` The brand says: ${m.brand}.` : ""}`}</small></div>;
}

function ModuleSection({ m, selfPhoto, tips, receipts, art }: { m: Module; selfPhoto: string | null; tips: ReactNode; receipts: ReactNode; art: (slug: string | null, tile: string, cls: string) => ReactNode }) {
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
  return <section id={id}>
    <h2>{title}</h2>
    <p className="lead"><Rich text={m.lead}/></p>
    {body}{tips}{foot}{receipts}
  </section>;
}
