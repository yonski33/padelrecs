export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { catalog as loadCatalog } from "../../../db/data";
import { comparePairs, pairHref, pairKey } from "../../../lib/compare-pairs";
import { CompareView, compareMetadata, hrefFor, type Data } from "../view";

// /compare/a-vs-b: a curated pair (lib/compare-pairs), indexable and in the sitemap. Two real products that are not a
// curated pair (fewer reviews, or not alike) still open, at their /compare?ids= address; anything else is not found.
const catalog = cache(() => loadCatalog());

function resolve(data: Data, key: string) {
  const pair = comparePairs(data).byKey.get(key);
  if (pair) return { pair };
  const [x, y, ...more] = key.split("-vs-");
  const a = data.listed.find(r => r.slug === x), b = data.listed.find(r => r.slug === y);
  if (more.length || !a || !b || a === b) return {};
  // The same pair in the other order, or a mix that isn't curated (redirect, not 308: the curated list changes with reviews).
  const sorted = comparePairs(data).byKey.get(pairKey(a.slug, b.slug));
  return { fallback: sorted ? pairHref(a.slug, b.slug) : hrefFor([a.slug, b.slug]) };
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const [{ pair: key }, data] = await Promise.all([params, catalog()]);
  const { pair } = resolve(data, key);
  if (!pair) return { robots: { index: false } };
  return compareMetadata(data, [pair.a, pair.b], pairHref(pair.a.slug, pair.b.slug), true);
}

export default async function ComparePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const [{ pair: key }, data] = await Promise.all([params, catalog()]);
  const { pair, fallback } = resolve(data, key);
  if (!pair) { if (fallback) redirect(fallback); notFound(); }
  return <CompareView data={data} products={[pair.a, pair.b]}/>;
}
