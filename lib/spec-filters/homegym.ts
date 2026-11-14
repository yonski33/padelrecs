import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// HomeGymRecs, approved by the owner (2026-11-14). Each type filter shows inside its own category, with the names Rogue
// and Garage Gym Reviews use: racks (power rack, half rack, squat stand, folding), benches (flat vs adjustable, FID counts
// as adjustable), machines (all-in-one trainer vs functional trainer / cable tower, plus belt squats) and barbells.
const rack: SpecFilter = {
  id: "rack", label: "Rack type", categories: ["Rack"],
  groups: [{ key: "power", label: "Power rack" }, { key: "half", label: "Half rack" }, { key: "stand", label: "Squat stand" }, { key: "folding", label: "Folding rack" }],
  // A self-spotting rack is a full four-post rack.
  classify: p => { const s = text(p.balance); return has(s, /power rack|self-spotting/i) ? ["power"] : has(s, /half rack/i) ? ["half"] : has(s, /squat stand/i) ? ["stand"] : has(s, /folding/i) ? ["folding"] : []; },
};

const bench: SpecFilter = {
  id: "bench", label: "Bench type", categories: ["Bench"],
  groups: [{ key: "adjustable", label: "Adjustable" }, { key: "flat", label: "Flat" }],
  classify: p => { const s = text(p.balance); return has(s, /adjustable|fid/i) ? ["adjustable"] : has(s, /flat/i) ? ["flat"] : []; },
};

// A Smith machine, GHD or leg press gets no group.
const machine: SpecFilter = {
  id: "machine", label: "Machine type", categories: ["Machine"],
  groups: [{ key: "aio", label: "All-in-one trainer" }, { key: "cable", label: "Functional trainer / cable tower" }, { key: "belt", label: "Belt squat" }],
  classify: p => {
    const s = text(p.balance);
    return has(s, /all-in-one|home gym/i) ? ["aio"] : has(s, /functional trainer|cable tower|lat pulldown/i) ? ["cable"] : has(s, /belt squat/i) ? ["belt"] : [];
  },
};

// A weightlifting bar is too rare for its own group, so it sits with the power and multipurpose bars.
const barbell: SpecFilter = {
  id: "bar", label: "Barbell type", categories: ["Barbell"],
  groups: [{ key: "standard", label: "Power / multipurpose bar" }, { key: "specialty", label: "Specialty bar" }],
  classify: p => { const s = text(p.balance); return has(s, /power|multipurpose|weightlifting/i) ? ["standard"] : has(s, /specialty|trap/i) ? ["specialty"] : []; },
};

export default [rack, bench, machine, barbell];
