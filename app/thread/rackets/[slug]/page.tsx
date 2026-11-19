// Thread racket page (Metalbone CTRL Thread v7). proxy.ts serves it for /rackets/<slug>. One quiet buy link with
// a commission note (owner 2026-11-19), the live Player score, the poll, how it plays, similar rackets, the reviews and the line.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { racketData } from "../../racket-data";
import { threadRows } from "../../data";
import { Badge, SBar, Photo, cap, plural, tone, MIN_SHOWN, type ThreadRow } from "../../ui";
import { FitCheck, Poll, Reviews } from "../../live/racket";
import { TraitVotes } from "../../live/trait-votes";
import { Comments } from "../../live/comments";
import { th } from "../../../../lib/thread/look";
import { amazonButton } from "../../../../lib/amazon-offer";
import { amazonPhoto } from "../../../../lib/amazon-photos";
import { websiteButton } from "../../../../lib/product-links";
import { withoutYear } from "../../../../lib/brand-name";
import { niche } from "../../../../lib/niche";
import { alsoLoved } from "../../../../db/product-votes";
import { database } from "../../../../db/data";
import { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { JsonLd, crumbs } from "../../seo";
import { catalogLabel, catalogPath, productHref } from "../../../../lib/niche";

export const revalidate = 86400;
// Every listed racket's page is built with the site, as the live racket pages are (app/v/racket); none without a database (CI).
export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  return (await threadRows()).all.map(r => ({ slug: r.slug }));
}

type P = { params: Promise<{ slug: string }> };
// The live racket page's title, description, canonical and share image (app/rackets/[slug]/page.tsx).
export const generateMetadata = ({ params }: P): Promise<Metadata> => liveMetadata({ params, searchParams: Promise.resolve({}) });

const LEVEL_WORD = (ls: string[]) => ls.length ? (ls.length === 1 ? cap(ls[0]) : `${cap(ls[0])} to ${ls[ls.length - 1]}`) : null;
const STYLE_WORD = { control: "Control", power: "Power", balance: "All-round" } as const;
const Mini = ({ x, small }: { x: ThreadRow; small?: boolean }) => <a className={`th-mini${small ? " sm" : ""}`} href={th(x.href)}>
  <span>{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</span>
  <span><strong>{x.name}</strong>{(x.line || x.best) && <small>{x.line ?? `Best for ${x.best}`}</small>}</span>
  <Badge n={x.score} size="sm"/>
</a>;

async function lovedToo(id: string, rows: Map<string, ThreadRow>) {
  if (!process.env.DATABASE_URL) return [];
  try { return (await alsoLoved(await database(), [id], [], "", 4)).flatMap(p => rows.get(p.racketId) ?? []); }
  catch (error) { console.error("[thread] also loved failed", error); return []; }
}

export default async function ThreadRacket({ params }: P) {
  const d = await racketData((await params).slug);
  if (!d) notFound();
  const { r, row, brand, cards, lead, bullets, traits, style, sim, line, latest, judged } = d;
  const { rows } = await threadRows();
  const also = (await lovedToo(r.id, rows)).filter(x => x.id !== r.id);
  const name = row?.name ?? r.name, bare = withoutYear(name);
  // The live racket page's buy link, the same logic (app/rackets/[slug]/page.tsx): the Amazon lookup, the saved listing when
  // the two disagree, else the product's own site. So "Check price" shows here exactly where it shows on the live page.
  const live = await amazonButton({ name: r.name, brand: brand?.name }), saved = amazonPhoto(r);
  const amazon = live && saved && live.asin !== (r as { amazonAsin?: string | null }).amazonAsin ? { url: saved.url } : live;
  const site = websiteButton(r);
  const shop = amazon ? { url: amazon.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
  const specs = ([["Year", String(r.year)], ...niche.specs.map(s => [s.label, r[s.column]])] as [string, string | null][]).filter((x): x is [string, string] => !!x[1]);
  const tags = [style ? STYLE_WORD[style] : null, r.shape, row?.feel ? `${row.feel} feel` : null, LEVEL_WORD(row?.levels ?? [])].filter((x): x is string => !!x);
  const playersSay = [style && ["Plays like", STYLE_WORD[style]], row?.levels.length && ["Best for", LEVEL_WORD(row.levels)!], row?.arm && ["Arm friendly", "Yes, say players"],
    traits.slice().sort((a, b) => b.dots - a.dots)[0] && ["Strongest at", traits.slice().sort((a, b) => b.dots - a.dots)[0].label]].filter((x): x is [string, string] => !!x);
  const day = latest ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  const buy = shop && <div className="th-buy"><a href={shop.url} target="_blank" rel={shop.rel}>Check price ↗</a><small>We may earn a commission</small></div>;
  const specsBox = specs.length > 0 && <section className="th-card th-specs th-only-m">{specs.map(([k, v]) => <span key={k} className="th-kv"><span>{k}</span><strong>{v}</strong></span>)}</section>;
  // The live page's structured data: its breadcrumbs (the catalogue, the brand, the racket).
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath }, ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };
  return <Shell active="rackets">
    <JsonLd data={ld}/>
    <main className="th-main">
      <div className="th-col">
        <div className="th-crumbs"><a href={th("/rackets")}>Rackets</a>{r.shape && <><span>/</span><span>{r.shape}</span></>}{brand && <><span>/</span><a href={`/brands/${brand.slug}`}>{brand.name}</a></>}</div>
        <article className="th-card th-post"><div className="th-post-in">
          <div className="th-by"><span className="th-dot" aria-hidden="true"/><strong>PadelRecs</strong>{day && <><span>·</span><span>{`updated ${day}`}</span></>}{judged >= MIN_SHOWN && <><span>·</span><span>{`from ${judged} player opinions`}</span></>}</div>
          <h1 className="th-h1">{r.year && bare !== name ? `${bare} (${r.year})` : name}</h1>
          <div className="th-tags">
            {tags.map((t, i) => <span key={t} className={`th-pill${i === 0 && style ? " lime" : ""}`}>{t}</span>)}
            <span className="th-inline-score">{row?.score != null ? <><span className={`th-badge xs ${tone(row.score)}`}>{row.score}</span>player score</> : "New, not enough votes yet"}</span>
          </div>
          <div className="th-hero-grid">
            <Photo src={row?.pic ?? null} className="th-bigphoto"/>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              {(lead || bullets.length > 0) && <div className="th-tldr"><div className="th-tldr-h">TL;DR</div>
                {lead && <p>{lead}</p>}
                {bullets.length > 0 && <ul>{bullets.map(b => <li key={b.text}><span className={`th-sdot ${b.tone === "pos" ? "pos" : "catch"}`}/><span>{b.text}</span></li>)}</ul>}
              </div>}
              <FitCheck id={r.id}/>
            </div>
          </div>
          <Poll id={r.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }}/>
        </div></article>

        <TraitVotes id={r.id}/>
        {/* "What reviews say" (trait dots) is off the page (owner 2026-11-19, not in the mockup); racketData still builds `traits`. */}
        {sim.length > 0 && <section className="th-card th-sec"><h2 className="th-h3">Similar rackets</h2><div className="th-sim">{sim.map(x => <Mini key={x.id} x={x}/>)}</div></section>}
        {specsBox}
        {buy && <div className="th-card th-only-m" style={{ padding: "10px 16px" }}>{buy}</div>}
        <Reviews id={r.id} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []}/>
        <Comments page={`racket:${r.id}`} nicknames={niche.form.quickVote?.nicknames ?? []}/>
        {also.length >= 2 && <section className="th-card th-sec"><h2 className="th-h2">Players who loved this also loved</h2><div className="th-also">{also.map(x => <Mini key={x.id} x={x} small/>)}</div></section>}
        {line.length >= 2 && brand && <section className="th-card th-sec">
          <div className="th-head-row"><h2 className="th-h2">{`More from ${brand.name}`}</h2><a className="th-link-b" href={`/brands/${brand.slug}`}>{`All ${brand.name} rackets →`}</a></div>
          <div className="th-also">{line.map(x => <Mini key={x.id} x={x} small/>)}</div>
        </section>}
      </div>
      <aside className="th-side">
        <section className="th-card th-sbox"><div className="th-sbox-head">About this racket</div><div className="th-sbox-body pad">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {row?.score != null ? <span className={`th-badge ${tone(row.score)}`} style={{ fontSize: 28 }}>{row.score}</span> : <span className="th-badge new">New</span>}
            <span style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5, color: "var(--body)" }}>
              <span>{row?.score != null ? (judged >= MIN_SHOWN ? `player score from ${judged}` : "player score") : "Not enough votes yet"}</span>
              {judged >= MIN_SHOWN && <SBar lg pos={row!.pos} mix={row!.mix} neg={row!.neg}/>}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {playersSay.length > 0 && <><span className="th-cap">Players say</span>{playersSay.map(([k, v]) => <a key={k} className="th-kv" href="#play"><span>{k}</span><strong>{v}</strong></a>)}</>}
            {specs.length > 0 && <><span className="th-cap" style={{ paddingTop: 10 }}>Specs</span>{specs.map(([k, v]) => <span key={k} className="th-kv"><span>{k}</span><strong>{v}</strong></span>)}</>}
          </div>
          {row && row.n >= MIN_SHOWN && <a className="th-link-b" href="#reviews">{`Read ${plural(cards.length, "review")}`}</a>}
          {buy}
        </div></section>
      </aside>
    </main>
    {buy && <div className="th-only-m" style={{ justifyContent: "center", padding: "0 16px 24px", marginTop: -48 }}>{buy}</div>}
  </Shell>;
}
