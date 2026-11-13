import skin from "../db/short/skin.json";
import { niche } from "./niche";

// Short takes for the home list (owner, 2026-11-13): the good and the bad in about 60 characters, so a row never cuts a
// sentence. Written from the same reviews as the longer ranking lines (lib/list-lines.ts), which the catalogue and the
// rankings keep. One file per site in db/short/; a site without one falls back to the long line.
export const shortLines: Record<string, Record<string, string>> = { skin };

export const shortLine = (product: { slug: string }, site = niche.id) => shortLines[site]?.[product.slug] ?? null;
