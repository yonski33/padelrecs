import { niche } from "../niche";
import type { SpecFilter } from "./types";
import audio from "./audio";
import babygear from "./babygear";
import badminton from "./badminton";
import camera from "./camera";
import climbing from "./climbing";
import coffee from "./coffee";
import cycling from "./cycling";
import discgolf from "./discgolf";
import fragrance from "./fragrance";
import gaming from "./gaming";
import golf from "./golf";
import grill from "./grill";
import homegym from "./homegym";
import hosting from "./hosting";
import keyboard from "./keyboard";
import kitchen from "./kitchen";
import laptop from "./laptop";
import money from "./money";
import monitor from "./monitor";
import nails from "./nails";
import padel from "./padel";
import pickleball from "./pickleball";
import print from "./print";
import running from "./running";
import simracing from "./simracing";
import skin from "./skin";
import sleep from "./sleep";
import snowboard from "./snowboard";
import software from "./software";
import tabletennis from "./tabletennis";
import tennis from "./tennis";
import tool from "./tool";
import travelgear from "./travelgear";
import tv from "./tv";
import ultralight from "./ultralight";

export type { SpecFilter, SpecFilterGroup } from "./types";

const bySite: Record<string, SpecFilter[]> = { audio, babygear, badminton, camera, climbing, coffee, cycling, discgolf, fragrance, gaming, golf, grill, homegym, hosting, keyboard, kitchen, laptop, money, monitor, nails, padel, pickleball, print, running, simracing, skin, sleep, snowboard, software, tabletennis, tennis, tool, travelgear, tv, ultralight };

/** This site's spec filters (lib/spec-filters/<site>.ts); none for a site that has no file. */
export const siteSpecFilters: SpecFilter[] = bySite[niche.id] ?? [];

/** The address form: sf=weight:360-375. */
export const sfValue = (f: SpecFilter, key: string) => `${f.id}:${key}`;
export function parseSf(values: string[]) {
  const want = new Map<string, Set<string>>();
  for (const v of values) { const [id, key] = v.split(":"); if (!id || !key || !siteSpecFilters.some(f => f.id === id)) continue; (want.get(id) ?? want.set(id, new Set()).get(id)!).add(key); }
  return want;
}
/** Whether a product passes every chosen spec filter (any chosen group within a filter). */
export const passesSf = (want: Map<string, Set<string>>, product: Record<string, unknown>) =>
  [...want].every(([id, keys]) => { const f = siteSpecFilters.find(x => x.id === id)!; return f.classify(product).some(k => keys.has(k)); });
