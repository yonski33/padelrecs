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
import { software } from "./software";
import { hosting } from "./hosting";
import { keyboard } from "./keyboard";
import { travelgear } from "./travelgear";
import { babygear } from "./babygear";
import { sleep } from "./sleep";
import { laptop } from "./laptop";
import { print } from "./print";
import { tv } from "./tv";
import { tool } from "./tool";
import { grill } from "./grill";
import { dog } from "./dog";

// Every site's config, for next.config.ts, scripts, tests and cross-site server code. Pages and components read only the
// running site's config through lib/niche (index.ts), so the browser never downloads the other 36 (audit 2026-11-15, #3).
/** Every niche this codebase can serve, keyed by the NICHE environment variable. */
export const niches: Record<string, Niche> = { padel, pickleball, skin, tennis, running, golf, gaming, discgolf, simracing, cycling, audio, monitor, camera, ultralight, badminton, fragrance, coffee, climbing, nails, kitchen, snowboard, tabletennis, homegym, money, software, hosting, keyboard, travelgear, babygear, sleep, laptop, print, tv, tool, grill, dog };
export const DEFAULT_NICHE = "padel";

/** The config for a NICHE value. Unset means padel; an unknown value is a deployment mistake, so it throws. */
export function selectNiche(id: string | undefined): Niche {
  const key = (id || DEFAULT_NICHE).trim().toLowerCase();
  const found = Object.hasOwn(niches, key) ? niches[key] : undefined;
  if (!found) throw new Error(`Unknown NICHE "${id}". Known niches: ${Object.keys(niches).join(", ")}.`);
  return found;
}

