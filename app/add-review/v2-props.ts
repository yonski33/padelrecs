// The design-v2 add-review form's props (app/add-review/add-v2.tsx), shared by the live page and the Thread page
// (app/thread/add-review): the listed products, the starting product, the "about you" options and a site's own rating words.
import { niche, productHref, catalogPath, v2copy } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import type { catalog } from "../../db/data";
import type { AddRacket, AddLabels } from "./add-v2";

type Opt = { label: string; value: string };
export type AddV2Props = { rackets: AddRacket[]; initial?: string; levels: Opt[]; sides: Opt[]; times: Opt[];
  traits?: readonly (readonly [string, string, string, string])[]; prompts?: readonly string[]; labels?: AddLabels };

/** ?racket=<id> comes from a product page's own button; ?from=<path> from the header's, chosen only when the path is a product page. */
export function addV2Props(data: Awaited<ReturnType<typeof catalog>>, racket?: string, from?: string): AddV2Props {
  // A type-path site (SkinRecs) gets its catalogue address from a Thread page's header (app/site-header.tsx), so that matches too.
  const startId = racket ?? (from ? data.rackets.find(r => productHref(r) === from || `${catalogPath}/${r.slug}` === from)?.id : undefined);
  const opts = (o: { value: string; hint?: string; display?: string }[] | undefined, word?: (v: string) => string) => (o ?? []).map(x => ({ value: x.value, label: word ? word(x.value) : x.value.toLowerCase() }));
  const p = niche.profile;
  return { rackets: data.listed.map(r => ({ id: r.id, name: displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name), photo: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null, href: productHref(r) })).sort((a, b) => a.name.localeCompare(b.name)),
    initial: startId, levels: opts(p.playerLevel?.options.filter(o => o.value !== "Competitive")), sides: opts(p.playingSide?.options, v2copy.rate ? undefined : v => v === "Both" ? "both" : `${v.toLowerCase()} side`),
    times: (p.timeWithRacket?.options ?? []).map(o => ({ value: o.value, label: (o as { hint?: string }).hint?.toLowerCase() ?? o.value.toLowerCase() })),
    // Sites with their own rating words (niche.v2copy.rate): their categories, prompts and row words; padel keeps its own.
    ...(v2copy.rate ? { traits: niche.categories.map(c => [c.label, c.column, ...(v2copy.rate![c.column] ?? ["poor", "great"])] as const), prompts: v2copy.prompts,
      labels: { level: `my ${(p.playerLevel?.label ?? "level").toLowerCase()}`, side: (p.playingSide?.label ?? "I play").toLowerCase(), how: `How does it ${v2copy.use === "works" ? "work" : "play"}?`, who: `similar ${niche.people.many}` } } : {}) };
}
