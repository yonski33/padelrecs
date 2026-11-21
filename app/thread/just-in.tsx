// PadelRecs home "2027 rackets just in" (owner mock 2026-11-21): a black NEW pill, "[year] rackets just in" and "All new
// rackets →", then three cards: photo (cutout straight on the card, as #598) with "Added 2 weeks ago", name, shape and feel
// chips, the vote pill (5+ players, lib/thread/vote-pill.ts), the loved / mixed / not for me bar and counts, "See reviews ›"
// and "check price ↗". Under JUST_IN_THIN opinions: "Played with it? Be one of the first". Three across on desktop, a
// sideways row on phones. Its own server component, loading its own data, so the home only places it.
import { threadRows, traitCounts, traitGroup } from "./data";
import { votePill } from "../../lib/thread/vote-pill";
import { TRAIT_GROUPS } from "../../lib/thread/traits";
import { justIn, JUST_IN_THIN } from "../../lib/thread/just-in";
import { amazonPhoto } from "../../lib/amazon-photos";
import { websiteButton } from "../../lib/product-links";
import { th } from "../../lib/thread/look";
import { ago, plural, type ThreadRow } from "./ui";
import { Ago } from "./live/ago";
import { withoutYear } from "../../lib/brand-name";

// The list's helpers (live/padel-list.tsx), here too: that file is a client module, so a server component can't call them.
const named = (r: ThreadRow) => { const b = withoutYear(r.name); return r.year && b !== r.name ? `${b} (${r.year})` : r.name; };
const opinions = (r: ThreadRow) => r.pos + r.mix + r.neg;

/** The racket page's note under Check price (racket-v7b.tsx BUY_NOTE), shown under an affiliate link only. */
const BUY_NOTE = "Affiliate link - price stays the same";

export async function JustIn() {
  const { all, ctx } = await threadRows();
  if (!ctx) return null;
  const listed = new Map(ctx.data.listed.map(x => [x.id, x]));
  const added = Object.fromEntries(all.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  // Only rackets in the listed catalogue (each card reads its shop links from that row).
  const pick = justIn(all.filter(r => listed.has(r.id)), added);
  if (!pick) return null;
  const tc = await traitCounts().catch(() => null), now = Date.now();
  const cards = pick.rows.map(r => {
    const x = listed.get(r.id)!;
    const pill = tc ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(tc, r.id, g.key)]))) : null;
    // The saved Amazon listing, else the product's own site (the racket page's order, without its live Amazon lookup).
    const amazon = amazonPhoto(x), site = websiteButton(x);
    const shop = amazon ? { url: amazon.url, rel: "sponsored nofollow noopener", aff: true } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener", aff: !!site.affiliate } : null;
    return { r, pill, shop, at: added[r.id] || null };
  });
  return <section className="th-card ji-sec" aria-labelledby="ji-h">
    <div className="ji-head"><span className="ji-new">New</span><h2 id="ji-h" className="th-h2">{`${pick.year} rackets just in`}</h2>
      <a className="ji-all" href={th("/rackets")}>All new rackets →</a></div>
    <div className="ji-row">{cards.map(({ r, pill, shop, at }) => { const o = opinions(r);
      return <article key={r.id} className="ji-card">
        <a className="ji-ph" href={th(r.href)} tabIndex={-1} aria-hidden="true"><img src={r.pic!} alt="" loading="lazy"/>
          {at && <span className="ji-age">Added <Ago at={at} initial={ago(at, now)}/></span>}</a>
        <a className="ji-name" href={th(r.href)}>{named(r)}</a>
        {(r.shape || r.feel) && <span className="ji-chips">{r.shape && <span className="tc-tag">{r.shape}</span>}{r.feel && <span className="tc-tag">{`${r.feel} feel`}</span>}</span>}
        {pill && <span className="tc-vote"><span aria-hidden="true"/>{pill}</span>}
        <span className="ji-stat"><span className="tc-n">{plural(o, "opinion")}</span>
          {o > 0 && <><span className="tc-bar" aria-hidden="true"><i style={{ flex: r.pos }}/><i style={{ flex: r.mix }}/><i style={{ flex: r.neg }}/></span>
            <small>{`${r.pos} loved · ${r.mix} mixed · ${r.neg} not for me`}</small></>}</span>
        {o < JUST_IN_THIN && <a className="ji-first" href={th(`${r.href}#reviews`)}>Played with it? Be one of the first</a>}
        <span className="ji-foot"><a className="ji-go" href={th(r.href)}>See reviews ›</a>
          {shop && <span className="ji-buy"><a href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a>{shop.aff && <small>{BUY_NOTE}</small>}</span>}</span>
      </article>; })}</div>
  </section>;
}
