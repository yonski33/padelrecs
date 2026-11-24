// Creator reviews grouped by the config each reviewer tested (LaptopRecs, CONFIG-GROUPING-PROPOSAL.md, 2026-11-24). A laptop
// page is one model; reviewers test different CPU, GPU, RAM or screen options of it, and battery, heat and speed follow the
// config. Every card says what it covered ("Reviewed: Core Ultra 7 258V / 32GB / OLED"). Groups are derived, never typed: a
// small per-model axis map (db/creators/laptop-config-axes.json) names the one axis that matters for that model and a pattern
// per group, matched against the review's own config words; a hand-set config_group (drizzle/0041) wins. Pure and small, so
// the browser cards filter by group with no request (the instant-filters rule: public pages are cached, never per visitor).
import laptopAxes from "../../db/creators/laptop-config-axes.json";
import laptopAliases from "../../db/creators/laptop-slug-aliases.json";
import type { ReviewConfig } from "./creators";

export type ConfigAxis = { axis: string; field: string; groups: { label: string; match: string }[] };
/** The sites whose reviews carry a config. */
const CONFIG_SITES = ["laptop"];
export const configSite = (site: string) => CONFIG_SITES.includes(site);
const AXES: Record<string, Record<string, ConfigAxis>> = { laptop: laptopAxes as Record<string, ConfigAxis> };
/** The model's config axis, or null (most models: one group, so no chips). */
export const configAxisFor = (site: string, slug: string): ConfigAxis | null => AXES[site]?.[slug] ?? null;
/** Cards that match no group of the axis. */
export const OTHER_GROUP = "Other or not stated";

/** The card's line: "Reviewed: <label>", or "Reviewed: config not stated". */
export const configLine = (c: ReviewConfig | null | undefined) => `Reviewed: ${c?.label?.trim() || "config not stated"}`;
/** The glance table's Config cell: the short label, or "Not stated". */
export const configCell = (c: ReviewConfig | null | undefined) => c?.label?.trim() || "Not stated";

/** One review's group on this axis: the hand-set group when it names one of the axis groups, else the first group whose
 *  pattern matches the axis field (then the label), else OTHER_GROUP. Null without an axis. */
export function configGroupOf(c: ReviewConfig | null | undefined, axis: ConfigAxis | null): string | null {
  if (!axis) return null;
  const set = c?.group?.trim();
  if (set && axis.groups.some(g => g.label === set)) return set;
  const text = [c?.fields?.[axis.field], c?.label].filter(Boolean).join(" ");
  if (!text) return OTHER_GROUP;
  return axis.groups.find(g => new RegExp(g.match, "i").test(text))?.label ?? OTHER_GROUP;
}

/** The chip row's groups with their card counts, in the axis order with OTHER_GROUP last; empty groups left out. Empty when
 *  fewer than 2 groups have cards (one group: the label line on each card is enough). */
export function configGroups(rs: { config?: ReviewConfig | null }[], axis: ConfigAxis | null): { label: string; n: number }[] {
  if (!axis) return [];
  const n = new Map<string, number>();
  for (const r of rs) { const g = configGroupOf(r.config, axis)!; n.set(g, (n.get(g) ?? 0) + 1); }
  const out = [...axis.groups.map(g => g.label), OTHER_GROUP].filter(l => n.get(l)).map(label => ({ label, n: n.get(label)! }));
  return out.length >= 2 ? out : [];
}

/** Staged slugs that are catalogue products under another slug (db/creators/laptop-slug-aliases.json: staged -> catalogue).
 *  The page text files (tldrs.json, reviewer-wrapups.json) are keyed by the staged slug, copied as written. */
const ALIASES: Record<string, Record<string, string>> = { laptop: laptopAliases as Record<string, string> };
/** The keys a product's page text may sit under: its own slug first, then the staged slugs that point to it. */
export const textSlugs = (site: string, slug: string) => [slug, ...Object.entries(ALIASES[site] ?? {}).filter(([, to]) => to === slug).map(([from]) => from)];
