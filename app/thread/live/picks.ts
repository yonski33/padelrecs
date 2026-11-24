"use client";
// "Find my match" picks (level, style, sore arm), shared by the home, the catalogue, the rankings and the racket pages and kept
// in this browser (README "State": one store for all of them). Ranking happens here with the live engine (lib/home-rank.ts),
// on the cached ranking payload (/api/home-payload), so a tap never asks the page server (tests/instant-views.test.ts).
import { useEffect, useState } from "react";
import { rankHome, matchPcts, verdictFor } from "../../../lib/home-rank";
import { STYLES } from "../../../lib/quick-match";
import { niche } from "../../../lib/niche";
import type { QuickChoice } from "../../../lib/quick-match";
import type { HomePayload, HomeCard } from "../../home-payload";
import type { ThreadRow } from "../ui";
import { SITE_FIT } from "../../../lib/fit-config";
import { advise, type Advice, type AdvCandidate } from "../../../lib/thread/fit-advice";

export type Level = "beginner" | "intermediate" | "advanced";
/** "spin" only where the site's engine has it (PickleballRecs, owner 2026-11-19). */
export type Style = "control" | "balance" | "power" | "spin";
/** `kind`: the disc type chip above the home list (DiscGolfRecs, lib/fit-config.ts quick.types); null elsewhere. */
/** `budget`: SimRacingRecs' "I want Budget / Mid-range / High-end" (its engine's budget filter, lib/simracing-fit.ts); it has
 *  no styles. Null elsewhere. */
export type Picks = { level: Level | null; style: Style | null; arm: boolean; kind?: string | null; budget?: string | null };
export const NO_PICKS: Picks = { level: null, style: null, arm: false };
/** PadelRecs v3 (handoff README): the picks live under "padelrecs-qm"; the earlier key is read as a fallback, so nobody loses
 *  their picks. Other sites keep the earlier key (each site is its own origin, so the stores never mix). */
const KEY = niche.id === "padel" ? "padelrecs-qm" : "padelrecs-thread-picks", OLD_KEY = "padelrecs-thread-picks";
/** The site's product types for the chips above the home list (DiscGolfRecs: putter, midrange, fairway, distance). */
export const TYPES = SITE_FIT.quick?.types ?? [];
/** A site without styles picks a budget instead (SimRacingRecs: $ / $$ / $$$), in the mock's words. */
const BUDGET_WORD: Record<string, string> = { $: "Budget", $$: "Mid-range", $$$: "High-end" };
export const BUDGETS: [string, string][] = (SITE_FIT.styles?.length === 0 ? SITE_FIT.quick?.filters?.find(f => f.key === "budget" && !f.kinds)?.options ?? [] : [])
  .map(([k]) => [k, BUDGET_WORD[k] ?? k]);
const EVENT = "thread-picks";

const read = (): Picks => { try { const v = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY) || "{}"); return { level: v.level ?? null, style: v.style ?? null, arm: !!v.arm, ...(TYPES.length ? { kind: TYPES.some(t => t.key === v.kind) ? v.kind : null } : {}),
  ...(BUDGETS.length ? { budget: BUDGETS.some(([k]) => k === v.budget) ? v.budget : null } : {}) }; } catch { return NO_PICKS; } };

/** The visitor's picks, the same on every Thread page and tab. Starts empty so the server's HTML and the first render agree. */
export function usePicks() {
  const [picks, setPicks] = useState<Picks>(NO_PICKS);
  useEffect(() => {
    setPicks(read());
    const on = () => setPicks(read());
    addEventListener(EVENT, on); addEventListener("storage", on);
    return () => { removeEventListener(EVENT, on); removeEventListener("storage", on); };
  }, []);
  const set = (next: Partial<Picks>) => {
    const v = { ...read(), ...next };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: the picks still apply on this page */ }
    setPicks(v); dispatchEvent(new Event(EVENT));
  };
  return [picks, set] as const;
}
/** A match % needs a level and a style (the mock: "Pick one more to get your match %"). */
/** A site without styles (SimRacingRecs) needs the level alone. */
export const complete = (p: Picks) => !!(p.level && (p.style || STYLE_OPTS.length === 0));
export const choiceOf = (p: Picks): QuickChoice => ({ style: p.style ?? "any", ...(p.level ? { level: p.level } : {}), arm: p.arm, ...(p.budget ? { ff: { budget: p.budget } } : {}) });
/** The home's choice: the picks plus the type chip (a hard filter), which only the home list and its match line use. */
export const homeChoiceOf = (p: Picks): QuickChoice => ({ ...choiceOf(p), ...(p.kind ? { kind: p.kind } : {}) });

let payload: Promise<HomePayload> | null = null;
/** The engine's items and cards, fetched once per page view, the first time the picks are complete. */
export function usePayload(on: boolean) {
  const [p, setP] = useState<HomePayload | null>(null);
  useEffect(() => {
    if (!on || p) return;
    payload ??= fetch("/api/home-payload").then(r => r.json() as Promise<HomePayload>).catch(() => { payload = null; return { items: [], cards: {} }; });
    let live = true; payload.then(x => { if (live) setP(x); });
    return () => { live = false; };
  }, [on, p]);
  return p;
}

const SETUP = { ...niche.finder!, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
const BAD = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
/** The home's ranked list for these picks: the curated picks first, as on the live home (lib/home-rank.ts rankHome). */
export const rankFor = (p: HomePayload, picks: Picks, size = 10, kind = false) => rankHome(p.items, SETUP, BAD, kind ? homeChoiceOf(picks) : choiceOf(picks), false, size).rows;
/** Every racket's match % for these picks (catalogue, rankings). */
export const pctsFor = (p: HomePayload, picks: Picks) => matchPcts(p.items, choiceOf(picks), SETUP.levelGate, SETUP.engine);
/** One racket's fit check for these picks (racket page "Is it right for me?"). */
export function fitFor(p: HomePayload, picks: Picks, id: string) {
  const item = p.items.find(x => x.id === id);
  if (!item) return null;
  return { verdict: verdictFor(p.items, choiceOf(picks), item.facts, id, SETUP.levelGate, SETUP.engine), pct: pctsFor(p, picks).get(id) ?? null };
}
const brandOf = (name: string) => name.split(" ")[0] ?? "";
const noYear = (name: string) => name.replace(/\s+\(?20\d\d\)?$/, "");
/** The fit check's advice for these picks (lib/thread/fit-advice.ts): its line, and better fits from the same match, current
 *  models only (each model's row, lib/compare-pairs.ts familyRowIds) with a card to link, never this model. */
export function adviceFor(p: HomePayload, picks: Picks, id: string, pct: number | null): Advice | null {
  const item = p.items.find(x => x.id === id);
  if (!item || pct == null || !picks.level || !picks.style) return null;
  const pcts = pctsFor(p, picks), card = p.cards[id];
  const cands: AdvCandidate[] = p.items.flatMap(x => {
    const c = p.cards[x.id], n = pcts.get(x.id);
    return x.row === x.id && x.row !== item.row && c && n != null ? [{ id: x.id, name: noYear(c.name), href: c.href, pct: n, brand: brandOf(c.name), shape: x.facts.fine?.shape ?? null }] : [];
  });
  const f = item.facts;
  return advise({ level: picks.level, style: picks.style, arm: picks.arm },
    { suits: f.suits, styleDots: f.styleDots, armDots: f.armDots, feel: f.fine?.feel ?? null, forgiveness: f.fine?.forgiveness ?? null, headHeavy: item.headHeavy,
      control: item.control, power: item.power, arm: item.arm },
    { pct, brand: card ? brandOf(card.name) : "", shape: f.fine?.shape ?? null }, cands);
}
/** A row for a racket the server didn't send (it came up for the picks), from the payload's card. */
export function rowFromCard(id: string, c: HomeCard, signal: number | null): ThreadRow {
  return { id, slug: c.href.split("/").pop() ?? id, name: c.name, href: c.href, pic: c.pic, shape: c.shape, line: c.line, best: c.best ?? null, n: c.n, pos: c.pos, mix: c.mix, neg: c.neg,
    score: signal, brand: "", year: 0, levels: [], feel: null, arm: false };
}

/** The pick chips (home "Find my match", rankings "See how you match", racket "Is it right for me?"). */
export const LEVEL_OPTS: Level[] = ["beginner", "intermediate", "advanced"];
/** The site's own styles (lib/quick-match.ts STYLES): control, balance, power, plus spin on PickleballRecs. */
export const STYLE_OPTS: Style[] = STYLES.filter((s): s is Style => s !== "any");
/** A style chip's label: a type-picker site's own words (DiscGolfRecs "Understable", "Stable", "Overstable"), else the style. */
export const styleLabel = (s: Style) => SITE_FIT.quick ? SITE_FIT.styleLabels[s as "control"] ?? s : s.charAt(0).toUpperCase() + s.slice(1);
/** The arm tick's label: padel's "Sore arm", DiscGolfRecs' "Slower arm". */
export const ARM_LABEL = SITE_FIT.quick?.armFilter ? SITE_FIT.quick.arm : SITE_FIT.quick ? "Slower arm" : "Sore arm";
/** The arm pick in the result line: "with a slower arm", "on console" (SimRacingRecs), "with a sore arm". */
export const ARM_LINE = SITE_FIT.quick?.armFilter ? " on console" : SITE_FIT.quick ? " with a slower arm" : " with a sore arm";
