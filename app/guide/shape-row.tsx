import "./shape-row.css";
import { niche, catalogPath } from "../../lib/niche";
import { SUITS_OK } from "../../lib/fit-verdict";
import { catalogHref } from "../../lib/catalog-filter";
import { optionCount } from "../../lib/guide";
import { matchContext } from "../match-context";
import { catalogRows } from "../rackets/catalog-rows";
import { ShapeIcon } from "./shape-icon";

/** The home's Shape row (owner 2026-11-16): four tiles from the guide's shape section, each count the catalogue list its link
 *  opens, then a small link to the full guide. Nothing shows on niches without a guide. */
export async function ShapeRow() {
  const s = niche.guide?.sections.find(x => x.filter === "shape");
  if (!s) return null;
  const ctx = await matchContext(), rows = catalogRows(ctx.data, ctx);
  return <section className="shr" aria-labelledby="shr-title">
    <h2 id="shr-title">Browse by shape</h2>
    <div className="shr-row">{s.options.filter(o => o.value).map(o => { const n = optionCount(rows, "shape", o.value!, SUITS_OK);
      return <a key={o.value} href={catalogHref(catalogPath, { shape: o.value })}>
        <ShapeIcon shape={o.value!}/><b>{o.label}</b><span>{o.best}</span><em>{`${n} ${n === 1 ? niche.words.one : niche.words.many} →`}</em></a>; })}</div>
    <a className="shr-guide" href="/guide">Feel, balance &amp; weight explained → racket guide</a>
  </section>;
}
