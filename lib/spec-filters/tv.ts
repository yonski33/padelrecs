import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// TVRecs, approved by the owner (2026-11-14). The categories already split OLED / Mini-LED & QLED / Budget, so there is
// no panel filter.

// Sizes are stored as the class sizes a TV is sold in ("55/65/77\""). Each TV goes under every size it comes in (owner
// decision), so a buyer looking for 83" sees every model offered at 83". Groups follow retailers' buckets: 75 sits with
// 77 and 83 with 85 (Target's 70–79 / 80–89, Currys' 80"+); 42–50" are folded together because few models reach them.
const size: SpecFilter = {
  id: "size", label: "Screen size",
  groups: [{ key: "50", label: "Up to 50\"" }, { key: "55", label: "55\"" }, { key: "65", label: "65\"" }, { key: "70", label: "70–79\"" }, { key: "80", label: "80–89\"" }, { key: "90", label: "90\" and up" }],
  classify: p => {
    const keys = new Set<string>();
    for (const n of numbers(text(p.surface)).filter(n => n >= 20 && n <= 150)) {
      keys.add(n <= 50 ? "50" : n < 60 ? "55" : n < 70 ? "65" : n < 80 ? "70" : n < 90 ? "80" : "90");
    }
    return [...keys];
  },
};

// Android TV is folded into Google TV (Google TV is the newer interface on it, RTINGS treats them as one platform).
// Fire TV and Roku share a group while only a few are live; split them when the wider catalogue lands.
const platform: SpecFilter = {
  id: "os", label: "Smart platform",
  groups: [{ key: "google", label: "Google TV" }, { key: "webos", label: "webOS (LG)" }, { key: "tizen", label: "Tizen (Samsung)" }, { key: "fire-roku", label: "Fire TV / Roku" }],
  classify: p => {
    const s = text(p.weight);
    return has(s, /google|android/i) ? ["google"] : has(s, /webos/i) ? ["webos"] : has(s, /tizen/i) ? ["tizen"] : has(s, /fire|roku/i) ? ["fire-roku"] : [];
  },
};

export default [size, platform];
