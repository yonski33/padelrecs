import type { JSX } from "react";
import { niche } from "../../lib/niche";
import * as padel from "./padel";
import * as pickleball from "./pickleball";
import * as skin from "./skin";
import * as tennis from "./tennis";
import * as running from "./running";
import * as golf from "./golf";
import * as gaming from "./gaming";
import * as discgolf from "./discgolf";
import * as simracing from "./simracing";
import * as cycling from "./cycling";
import * as audio from "./audio";
import * as monitor from "./monitor";
import * as camera from "./camera";
import * as ultralight from "./ultralight";
import * as badminton from "./badminton";
import * as fragrance from "./fragrance";
import * as coffee from "./coffee";
import * as climbing from "./climbing";
import * as nails from "./nails";
import * as kitchen from "./kitchen";
import * as snowboard from "./snowboard";
import * as tabletennis from "./tabletennis";
import * as homegym from "./homegym";
import * as money from "./money";
import * as software from "./software";
import * as hosting from "./hosting";

/** Per-niche drawings: the product icon (shape + brand mark) and the logo, which is also the rating icon. */
export type Art = {
  ProductIcon: (props: { shape?: string | null; brand?: string | null; className?: string }) => JSX.Element;
  LogoIcon: (props: { className?: string }) => JSX.Element;
};
export const arts: Record<string, Art> = { padel, pickleball, skin, tennis, running, golf, gaming, discgolf, simracing, cycling, audio, monitor, camera, ultralight, badminton, fragrance, coffee, climbing, nails, kitchen, snowboard, tabletennis, homegym, money, software, hosting };
export const art = arts[niche.id];
