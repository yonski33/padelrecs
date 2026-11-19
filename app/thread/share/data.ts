// What each Thread share card shows (owner 2026-11-19), read from the same data as the Thread pages, and the alt text the
// pages put next to the image. The share routes (app/share-image, app/rackets/[slug]/share-image, app/rankings/[slug]/
// share-image) call these when the niche has the Thread look.
import { racketData } from "../racket-data";
import { threadRows, homeTop, hasDb } from "../data";
import { threadRankings } from "../rankings-data";
import { homePayload, defaultHomeIds } from "../../home-payload";
import { DEFAULT_CHOICE } from "../../../lib/quick-match";
import { withoutYear } from "../../../lib/brand-name";
import { niche } from "../../../lib/niche";
import { pageTitle, type ShareWords } from "../../../lib/thread/share-text";
import { racketCard, homeCard, rankingCard, pageCard, sharePhoto } from "./cards";

const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
const LEVELS = (ls: string[]) => ls.length ? (ls.length === 1 ? cap(ls[0]) : `${cap(ls[0])} to ${ls[ls.length - 1]}`) : null;
/** The niche's words ("padel racket", "player", "PadelRecs"), so a pickleball Thread reuses the cards as they are. */
export const WORDS: ShareWords = { noun: niche.seo.productCategory.toLowerCase(), nouns: `${niche.seo.productCategory.toLowerCase().replace(/s$/, "")}s`, people: niche.people.one, site: niche.site.name };
const fallback = () => pageCard({ title: niche.site.name, line: `Real ${WORDS.people} reviews of ${WORDS.nouns}` });

/** A racket: its name (2 lines at most), shape and level pills, the Player score, one TL;DR line and the photo. */
export async function racketShare(slug: string, origin: string) {
  const d = hasDb() ? await racketData(slug) : null;
  if (!d) return fallback();
  const { r, row, lead, judged } = d, name = row?.name ?? r.name, bare = withoutYear(name);
  return racketCard({ people: WORDS.people, name: r.year && bare !== name ? `${bare} (${r.year})` : name, pills: [r.shape ? cap(r.shape) : null, LEVELS(row?.levels ?? [])].filter((x): x is string => !!x),
    limeFirst: false, score: row?.score ?? null, opinions: judged, line: lead, photo: await sharePhoto(row?.pic ?? null, origin) });
}
export async function racketShareAlt(slug: string) {
  const d = hasDb() ? await racketData(slug) : null;
  if (!d) return niche.seo.ogProductAlt;
  const name = d.row?.name ?? d.r.name;
  const p = WORDS.people;
  return d.row?.score != null ? `${name}: ${p} score ${d.row.score} from ${d.judged} ${p} opinions on ${WORDS.site}` : `${name} ${p} reviews on ${WORDS.site}`;
}

/** The home: the community line, how many reviews, and the curated top 3's photos. */
export async function homeShare(origin: string) {
  if (!hasDb()) return fallback();
  const [{ rows, ctx }, payload] = await Promise.all([threadRows(), homePayload()]);
  const top = homeTop(rows, defaultHomeIds(payload, DEFAULT_CHOICE), 6);
  const photos = (await Promise.all(top.map(x => sharePhoto(x.pic, origin)))).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 3);
  return homeCard({ title: `The ${WORDS.noun} community`, line: `Find your match from ${(ctx.data.reviews.length + ctx.data.external.length).toLocaleString("en-US")} ${WORDS.people} reviews`, photos });
}

/** A ranking: its title and the top 3 with photos, names and Player scores. */
export async function rankingShare(slug: string, origin: string) {
  if (!hasDb()) return fallback();
  const [lists, { rows }] = await Promise.all([threadRankings(), threadRows()]);
  const l = lists.find(x => x.slug === slug);
  if (!l) return fallback();
  const top = l.ids.map(id => rows.get(id)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 3);
  return rankingCard({ title: l.label, byLine: `Ranked by ${WORDS.people} reviews`, entries: await Promise.all(top.map(async x => ({ name: x.name, score: x.score, photo: await sharePhoto(x.pic, origin) }))) });
}
export async function rankingShareAlt(slug: string) {
  const l = hasDb() ? (await threadRankings()).find(x => x.slug === slug) : null;
  return l ? `${l.label}: the top ${WORDS.nouns} ranked by ${WORDS.people} reviews on ${WORDS.site}` : niche.seo.ogAlt;
}

/** A plain titled page (catalogue, rankings hub, brands, guides, help), by its key; an unknown key gets the site's card. */
export async function pageShare(key: string | null) {
  const brands = key?.startsWith("brand:") && hasDb() ? Object.fromEntries((await threadRows()).ctx.data.brands.map(b => [b.slug, b.name])) : {};
  const p = pageTitle(key, brands, WORDS);
  return p ? pageCard(p) : fallback();
}
