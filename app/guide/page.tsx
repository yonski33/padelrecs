import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./guide.css";
import { niche, catalogPath, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { score } from "../../db/data";
import { SUITS_OK } from "../../lib/fit-verdict";
import { choiceHref } from "../../lib/quick-match";
import { catalogHref } from "../../lib/catalog-filter";
import { optionCount, mostLiked, happiestShapes, type GuideSection, type GuideOption } from "../../lib/guide";
import { matchContext } from "../match-context";
import { catalogRows } from "../rackets/catalog-rows";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { ShapeIcon } from "./shape-icon";

export const dynamic = "force-dynamic";

// The racket guide (owner 2026-11-16, Claude Design mock Mc3i2eFFXPUgzLDQvfQTT8): a shared template, sections from the niche's
// `guide` config (lib/niche/<niche>-guide.ts). Every number is the catalogue's: an option's count is the list its link opens
// (lib/catalog-filter.ts), "most-liked" is the top Player score in that option (one row per model, newest year, 3+ rated),
// and the overheard quote is checked word for word against its report here.
export async function generateMetadata(): Promise<Metadata> {
  const g = niche.guide;
  if (!g) return {};
  return { title: { absolute: g.title }, description: g.description, alternates: { canonical: "/guide" },
    openGraph: { title: g.title, description: g.description, url: "/guide", type: "article" } };
}

export default async function Guide() {
  const g = niche.guide;
  if (!g) notFound();
  const ctx = await matchContext(), data = ctx.data;
  const rows = catalogRows(data, ctx);
  const racket = (id: string) => data.rackets.find(r => r.id === id)!;
  const nameOf = (id: string) => { const r = racket(id); return displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name).replace(/\s+(19|20)\d\d$/, ""); };
  const link = (s: GuideSection, o: GuideOption) => s.filter && o.value ? catalogHref(catalogPath, { [s.filter]: o.value }) : null;
  const count = (s: GuideSection, o: GuideOption) => s.filter && o.value ? optionCount(rows, s.filter, o.value, SUITS_OK) : null;
  // "Most-liked <option> racket": the option the config names (or the biggest one), only with 3+ rated rackets.
  const liked = (s: GuideSection) => {
    if (!s.filter || s.liked === false) return null;
    const o = s.options.find(x => x.value === s.liked) ?? [...s.options].sort((a, b) => (count(s, b) ?? 0) - (count(s, a) ?? 0))[0];
    const top = o?.value ? mostLiked(rows, s.filter, o.value, SUITS_OK) : null;
    return top ? { label: o.liked ?? o.label.toLowerCase(), name: nameOf(top.id), href: productHref(racket(top.id)) } : null;
  };
  // "Players are happiest with a round or teardrop": the two shapes with the highest share of positive reviews.
  const pos = new Map(rows.map(x => [x.id, score(data, x.id).positive]));
  const happy = g.buys ? happiestShapes(rows, pos) : null;
  // The overheard quote: shown only when the report still holds those exact words; the count is the reports that say the same.
  const textOf = (id: string) => data.external.find(e => e.id === id)?.excerpt ?? data.reviews.find(r => r.id === id)?.reviewText ?? null;
  const ov = g.overheard && textOf(g.overheard.reportId)?.includes(g.overheard.words) ? { ...g.overheard, more: g.overheard.similar.filter(id => textOf(id) !== null).length } : null;
  const n2 = (i: number) => String(i + 1).padStart(2, "0");
  const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "/" }, { "@type": "ListItem", position: 2, name: "Racket guide", item: "/guide" }] }] };

  const Liked = ({ s }: { s: GuideSection }) => { const l = liked(s); return l ? <a className="gd-liked" href={l.href}>{`Most-liked ${l.label} racket: ${l.name} →`}</a> : null; };
  const See = ({ s, o, words }: { s: GuideSection; o: GuideOption; words?: (n: number) => string }) => {
    const n = count(s, o), href = link(s, o);
    return n !== null && href ? <a className="gd-see" href={href}>{words ? words(n) : `see ${n} ${n === 1 ? niche.words.one : niche.words.many} →`}</a> : null;
  };

  return <main className={`gd ${qtFontVars}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}/>
    <div className="gd-wrap">
      <p className="gd-crumbs"><Link href="/">home</Link> / racket guide</p>
      <h1>{`${g.h1[0]} `}<span className="hl">{g.h1[1]}</span></h1>
      <p className="gd-intro">{g.intro}</p>

      <nav className="gd-chips" aria-label="Guide sections">{g.sections.map((s, i) => <a key={s.id} href={`#${s.id}`}><span>{n2(i)}</span>{s.title}</a>)}</nav>

      <section className="gd-tldr" aria-labelledby="tldr">
        <h2 id="tldr" className="gd-tag">tl;dr, if you read nothing else</h2>
        <div className="gd-tl">{g.tldr.map(p => <a key={p.label} href={choiceHref({ style: (p.picks.style ?? "any") as "any", level: p.picks.level as "beginner" | undefined, arm: !!p.picks.arm })}>
          <b>{p.label}</b><span>{p.desc}</span><em>match me →</em></a>)}</div>
      </section>

      {g.sections.map((s, i) => <section key={s.id} id={s.id} className={`gd-sec gd-l-${s.layout}`} aria-labelledby={`h-${s.id}`}>
        <div className="gd-h"><span className="gd-n">{n2(i)}</span><h2 id={`h-${s.id}`}>{s.title}</h2><span className="gd-sub">{s.sub}</span></div>

        {s.layout === "cards" && <div className="gd-cards">{s.options.map(o => <div key={o.label} className="gd-card">
          {o.value && <ShapeIcon shape={o.value}/>}<h3>{o.label}</h3><p>{o.text}</p>{o.best && <p className="gd-best">{`best for: ${o.best}`}</p>}<See s={s} o={o}/></div>)}</div>}

        {s.layout === "scale" && <div className="gd-scale"><div className="gd-bar" aria-hidden="true">{s.options.map(o => <i key={o.label}/>)}</div>
          <div className="gd-ends">{s.options.map(o => <div key={o.label}><h3>{o.label}</h3><p>{o.text}</p>
            <See s={s} o={o} words={n => `${n} ${o.label.split(" ")[0].toLowerCase()} ${n === 1 ? niche.words.one : niche.words.many} →`}/></div>)}</div></div>}

        {s.layout === "meter" && <div className="gd-meters">{s.options.map((o, j) => <div key={o.label} className={`gd-meter${o.accent ? " on" : ""}`}>
          <span className={`gd-m p${j}`} aria-hidden="true"><i/></span>
          <div>{o.kicker && <p className="gd-kick">{o.kicker}</p>}<h3>{o.label}</h3><p>{o.text}</p><See s={s} o={o}/></div></div>)}</div>}

        {s.layout === "bands" && <div className="gd-bands">{s.options.map(o => <div key={o.label} className={o.accent ? "on" : undefined}>
          {o.big && <p className="gd-big">{o.big}</p>}<h3>{o.label}</h3><p>{o.text}</p><See s={s} o={o}/></div>)}</div>}

        {s.layout === "split" && <div className={`gd-split n${s.options.length}`}>{s.options.map(o => <div key={o.label} className={o.accent ? "on" : undefined}>
          <h3>{o.label}{o.note && <span className="gd-note">{` ${o.note}`}</span>}</h3><p>{o.text}</p><See s={s} o={o}/></div>)}</div>}

        {s.textOnlyNote && <p className="gd-textonly">{s.textOnlyNote}</p>}
        {s.rule && <p className="gd-rule"><span>rule of thumb</span>{s.rule}</p>}
        <Liked s={s}/>

        {s.id === "shape" && happy && happy.top.length === 2 && g.buys && <div className="gd-buys">
          <p className="gd-kicker">{g.buys.kicker}</p>
          <p className="gd-claim">{"Players are happiest with a "}<mark>{happy.top[0]}</mark>{" or "}<mark>{happy.top[1]}</mark>{"."}
            {g.buys.tail && !happy.top.includes(g.buys.tail.unlessTop) && ` ${g.buys.tail.text}`}</p>
          <p className="gd-from">{`highest share of positive reviews, from ${happy.reviews.toLocaleString("en-US")} player reviews`}</p>
        </div>}
      </section>)}

      {ov && <section className="gd-over" aria-label="Overheard">
        <p className="gd-kicker">{ov.kicker}</p>
        <p className="gd-quote">{`“${ov.words}.”`}</p>
        <p className="gd-who">{`— ${ov.who}${ov.more ? ` · ${ov.more} more ${ov.more === 1 ? "player" : "players"} said something similar` : ""}`}</p>
        <p className="gd-lesson">{ov.lesson}</p>
      </section>}

      <section className="gd-cta"><div><h2>{g.cta.title}</h2><p>{g.cta.text}</p></div><Link href="/#match">{g.cta.button}</Link></section>
    </div>
    <V2Footer/>
  </main>;
}
