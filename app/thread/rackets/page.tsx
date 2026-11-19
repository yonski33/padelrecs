// Thread catalogue (Rackets Thread). proxy.ts serves it for /rackets; search, filters and sort stay in the browser.
import { Shell } from "../shell";
import { threadRows } from "../data";
import { Catalog } from "../live/catalog";
import { listJsonLd, catalogCrumb } from "../../../lib/catalogue-seo";

export const revalidate = 21600;
import type { Metadata } from "next";
import { generateMetadata as liveMetadata } from "../../rackets/page";
import { liveOr, withPageShare } from "../seo";
export const generateMetadata = async (): Promise<Metadata> => withPageShare(await liveOr(liveMetadata), "catalog", "Every padel racket, rated by players");

export default async function ThreadCatalog() {
  const { all } = await threadRows();
  const rows = all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b, n]) => b && n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
  const top = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.n - a.n);
  return <Shell active="rackets"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listJsonLd([catalogCrumb], top.map(r => ({ name: r.name, href: r.href }))) }}/><Catalog rows={rows} brands={brands}/></Shell>;
}
