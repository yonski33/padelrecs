import type { SpecFilter } from "./types";
import { numbers, text } from "./parse";

// DiscGolfRecs, approved by the owner (2026-11-14). Flight numbers ("9 / 5 / -1 / 2" = speed / glide / turn / fade);
// speed is already the category, so stability is the useful split. Players add turn and fade (the informal "fifth
// number"), with UDisc's cutoffs: −1 or less understable, 0 to +1 stable, +2 to +3 overstable, +4 up very overstable.
// Half numbers are used as they are; a sum between bands goes to the nearer, less stable side.
const stability: SpecFilter = {
  id: "stability", label: "Stability",
  groups: [{ key: "understable", label: "Understable" }, { key: "stable", label: "Stable" }, { key: "overstable", label: "Overstable" }, { key: "very-overstable", label: "Very overstable" }],
  classify: p => {
    const n = numbers(text(p.weight)); if (n.length !== 4) return [];
    const sum = n[2] + n[3];
    return [sum < 0 ? "understable" : sum < 2 ? "stable" : sum < 4 ? "overstable" : "very-overstable"];
  },
};

export default [stability];
