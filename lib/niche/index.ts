import type { Niche } from "./types";

export type { Niche } from "./types";

// The running site's config. In Next builds "@/lib/niche/selected" is aliased to that one site's file (next.config.ts
// turbopack.resolveAlias), so a page or browser bundle carries only its own config; under tsx (scripts, tests) it is
// lib/niche/selected.ts, which picks the site by NICHE from every config.
import * as picked from "@/lib/niche/selected";
const isNiche = (v: unknown): v is Niche => !!v && typeof v === "object" && "id" in v && "site" in v;
export const niche: Niche = Object.values(picked as Record<string, unknown>).find(isNiche)!;

/** "/rackets" on PadelRecs, "/paddles" on PickleballRecs. The pages live in app/rackets; next.config.ts maps other paths onto them. */
/** Whether product names carry a model year (padel) or not (pickleball, skincare, …). */
export const hasYears = niche.productYears !== false;

export const catalogPath = `/${niche.productPath}`;
/** The catalogue's name in the menu, breadcrumbs and heading ("Equipment" on HomeGymRecs, else words.Many). */
export const catalogLabel = niche.navLabel ?? niche.words.Many;
/** The browse page for a product's shape, when this niche has them (SkinRecs: Cleanser → /cleansers). */
export const typePageFor = (shape: string | null | undefined) => shape ? niche.typePages?.find(t => t.shape.toLowerCase() === shape.toLowerCase()) : undefined;
/** A product's address: under its type page on niches with categoryPaths (/vpns/mullvad-vpn), else /<productPath>/<slug>. */
export const productHref = (product: { slug: string; shape?: string | null }) => productPathIn(niche, product);
export function productPathIn(n: Niche, product: { slug: string; shape?: string | null }) {
  const type = n.categoryPaths && product.shape ? n.typePages?.find(t => t.shape.toLowerCase() === product.shape!.toLowerCase()) : undefined;
  return type ? `/${type.slug}/${product.slug}` : `/${n.productPath}/${product.slug}`;
}
/** The pill on review cards: the type page's short singular label ("Budgeting app", "IEM"), when the niche has type pages. */
export const categoryPill = (shape: string | null | undefined) => { const t = typePageFor(shape); return t ? { label: t.one ?? t.shape, href: `/${t.slug}` } : undefined; };
/** The one name for the 0–99 score everywhere in the UI (owner 2026-11-15: "Player score", never "signal"): "Player score",
 *  "Sleeper score"… The code keeps calling it the signal (lib/signal.ts). */
export const scoreLabel = `${niche.people.One} score`;
/** The site runs the 2026-11 design (niche.design). */
export const isV2 = niche.design === "v2";
/** An inline colour that follows the site's own v2 token (lib/niche theme --site-*) where it sets one, else padel's literal
 *  (so padel's markup is unchanged). */
/** The site follows its own Claude Design page mocks (PickleballRecs, owner 2026-11-16 "copy the exact same"): pages add an
 *  "m" class and a few mock-only bits. Padel's pages never see it. */
export const mockLook = !!niche.v2home;
export const siteColor = (token: `--site-${string}`, padel: string) => token in niche.theme ? `var(${token})` : padel;
/** The v2 pages' sport words (niche.v2copy), with plain defaults for a site that hasn't written its own. */
export const v2copy: NonNullable<Niche["v2copy"]> = niche.v2copy ?? {
  sport: "", emoji: "", strip: `a free, ad-light side project · built by ${niche.people.many}`,
  madeBy: `made by people who own too many ${niche.words.many}`, forum: "forum", blog: "blog",
  aboutStory: [`${niche.site.name} started because we couldn't find a straight answer about which ${niche.words.one} to buy. Just spec sheets, sponsored reviews and 20-minute videos.`,
    `So we built the thing we wanted: one place that brings ${niche.people.one} reviews, YouTube reviewers and forums together, counts it honestly, and tells you if a ${niche.words.one} fits`],
  example: `${niche.examples.model} ${niche.examples.year}`,
};
