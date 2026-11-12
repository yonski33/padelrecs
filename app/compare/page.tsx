export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { cache } from "react";
import { redirect } from "next/navigation";
import { catalog as loadCatalog } from "../../db/data";
import { comparePairs, pairHref, pairKey } from "../../lib/compare-pairs";
import { CompareView, compareMetadata, picked, hrefFor, type Query, type Data } from "./view";

// /compare?ids=a,b,c: any two or three products. Only the empty picker is indexed; a mix that is one of the curated
// "X vs Y" pairs moves to that pair's clean address, every other mix stays out of the index (lib/compare-pairs).
const catalog = cache(() => loadCatalog());
const curated = (data: Data, products: Data["rackets"]) => products.length === 2 ? comparePairs(data).byKey.get(pairKey(products[0].slug, products[1].slug)) : undefined;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Query> }): Promise<Metadata> {
  const [q, data] = await Promise.all([searchParams, catalog()]);
  const products = picked(data, q);
  const pair = curated(data, products);
  return compareMetadata(data, products, pair ? pairHref(pair.a.slug, pair.b.slug) : hrefFor(products.map(r => r.slug).sort()), products.length === 0);
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Query> }) {
  const [q, data] = await Promise.all([searchParams, catalog()]);
  const products = picked(data, q);
  const pair = curated(data, products);
  const light = (q as { look?: string }).look === "light";
  if (pair) redirect(`${pairHref(pair.a.slug, pair.b.slug)}${light ? "?look=light" : ""}`);
  return <CompareView data={data} products={products} light={light}/>;
}
