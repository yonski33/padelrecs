import type { JSX } from "react";
import { niche } from "../../lib/niche";
import * as padel from "./padel";
import * as pickleball from "./pickleball";
import * as skin from "./skin";
import * as tennis from "./tennis";

/** Per-niche drawings: the product icon (shape + brand mark) and the logo, which is also the rating icon. */
export type Art = {
  ProductIcon: (props: { shape?: string | null; brand?: string | null; className?: string }) => JSX.Element;
  LogoIcon: (props: { className?: string }) => JSX.Element;
};
export const arts: Record<string, Art> = { padel, pickleball, skin, tennis };
export const art = arts[niche.id];
