// StackRecs catalogue (/tools): Build and Grow tabs, category chips, search and sort in the browser.
import type { Metadata } from "next";
import { Shell } from "../../shell";
import { niche } from "../../../../lib/niche";
import { stackData } from "../data";
import { StackCatalog } from "../live/catalog";

export const revalidate = 21600;
export const metadata: Metadata = { title: niche.seo.catalog.title, description: niche.seo.catalog.description, alternates: { canonical: "/tools" } };

export default async function StackTools() {
  const { rows } = await stackData();
  return <Shell active="rackets"><StackCatalog rows={rows.map(({ facts: _f, bestFor: _b, ...r }) => r)}/></Shell>;
}
