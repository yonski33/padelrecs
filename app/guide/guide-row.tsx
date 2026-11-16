import "./guide-row.css";
import { niche, catalogPath } from "../../lib/niche";
import { SUITS_OK } from "../../lib/fit-verdict";
import { catalogHref } from "../../lib/catalog-filter";
import { optionCount, keyOf, specGroups } from "../../lib/guide";
import { matchContext } from "../match-context";
import { catalogRows } from "../rackets/catalog-rows";
import { GuideIcon } from "./guide-icon";

/** The home's guide row (owner 2026-11-16; padel: "Browse by shape"): one guide section's options as tiles, each count the
 *  catalogue list its link opens, then a small link to the full guide. From the niche's `guide.home`; none, nothing. */
export async function GuideRow() {
  const g = niche.guide, s = g?.home && g.sections.find(x => x.id === g.home!.section), key = s && keyOf(s);
  if (!g?.home || !s || !key) return null;
  const ctx = await matchContext(), rows = catalogRows(ctx.data, ctx), spec = specGroups(g), keys = spec.map(x => x.key);
  // A site's own home mock (niche.v2home): icon beside the words, the option's line and "see N standard paddles →" in the tile.
  if (niche.v2home) return <section className="shr shr-m" aria-labelledby="shr-title">
    <h2 id="shr-title">{g.home.title}</h2>
    <div className="shr-row" style={{ "--n": s.options.length } as React.CSSProperties}>{s.options.filter(o => o.value).map(o => {
      const n = optionCount(rows, key, o.value!, SUITS_OK, spec);
      return <a key={o.value} href={catalogHref(catalogPath, { [key]: o.value }, {}, keys)}>
        <GuideIcon name={o.icon}/><span className="w"><b>{o.label}</b><span>{o.text}</span><em>{`see ${n} ${o.label.toLowerCase()} ${n === 1 ? niche.words.one : niche.words.many} →`}</em></span></a>; })}</div>
    <a className="shr-guide" href="/guide">{g.home.link}</a>
  </section>;
  return <section className="shr" aria-labelledby="shr-title">
    <h2 id="shr-title">{g.home.title}</h2>
    <div className="shr-row" style={{ "--n": s.options.length } as React.CSSProperties}>{s.options.filter(o => o.value).map(o => {
      const n = optionCount(rows, key, o.value!, SUITS_OK, spec);
      return <a key={o.value} href={catalogHref(catalogPath, { [key]: o.value }, {}, keys)}>
        <GuideIcon name={o.icon}/><b>{o.label}</b>{o.best && <span>{o.best}</span>}<em>{`${n} ${n === 1 ? niche.words.one : niche.words.many} →`}</em></a>; })}</div>
    <a className="shr-guide" href="/guide">{g.home.link}</a>
  </section>;
}
