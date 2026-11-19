// Thread catalogue (Rackets Thread). proxy.ts serves it for /rackets?look=thread; search, filters and sort stay in the browser.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { threadRows } from "../data";
import { Catalog } from "../live/catalog";

export const revalidate = 21600;
export const metadata: Metadata = { title: { absolute: "All padel rackets, reviewed by players | PadelRecs" } };

export default async function ThreadCatalog() {
  const { all } = await threadRows();
  const rows = all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b, n]) => b && n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
  return <Shell active="rackets"><Catalog rows={rows} brands={brands}/></Shell>;
}
