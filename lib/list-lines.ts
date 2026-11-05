import audio from "../db/lines/audio.json";
import babygear from "../db/lines/babygear.json";
import badminton from "../db/lines/badminton.json";
import camera from "../db/lines/camera.json";
import climbing from "../db/lines/climbing.json";
import coffee from "../db/lines/coffee.json";
import discgolf from "../db/lines/discgolf.json";
import fragrance from "../db/lines/fragrance.json";
import gaming from "../db/lines/gaming.json";
import golf from "../db/lines/golf.json";
import homegym from "../db/lines/homegym.json";
import hosting from "../db/lines/hosting.json";
import keyboard from "../db/lines/keyboard.json";
import kitchen from "../db/lines/kitchen.json";
import money from "../db/lines/money.json";
import monitor from "../db/lines/monitor.json";
import nails from "../db/lines/nails.json";
import padel from "../db/lines/padel.json";
import pickleball from "../db/lines/pickleball.json";
import running from "../db/lines/running.json";
import simracing from "../db/lines/simracing.json";
import skin from "../db/lines/skin.json";
import sleep from "../db/lines/sleep.json";
import snowboard from "../db/lines/snowboard.json";
import software from "../db/lines/software.json";
import tabletennis from "../db/lines/tabletennis.json";
import tennis from "../db/lines/tennis.json";
import travelgear from "../db/lines/travelgear.json";
import ultralight from "../db/lines/ultralight.json";
import { niche } from "./niche";

/** One-line takes for the ranking pages, by site and product slug: the good and the bad in about 100 characters. */
export const lines: Record<string, Record<string, string>> = { audio, babygear, badminton, camera, climbing, coffee, discgolf, fragrance, gaming, golf, homegym, hosting, keyboard, kitchen, money, monitor, nails, padel, pickleball, running, simracing, skin, sleep, snowboard, software, tabletennis, tennis, travelgear, ultralight };

/** A product's line, or else the first sentence of its "In short" summary. */
export function listLine(product: { slug: string; reviewSummary?: string | null }, site = niche.id) {
  return lines[site]?.[product.slug] ?? product.reviewSummary?.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? null;
}
