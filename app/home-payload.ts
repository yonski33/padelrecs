import { curatedSlugs } from "../lib/curated";
import { matchContext } from "./match-context";
import { rowLine } from "../lib/row-line";
import { listShopLink } from "../lib/amazon-offer";
import { score } from "../db/data";
import { displayName } from "../lib/brand-name";
import { shopPhoto, photoHidden } from "../lib/shop-photos";
import { amazonPhoto } from "../lib/amazon-photos";
import { productHref, niche } from "../lib/niche";
import { slimItems, rankHome, type RankItem, type RankedRow } from "../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../lib/rank-seed";
import type { QuickChoice } from "../lib/quick-match";
import { fitConfigFor } from "../lib/fit-config";
import { bestFor } from "../lib/fit-verdict";
import { sameInputs } from "../db/same-inputs";

const FLIGHT = !!fitConfigFor(niche)?.quick?.flightLabel, ARM_SPEC = fitConfigFor(niche)?.quick?.armSpecOk;

/** What one home row shows. */
export type HomeCard = { name: string; href: string; pic: string | null; line: string | null; shop: { url: string; rel: string } | null;
  /** The ranking rows' "best for" words (lib/fit-verdict.ts bestFor), on the row under its line (owner 2026-11-16). */ best?: string;
  /** Reports, and how the judged ones split. */ n: number; pos: number; mix: number; neg: number; judged: number; shape: string | null;
  /** The flight numbers as four boxes (type-picker sites with a flight legend, lib/fit-config.ts quick.flightLabel). */ flight?: string[];
  /** The specs agree with the arm chip (lib/fit-config.ts quick.armSpecOk). */ armOk?: boolean };
/** Everything the quick-match list needs in the browser to re-rank on a chip tap (batch D): one compact ranking item per
 *  listed racket (lib/home-rank.ts) and a card for each racket that can take a row. */
export type HomePayload = { items: RankItem[]; cards: Record<string, HomeCard> };

/** The rows the home shows for one set of picks, with only their cards (app/home-match.tsx): the server's answer, sent with
 *  the page instead of the whole payload, which the browser loads from /api/home-payload for any other picks. */
export type HomeSeed = { choice: QuickChoice; older: boolean; rows: RankedRow[]; olderN: number; cards: Record<string, HomeCard>;
  signal: Record<string, number | null>; arm: Record<string, number | null> };
export function homeSeed(payload: HomePayload, choice: QuickChoice, older: boolean): HomeSeed {
  const { rows, olderN } = rankHome(payload.items, RANK_SETUP, NEGATIVE_TAGS, choice, older);
  const byId = new Map(payload.items.map(x => [x.id, x]));
  return { choice, older, rows, olderN, cards: Object.fromEntries(rows.flatMap(r => payload.cards[r.id] ? [[r.id, payload.cards[r.id]]] : [])),
    signal: Object.fromEntries(rows.map(r => [r.id, byId.get(r.id)?.signal ?? null])), arm: Object.fromEntries(rows.map(r => [r.id, byId.get(r.id)?.arm ?? null])) };
}

export async function homePayload(): Promise<HomePayload> { return payloadOf(await matchContext()); }
/** Built again only when the match context is a new copy (db/same-inputs.ts). */
const payloadOf = sameInputs((ctx: Awaited<ReturnType<typeof matchContext>>): HomePayload => {
  const { data, takes, finder, items } = ctx;
  const slim = slimItems(items, finder);
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  // A row is a pool racket (every year, with "show older models") or the year that takes its family's row; with the match
  // engine (lib/engine), any racket with enough reports can take one.
  const minEngine = niche.fit?.engine?.minReports;
  // Curated picks (lib/curated.ts) lead their lists whatever their reports, so they need a card too.
  const curated = new Set(curatedSlugs());
  const shown = new Set(items.flatMap(x => x.pool ? [x.id, x.row] : (minEngine !== undefined && x.facts.reports >= minEngine) || (x.slug && curated.has(x.slug)) ? [x.id] : []));
  const cards = Object.fromEntries([...shown].map(id => {
    const r = byId.get(id)!, c = score(data, id), shop = listShopLink(r);
    const pic = photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
    const best = bestFor(ctx.facts(id)).join(", ");
    return [id, { name: displayName(r.name, brand(r.brandId)), href: productHref(r), pic, line: rowLine(r, takes.get(id)?.hook), ...(best ? { best } : {}),
      shop: shop ? { url: shop.url, rel: shop.rel } : null, n: reports.get(id) ?? 0, pos: c.positive, mix: c.mixed, neg: c.negative, judged: c.judged, shape: r.shape?.toLowerCase() ?? null,
      ...(FLIGHT && r.weight && r.weight.split("/").length === 4 ? { flight: r.weight.split("/").map(x => x.trim()) } : {}),
      ...(ARM_SPEC ? { armOk: ARM_SPEC(r) && !ctx.facts(id).hard?.arm } : {}) }] as const;
  }));
  return { items: slim, cards };
});
