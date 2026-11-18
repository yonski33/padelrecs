// Each product's tagline in its site's voice (owner 2026-11-18, lib/site-voice.ts): the one-liner on cards and at the top of
// the product page. db/voice/<site>.json, by slug, from Grok's results (grok/site-voices/results/<site>/) with the owner's and
// PM's edits. About 1 in 3 carries a joke (skin 1 in 4); each rests on a fact in the product's review summary, which stays
// factual and unchanged. Server only: the files hold every product's line.
import padel from "../db/voice/padel.json";
import pickleball from "../db/voice/pickleball.json";
import tennis from "../db/voice/tennis.json";
import simracing from "../db/voice/simracing.json";
import discgolf from "../db/voice/discgolf.json";
import skin from "../db/voice/skin.json";
import coffee from "../db/voice/coffee.json";
import { niche } from "./niche";

const SITES: Record<string, Record<string, string>> = { padel, pickleball, tennis, simracing, discgolf, skin, coffee };
/** Every site's taglines (tests). */
export const ALL_TAGLINES = SITES;

/** The product's voice tagline, or null when its site or the product has none. */
export function voiceTagline(slug: string, site = niche.id): string | null {
  return SITES[site]?.[slug] ?? null;
}
