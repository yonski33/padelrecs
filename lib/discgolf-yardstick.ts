// The disc golf yardstick (PM 2026-11-16: "add the disc golf yardstick as a CI test, as for padel"): must-beat pairs and
// "not in the top N" for the main picks, checked against the home's own ranking (lib/home-rank.ts rankHome). Pure.
import { rankHome, type RankItem, type RankSetup } from "./home-rank";
import type { QuickChoice, Style, Level } from "./quick-match";

export type Yardstick = { beats: { pick: string; above: string; below: string }[]; not_top: { pick: string; name: string; top: number }[] };
/** "fairway.beginner.control.0" = kind.level.style.arm ("-" for none). */
export function readPick(p: string): QuickChoice {
  const [kind, level, style, arm] = p.split(".");
  return { style: (style === "-" ? "any" : style) as Style, ...(kind !== "-" ? { kind } : {}), ...(level !== "-" ? { level: level as Level } : {}), arm: arm === "1" };
}
/** Each yardstick line, held or not. A disc missing from the list counts as below every listed one. */
export function yardstickResults(items: RankItem[], setup: RankSetup, bad: readonly string[], y: Yardstick, nameOf: (id: string) => string, size = 50) {
  const lists = new Map<string, string[]>();
  const list = (pick: string) => lists.get(pick) ?? lists.set(pick, rankHome(items, setup, bad, readPick(pick), false, size).rows.map(r => nameOf(r.id))).get(pick)!;
  const at = (pick: string, n: string) => { const i = list(pick).indexOf(n); return i < 0 ? Infinity : i; };
  return [
    ...y.beats.map(b => ({ ok: at(b.pick, b.above) < at(b.pick, b.below), what: `${b.pick}: ${b.above} (#${at(b.pick, b.above) + 1}) above ${b.below} (#${at(b.pick, b.below) + 1})` })),
    ...y.not_top.map(b => ({ ok: at(b.pick, b.name) >= b.top, what: `${b.pick}: ${b.name} not in the top ${b.top} (#${at(b.pick, b.name) + 1})` })),
  ];
}
