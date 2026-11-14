import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// MoneyRecs, approved by the owner (2026-11-14). Cards only: whether a card charges an annual fee is the stable attribute
// (NerdWallet runs a "no annual fee" list); dollar amounts change, so there are no amount bands.

// Annual fee (column `weight`, Fees). "$0 intro annual fee the first year, then $150" charges from year two, and a fee
// refunded on heavy spend is still a fee, so both count as Annual fee. A card family with several fees ("Blue $0, Obsidian
// $95") counts in both. The Robinhood card has no annual fee but needs a paid Gold membership, so it counts as Annual fee
// (owner, 2026-11-14).
const fee: SpecFilter = {
  id: "fee", label: "Annual fee", categories: ["Travel rewards card", "Cash-back card", "Starter card", "Business card"],
  groups: [{ key: "none", label: "No annual fee" }, { key: "fee", label: "Annual fee" }],
  classify: p => {
    const s = text(p.weight); if (!s) return [];
    if (has(s, /membership required|gold membership/i)) return ["fee"];
    if (has(s, /intro annual fee|first year, then/i)) return ["fee"];
    const amounts = [...s.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)/g)].map(m => numbers(m[1].replace(/,/g, ""))[0]);
    const keys = new Set<string>();
    if (has(s, /no annual|no fees/i) || amounts.some(a => a === 0)) keys.add("none");
    if (has(s, /annual fee|a year|yearly/i) && amounts.some(a => a > 0)) keys.add("fee");
    return fee.groups.map(g => g.key).filter(k => keys.has(k));
  },
};

export default [fee];
