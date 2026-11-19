// StackRecs tool page (plan PR #517 section 4): score, TL;DR when there is one, the "Would you keep paying?" poll, "How does
// it build?" or "How does it grow?" (that side's 9 vote groups), reviews with version chips, comments and similar tools.
// "Visit site" is the vendor's plain address; "Try it" shows only where a programme exists and the owner added the link,
// always with the commission note. Neither touches the score (lib/stack/score.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../../shell";
import { Badge, SBar, cap, plural, tone, type ThreadRow } from "../../../ui";
import { Poll, Reviews } from "../../../live/racket";
import { TraitVotes } from "../../../live/trait-votes";
import { Comments } from "../../../live/comments";
import { JsonLd, crumbs } from "../../../seo";
import { th } from "../../../../../lib/thread/look";
import { niche } from "../../../../../lib/niche";
import { GROUPS, SECTION_TITLE } from "../../../../../lib/stack/traits";
import { tryLink, COMMISSION_NOTE } from "../../../../../lib/stack/catalog";
import { STACK_RANKINGS } from "../../../../../lib/stack/rankings";
import { stackData, toolCards, versionChips } from "../../data";

export const revalidate = 86400;
export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  return (await stackData()).rows.map(r => ({ slug: r.slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = (await stackData()).bySlug.get((await params).slug);
  if (!r) return { title: niche.seo.productNotFound };
  const m = niche.seo.product(r.name);
  return { title: { absolute: m.title }, description: m.description, alternates: { canonical: r.href } };
}

const WORDS = { title: "Reviews", tried: "Used it?", people: "Users", note: "From users here. Plus Reddit, YouTube, blog and forum reviews, summarised." };
const SIDE_WORD = { build: "Build", grow: "Grow" } as const;
const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
const Mini = ({ x }: { x: ThreadRow }) => <a className="th-mini" href={th(x.href)}>
  <span>{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</span><span><strong>{x.name}</strong>{x.shape && <small>{x.shape}</small>}</span><Badge n={x.score} size="sm" label="score"/>
</a>;

export default async function StackTool({ params }: P) {
  const d = await stackData(), row = d.bySlug.get((await params).slug);
  if (!row) notFound();
  // Before the seed (no database) the catalog file stands in: no reviews, the vendor site from the file.
  const tool = d.data?.rackets.find(x => x.id === row.id) ?? { core: null, affiliateUrl: null, websiteUrl: row.facts?.website ?? null, reviewSummary: null };
  const cards = d.data ? toolCards(d.data, row.id) : [], chips = versionChips(tool, cards), judged = row.pos + row.mix + row.neg;
  const updated = day(row.newest), f = row.facts;
  const ranking = STACK_RANKINGS.find(l => l.kind === "category" && l.category === row.shape);
  const sim = d.rows.filter(x => x.id !== row.id && x.shape === row.shape).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.n - a.n).slice(0, 3);
  const affiliate = tryLink(row.slug, tool.affiliateUrl);
  const facts: [string, string][] = ([["Maker", row.brand], ["Category", row.shape ?? ""], ["Side", SIDE_WORD[row.side]],
    ...(f?.was ? [["Was", f.was.join(", ")]] : []),
    ...(f?.checked ? [["Free plan or trial", f.free ? "Yes" : "No"], ["Paid plans from", f.fromUsd != null ? `$${f.fromUsd} a month` : "By quote"]] : []),
    ...(chips.length ? [["Versions reviewed", chips.join(", ")]] : [])] as [string, string][]).filter(x => x[1]);
  const links = <div className="th-buy">
    {affiliate && <><a href={affiliate} target="_blank" rel="sponsored nofollow noopener">Try it ↗</a><small>{COMMISSION_NOTE}</small></>}
    {tool.websiteUrl && <a href={tool.websiteUrl} target="_blank" rel="noopener" style={affiliate ? { background: "transparent", color: "var(--ink)" } : undefined}>Visit site ↗</a>}
  </div>;
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: "Tools", path: "/tools" }, { name: row.name, path: row.href }])] };
  return <Shell active="rackets">
    <JsonLd data={ld}/>
    <main className="th-main">
      <div className="th-col">
        <div className="th-crumbs"><a href={th("/tools")}>Tools</a><span>/</span><a href={th(`/tools?side=${row.side}`)}>{SIDE_WORD[row.side]}</a>
          {ranking && <><span>/</span><a href={th(`/rankings/${ranking.slug}`)}>{row.shape}</a></>}</div>
        <article className="th-card th-post"><div className="th-post-in">
          <div className="th-by"><span className="th-dot" aria-hidden="true"/><strong>{niche.site.name}</strong>{updated && <><span>·</span><span>{`last updated ${updated}`}</span></>}
            {judged > 0 && <><span>·</span><span>{`${plural(judged, "opinion")} counted`}</span></>}</div>
          <h1 className="th-h1">{row.name}</h1>
          <div className="th-tags">
            {row.shape && <span className="th-pill lime">{row.shape}</span>}
            {row.brand && row.brand !== row.name && <span className="th-pill">{`by ${row.brand}`}</span>}
            {f?.was && <span className="th-pill">{`was ${f.was.join(", ")}`}</span>}
            <span className="th-inline-score">{row.score != null ? <><span className={`th-badge xs ${tone(row.score)}`}>{row.score}</span>score</> : "New, not enough opinions yet"}</span>
          </div>
          {tool.reviewSummary && <div className="th-tldr"><div className="th-tldr-h">TL;DR</div><p>{tool.reviewSummary}</p></div>}
          <Poll id={row.id} reviews={{ positive: row.pos, mixed: row.mix, negative: row.neg }} question="Poll: would you keep paying for it?"/>
        </div></article>
        <TraitVotes id={row.id} seed={null} groups={GROUPS[row.side]} title={SECTION_TITLE[row.side]}/>
        <div className="th-card th-only-m" style={{ padding: "10px 16px" }}>{links}</div>
        <Reviews id={row.id} cards={cards} nicknames={[]} words={WORDS} chips={chips}/>
        <Comments page={`racket:${row.id}`} nicknames={[]}/>
        {sim.length > 0 && <section className="th-card th-sec"><h2 className="th-h3">{`Other ${(row.shape ?? "tool").toLowerCase()}s`}</h2>
          <div className="th-also">{sim.map(x => <Mini key={x.id} x={x}/>)}</div></section>}
      </div>
      <aside className="th-side">
        <section className="th-card th-sbox"><div className="th-sbox-head">About this tool</div><div className="th-sbox-body pad">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {row.score != null ? <span className={`th-badge ${tone(row.score)}`} style={{ fontSize: 28 }}>{row.score}</span> : <span className="th-badge new">New</span>}
            <span style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5, color: "var(--body)" }}>
              <span>{row.score != null ? `score from ${plural(judged, "opinion")}` : judged > 0 ? `${plural(judged, "opinion")} so far` : "No opinions yet"}</span>
              {judged > 0 && <SBar lg pos={row.pos} mix={row.mix} neg={row.neg}/>}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {row.best && <><span className="th-cap">People say</span><a className="th-kv" href="#play"><span>Best for</span><strong>{cap(row.best)}</strong></a></>}
            <span className="th-cap" style={{ paddingTop: 10 }}>Facts</span>
            {facts.map(([k, v]) => <span key={k} className="th-kv"><span>{k}</span><strong>{v}</strong></span>)}
          </div>
          {links}
          <a className="th-link-b" href={th("/how-we-make-these")}>How the score works</a>
        </div></section>
      </aside>
    </main>
  </Shell>;
}
