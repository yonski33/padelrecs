import "./rankings-v2.css";
import Link from "next/link";
import { niche, v2copy } from "../../lib/niche";
import { listYear } from "../../lib/top-lists";
import { displayName } from "../../lib/brand-name";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { listHref, type RankedList } from "./lists";
import type { Catalog } from "../../db/data";

// The rankings hub in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/Wi8FK4NaHKv4dvWLjzk8ao),
// PadelRecs only: a card per live ranking with its tag, the top three photos and its #1. Our real lists only (the mockup's
// tennis-elbow and beginner lists don't exist yet).

const SITE_ACC = "--site-acc" in niche.theme;
/** The card's tag and tint per kind of list. */
export function listKind(l: RankedList["list"]): { tag: string; bg: string; tint: string } {
  const t = l.trait?.tags.join(" ") ?? "";
  if (/control|defence/.test(t)) return { tag: "control", bg: "#fff", tint: "#f3f1ea" };
  if (/power|smash/.test(t)) return { tag: "power", bg: "#fff", tint: "#f3f1ea" };
  if (/arm/.test(t)) return { tag: "arm-friendly", bg: "oklch(0.94 0.05 200)", tint: "oklch(0.97 0.02 200)" };
  if (/forgiving|beginner/.test(t)) return { tag: "beginner", bg: "oklch(0.93 0.14 100)", tint: "oklch(0.98 0.04 95)" };
  if (l.modelYearsBack !== undefined) return { tag: "better value", bg: "#fff", tint: "#f3f1ea" };
  if (/spin/.test(t)) return { tag: "spin", bg: "#fff", tint: "#f3f1ea" };
  // A site with its own accent (lib/niche theme --site-acc) uses it; padel keeps its lime.
  return SITE_ACC ? { tag: "most popular", bg: "var(--site-acc)", tint: "var(--site-wash)" } : { tag: "most popular", bg: "oklch(0.88 0.17 125)", tint: "oklch(0.97 0.04 125)" };
}
/** "14 Nov". */
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const photoOf = (r: Catalog["rackets"][number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;

export default function RankingsHubV2({ data, lists }: { data: Catalog; lists: RankedList[] }) {
  const seen = new Set<string>(), unique = lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug));
  const ranked = new Set(unique.flatMap(l => l.entries.map(e => e.product.id)));
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (id: string) => { const r = byId.get(id); return r ? displayName(r.name, brand(r.brandId)) : ""; };
  const w = niche.words;
  return <main className={`rk2 ${qtFontVars}`}>
    <div className="rk2-wrap">
      <section className="rk2-hero">
        <div className="rk2-crumbs"><Link href="/">home</Link> / rankings</div>
        <h1>Explore the <span className="hl">rankings</span></h1>
        <p className="rk2-sub">{`The ${w.many} real ${niche.people.many} recommend, ranked from their reviews.`}</p>
        <div className="rk2-meta"><span>{`${unique.length} ${unique.length === 1 ? "list" : "lists"} · ${ranked.size} ${w.many} · no sponsored placements`}</span><span>·</span><a href="/how-we-make-these">how rankings work</a></div>
      </section>

      <section className="rk2-grid">{unique.map(({ list, entries, updated }, i) => {
        const k = listKind(list), first = entries[0];
        const title = list.trait || list.modelYearsBack !== undefined || /\d{4}/.test(list.label) ? list.label : `${list.label} ${listYear(list)}`;
        return <a key={list.slug} className={`rk2-card${i === 0 ? " lead" : ""}`} href={listHref(list.slug)}>
          <span className="rk2-top">
            <span className="rk2-head"><span className="rk2-tag" style={{ background: k.bg }}>{k.tag}</span>{updated && <span className="rk2-upd">{`updated ${shortDate(updated)}`}</span>}</span>
            <span className="rk2-title">{title}</span>
            {list.intro && <span className="rk2-desc">{list.intro}</span>}
          </span>
          <span className="rk2-strip" style={{ background: k.tint }}>{entries.slice(0, 3).map((e, j) => { const r = byId.get(e.product.id), pic = r ? photoOf(r) : null;
            return <span key={e.product.id} className={`rk2-ph p${j}`}>{pic ? <img src={pic} alt={nameOf(e.product.id)} width={408} height={620} loading="lazy" decoding="async"/> : <span className="rk2-tile">{nameOf(e.product.id).split(" ").slice(0, 2).join(" ")}</span>}<b>{j + 1}</b></span>; })}</span>
          <span className="rk2-foot"><span className="rk2-first"><small>#1</small> <strong>{first ? nameOf(first.product.id) : ""}</strong></span><span className="rk2-n">{`${entries.length} ranked →`}</span></span>
        </a>; })}</section>

      <section className="rk2-cta">
        <div><div className="rk2-cta-h">{"Lists are for everyone. Your match isn't."}</div><div className="rk2-cta-p">{`${v2copy.tellUs ?? "Tell us how you play"} and we'll rank every ${w.one} for you.`}</div></div>
        <Link href="/#match">{`Find your ${w.one} →`}</Link>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
