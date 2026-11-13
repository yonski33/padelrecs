import audio from "../db/short/audio.json";
import babygear from "../db/short/babygear.json";
import badminton from "../db/short/badminton.json";
import camera from "../db/short/camera.json";
import climbing from "../db/short/climbing.json";
import coffee from "../db/short/coffee.json";
import cycling from "../db/short/cycling.json";
import discgolf from "../db/short/discgolf.json";
import fragrance from "../db/short/fragrance.json";
import gaming from "../db/short/gaming.json";
import golf from "../db/short/golf.json";
import homegym from "../db/short/homegym.json";
import hosting from "../db/short/hosting.json";
import keyboard from "../db/short/keyboard.json";
import kitchen from "../db/short/kitchen.json";
import money from "../db/short/money.json";
import monitor from "../db/short/monitor.json";
import nails from "../db/short/nails.json";
import padel from "../db/short/padel.json";
import pickleball from "../db/short/pickleball.json";
import running from "../db/short/running.json";
import simracing from "../db/short/simracing.json";
import skin from "../db/short/skin.json";
import sleep from "../db/short/sleep.json";
import snowboard from "../db/short/snowboard.json";
import software from "../db/short/software.json";
import tabletennis from "../db/short/tabletennis.json";
import tennis from "../db/short/tennis.json";
import travelgear from "../db/short/travelgear.json";
import tv from "../db/short/tv.json";
import ultralight from "../db/short/ultralight.json";
import { niche } from "./niche";

// Short takes for the home list (owner, 2026-11-13): the good and the bad in about 60 characters, so a row never cuts a
// sentence. Written from the same reviews as the longer ranking lines (lib/list-lines.ts), which the catalogue and the
// rankings keep. One file per site in db/short/; a site without one falls back to the long line.
export const shortLines: Record<string, Record<string, string>> = {
  audio, babygear, badminton, camera, climbing, coffee, cycling, discgolf, fragrance, gaming, golf, homegym, hosting, keyboard, kitchen, money,
  monitor, nails, padel, pickleball, running, simracing, skin, sleep, snowboard, software, tabletennis, tennis, travelgear, tv, ultralight,
};

export const shortLine = (product: { slug: string }, site = niche.id) => shortLines[site]?.[product.slug] ?? null;
