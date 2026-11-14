import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// BadmintonRecs, approved by the owner (2026-11-14). Yonex's weight classes are unstrung: 3U = 85–89.9 g (avg 88),
// 4U = 80–84.9 g (avg 83), 5U = 75–79.9 g (avg 78), F/2F lighter. Shops sell weight as a variant, and our values list
// every class a racket comes in ("3U, 4U"), so a racket goes under each class it is sold in (owner decision).
const weight: SpecFilter = {
  id: "weight", label: "Weight class",
  groups: [{ key: "3u", label: "3U (~88 g)" }, { key: "4u", label: "4U (~83 g)" }, { key: "5u", label: "5U and lighter (under 80 g)" }],
  classify: p => {
    const s = text(p.weight); const out: string[] = [];
    if (has(s, /\b[23]U\b/i)) out.push("3u");
    if (has(s, /\b4U\b/i)) out.push("4u");
    if (has(s, /\b[5-8]U\b|\b\d?F\b/i)) out.push("5u");
    return out;
  },
};

// The maker's word decides; any mm figure after it is ignored.
const balance: SpecFilter = {
  id: "balance", label: "Balance",
  groups: [{ key: "head-heavy", label: "Head heavy" }, { key: "even", label: "Even balance" }, { key: "head-light", label: "Head light" }],
  classify: p => {
    const s = text(p.balance);
    return has(s, /head[- ]?heavy/i) ? ["head-heavy"] : has(s, /even/i) ? ["even"] : has(s, /head[- ]?light/i) ? ["head-light"] : [];
  },
};

// Three brand scales: Yonex Hi-Flex / Medium / Stiff / Extra stiff, Li-Ning Flexible / Mid-flexible / Hard flexible /
// Stiff, Victor 1–5 (1 = stiff). Li-Ning "Hard flexible" and Victor 2 of 5 sit on the stiff side, so they go to Stiff.
// The one dot-scale racket (3U: S○●○…F) is stiff-leaning in every class.
const flex: SpecFilter = {
  id: "flex", label: "Flex",
  groups: [{ key: "stiff", label: "Stiff" }, { key: "medium", label: "Medium" }, { key: "flexible", label: "Flexible" }],
  classify: p => {
    const s = text(p.core); if (!s) return [];
    const victor = s.match(/^(\d)\s*of\s*5/i);
    if (victor) { const v = Number(victor[1]); return [v <= 2 ? "stiff" : v === 3 ? "medium" : "flexible"]; }
    if (has(s, /S●|S○●|S○○●/)) return ["stiff"];
    if (has(s, /hard flex|stiff/i)) return ["stiff"];
    if (has(s, /medium|mid(dle)?[- ]flex/i)) return ["medium"];
    if (has(s, /flex/i)) return ["flexible"];
    return [];
  },
};

export default [weight, balance, flex];
