import "./guide-row.css";
import { niche, catalogPath } from "../../lib/niche";
import { SUITS_OK } from "../../lib/fit-verdict";
import { catalogHref } from "../../lib/catalog-filter";
import { optionCount, keyOf, specGroups } from "../../lib/guide";
import { catalogView } from "../../lib/catalog-filter";
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
  const own = g.home.tiles, tiles = own ? Object.entries(own).flatMap(([v, t]) => { const o = s.options.find(x => x.value === v); return o ? [{ ...o, ...t }] : []; })
    : s.options.filter(o => o.value);
  // The tiles add up to the catalogue (Grok audit 2026-11-18): on a catalogue-wide filter (padel and pickleball shape), the
  // products with none of these values listed get a quiet line under the row.
  const counts = new Map(s.options.filter(o => o.value).map(o => [o.value!, optionCount(rows, key, o.value!, SUITS_OK, spec)]));
  const all = catalogView(rows, {}, SUITS_OK, spec).shown.length, rest = s.filter ? all - tiles.reduce((a, o) => a + (counts.get(o.value!) ?? 0), 0) : 0;
  const restLine = rest > 0 && <a className="shr-rest" href={catalogPath}>{`+ ${rest} ${rest === 1 ? niche.words.one : niche.words.many} with no ${s.title.toLowerCase()} listed yet · all ${all} →`}</a>;
  if (niche.v2home) return <section className="shr shr-m" aria-labelledby="shr-title">
    <h2 id="shr-title">{g.home.title}</h2>
    <div className="shr-row" style={{ "--n": tiles.length } as React.CSSProperties}>{tiles.map(o => {
      const n = counts.get(o.value!) ?? 0;
      return <a key={o.value} href={catalogHref(catalogPath, { [key]: o.value }, {}, keys)}>
        <GuideIcon name={o.icon}/><span className="w"><b>{o.label}</b><span>{o.text}</span><em>{`see ${n} ${o.label.toLowerCase()} ${n === 1 ? niche.words.one : niche.words.many} →`}</em></span></a>; })}</div>
    {restLine}
    <a className="shr-guide" href="/guide">{g.home.link}</a>
  </section>;
  return <section className="shr" aria-labelledby="shr-title">
    <h2 id="shr-title">{g.home.title}</h2>
    <div className="shr-row" style={{ "--n": s.options.length } as React.CSSProperties}>{s.options.filter(o => o.value).map(o => {
      const n = counts.get(o.value!) ?? 0;
      return <a key={o.value} href={catalogHref(catalogPath, { [key]: o.value }, {}, keys)}>
        <GuideIcon name={o.icon}/><b>{o.label}</b>{o.best && <span>{o.best}</span>}<em>{`${n} ${n === 1 ? niche.words.one : niche.words.many} →`}</em></a>; })}</div>
    {restLine}
    <a className="shr-guide" href="/guide">{g.home.link}</a>
  </section>;
}
