import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// RunningRecs, approved by the owner (2026-11-14). Drop follows retailer offset bands (Marathon Sports 1–4 / 5–8 / 9–11 /
// 12 mm+, zero drop its own class); 12 mm+ is too small alone, so it joins 9 mm+. Half millimetres go to the band below.
const drop: SpecFilter = {
  id: "drop", label: "Drop",
  groups: [{ key: "zero", label: "Zero drop (0 mm)" }, { key: "low", label: "Low (1–4 mm)" }, { key: "mid", label: "Mid (5–8 mm)" }, { key: "high", label: "High (9 mm+)" }],
  classify: p => {
    const s = text(p.core); if (!has(s, /mm/i)) return [];
    const d = numbers(s)[0]; if (d === undefined) return [];
    return [d < 1 ? "zero" : d < 5 ? "low" : d < 9 ? "mid" : "high"];
  },
};

// Running Warehouse groups stack by forefoot height (Barefoot 0–13, Minimal 14–18, Low 19–23, Medium 24–28, High 29–34,
// Maximal 35+). Few of our shoes sit under 24 mm, so the bottom three bands are one group. This is not the "Max cushion"
// category, which is an editorial pick.
const stack: SpecFilter = {
  id: "stack", label: "Stack height",
  groups: [{ key: "low", label: "Low (up to 23 mm)" }, { key: "medium", label: "Medium (24–28 mm)" }, { key: "high", label: "High (29–34 mm)" }, { key: "max", label: "Maximal (35 mm+)" }],
  classify: p => {
    const m = text(p.balance).match(/([\d.]+)\s*mm\s*forefoot/i); if (!m) return [];
    const f = Number(m[1]);
    return [f < 24 ? "low" : f < 29 ? "medium" : f < 35 ? "high" : "max"];
  },
};

export default [drop, stack];
