// A list row's right-column links under the opinions bar: "See reviews ›" and, when the row has one, its price link
// ("from $X · check price ↗", or the ranking lists' plain Amazon link). The creators home rows and the ranking rows both use
// it; the data comes from app/thread/row-links.ts with the page, so nothing is fetched per row.
import { th } from "../../../lib/thread/look";
import type { RowExtra } from "../../../lib/thread/creator-home";

export function RowLinks({ href, x }: { href: string; x?: Pick<RowExtra, "href" | "price"> | undefined }) {
  return <span className="tch-links"><a className="tch-go" href={th(x?.href ?? href)}>See reviews ›</a>
    {x?.price && <a className="tch-price" href={x.price.url} target="_blank" rel={x.price.rel}>{x.price.label}</a>}</span>;
}
