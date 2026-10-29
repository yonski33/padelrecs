import type { Niche } from "./types";
import { padel } from "./padel";
import { pickleball } from "./pickleball";
import { skin } from "./skin";
import { tennis } from "./tennis";
import { running } from "./running";
import { golf } from "./golf";
import { gaming } from "./gaming";
import { discgolf } from "./discgolf";
import { simracing } from "./simracing";
import { cycling } from "./cycling";
import { audio } from "./audio";
import { monitor } from "./monitor";
import { camera } from "./camera";
import { ultralight } from "./ultralight";
import { badminton } from "./badminton";
import { fragrance } from "./fragrance";
import { coffee } from "./coffee";
import { climbing } from "./climbing";
import { nails } from "./nails";
import { kitchen } from "./kitchen";
import { snowboard } from "./snowboard";
import { tabletennis } from "./tabletennis";
import { homegym } from "./homegym";
import { money } from "./money";

export type { Niche } from "./types";

/** Every niche this codebase can serve, keyed by the NICHE environment variable. */
export const niches: Record<string, Niche> = { padel, pickleball, skin, tennis, running, golf, gaming, discgolf, simracing, cycling, audio, monitor, camera, ultralight, badminton, fragrance, coffee, climbing, nails, kitchen, snowboard, tabletennis, homegym, money };
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
/** Whether product names carry a model year (padel) or not (pickleball, skincare, …). */
export const hasYears = niche.productYears !== false;

export const catalogPath = `/${niche.productPath}`;
/** The browse page for a product's shape, when this niche has them (SkinRecs: Cleanser → /cleansers). */
export const typePageFor = (shape: string | null | undefined) => shape ? niche.typePages?.find(t => t.shape.toLowerCase() === shape.toLowerCase()) : undefined;
export const productHref = (slug: string) => `${catalogPath}/${slug}`;
