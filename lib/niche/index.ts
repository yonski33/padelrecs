import type { Niche } from "./types";
import { padel } from "./padel";
import { pickleball } from "./pickleball";
import { skin } from "./skin";

export type { Niche } from "./types";

/** Every niche this codebase can serve, keyed by the NICHE environment variable. */
export const niches: Record<string, Niche> = { padel, pickleball, skin };
export const DEFAULT_NICHE = "padel";

/** The config for a NICHE value. Unset means padel; an unknown value is a deployment mistake, so it throws. */
export function selectNiche(id: string | undefined): Niche {
  const key = (id || DEFAULT_NICHE).trim().toLowerCase();
  const found = Object.hasOwn(niches, key) ? niches[key] : undefined;
  if (!found) throw new Error(`Unknown NICHE "${id}". Known niches: ${Object.keys(niches).join(", ")}.`);
  return found;
}

// next.config.ts inlines NICHE at build time, so browser code sees the same value as the server.
export const niche = selectNiche(process.env.NICHE);

/** "/rackets" on PadelRecs, "/paddles" on PickleballRecs. The pages live in app/rackets; next.config.ts maps other paths onto them. */
/** Whether products carry a model year (padel, pickleball) or not (skincare). */
export const hasYears = niche.productYears !== false;

export const catalogPath = `/${niche.productPath}`;
export const productHref = (slug: string) => `${catalogPath}/${slug}`;
