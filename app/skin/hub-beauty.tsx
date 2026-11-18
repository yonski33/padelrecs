import "./skin-product.css";
import "./home-beauty.css";
import "./pages-beauty.css";
import "./more-beauty.css";
import Link from "next/link";
import { listYear } from "../../lib/top-lists";
import { displayName } from "../../lib/brand-name";
import type { Catalog } from "../../db/data";
import { V2Footer } from "../v2-footer";
import { listHref, type RankedList } from "../rankings/lists";
import { photoOf, shortDate } from "../rankings/rankings-v2";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";

/** The SkinRecs rankings hub in the owner's beauty design (Claude Design "SkinRecs rankings hub", 2026-11-16): one card per
 *  list with its tag, title, intro, the top three products' real photos with their rank, and the #1's name. */
const TAGS = ["oklch(0.9 0.06 20)", "oklch(0.9 0.05 155)", "oklch(0.92 0.045 45)", "#fffdfa", "oklch(0.92 0.14 98)"];
const BANDS = ["oklch(0.97 0.02 20)", "#f4ede6"];

export default function HubBeauty({ data, lists }: { data: Catalog; lists: RankedList[] }) {
  const seen = new Set<string>(), unique = lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug));
  const ranked = new Set(unique.flatMap(l => l.entries.map(e => e.product.id)));
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (id: string) => { const r = byId.get(id); return r ? displayName(r.name, brand(r.brandId)) : ""; };
  const tagOf = (l: RankedList["list"]) => l.trait ? l.trait.noun === "gentleness" ? "gentle" : l.trait.noun : (l.filters?.find(f => f.column === "shape")?.include?.[0] ?? "all").toLowerCase();
  return <main className={`bp bk ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bk-wrap">
      <section className="bk-hero">
        <div className="bg-crumbs"><Link href="/">home</Link> / rankings</div>
        <h1>Explore the <em>rankings</em></h1>
        <p>The products real people recommend, ranked from their reviews.</p>
        <span className="bk-meta">{`${unique.length} ${unique.length === 1 ? "list" : "lists"} · ${ranked.size} products · no sponsored placements · `}<a href="/how-we-make-these">how rankings work</a></span>
      </section>
      <section className="bk-grid">{unique.map(({ list, entries, updated }, i) => {
        const title = list.trait || /\d{4}/.test(list.label) ? list.label : `Best ${list.label.toLowerCase()} ${listYear(list)}`;
        const first = entries[0];
        return <a key={list.slug} className={`bk-card${i === 0 ? " lead" : ""}`} href={listHref(list.slug)}>
          <span className="bk-top">
            <span className="bk-head"><span className="bk-tag" style={{ background: TAGS[i % TAGS.length] }}>{tagOf(list)}</span>{updated && <small>{`updated ${shortDate(updated)}`}</small>}</span>
            <b>{title}</b>
            {list.intro && <span className="bk-line">{list.intro}</span>}
          </span>
          <span className="bk-band" style={{ background: BANDS[i === 0 ? 0 : 1] }}>{entries.slice(0, 3).map((e, j) => { const r = byId.get(e.product.id), pic = r ? photoOf(r) : null;
            return <span key={e.product.id} className={`bk-ph p${j}`}><i>{j + 1}</i>{pic ? <img src={pic} alt={nameOf(e.product.id)} width={120} height={160} loading={i < 3 ? "eager" : "lazy"} decoding="async"/> : <span className="bk-tile"/>}</span>; })}</span>
          <span className="bk-foot"><span>{first ? <>#1 <b>{nameOf(first.product.id)}</b></> : null}</span><span className="bk-n">{`${entries.length} ranked →`}</span></span>
        </a>; })}</section>
      <section className="bg-cta"><div><b>{"Lists are for everyone. Your match isn't."}</b><span>{"Pick your skin type and goal to see every product ranked for you."}</span></div>
        <Link className="bp-btn" href="/#match">Find my match →</Link></section>
    </div>
    <V2Footer/>
  </main>;
}
