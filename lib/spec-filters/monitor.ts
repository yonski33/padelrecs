import type { SpecFilter } from "./types";
import { numbers, text } from "./parse";

// MonitorRecs, approved by the owner (2026-11-14). The screen column carries size, resolution and refresh together
// ("26.5\" 2560×1440, 240 Hz"), so all three filters read it. Panel type was the alternate and is not built.

/** Every "W×H" resolution in the text, with the shorthand names makers use ("QHD", "4K") read as their pixels. */
function resolutions(s: string): [number, number][] {
  const out = [...s.matchAll(/(\d{3,4})\s*[×x]\s*(\d{3,4})/gi)].map(m => [Number(m[1]), Number(m[2])] as [number, number]);
  if (!out.length && /\b(?:4K|UHD)\b/i.test(s)) out.push([3840, 2160]);
  if (!out.length && /\bW?QHD\b/i.test(s)) out.push([2560, 1440]);
  if (!out.length && /\bFHD\b|1080p/i.test(s)) out.push([1920, 1080]);
  return out;
}

// The diagonal, grouped by the class it is sold as: makers sell 26.5" OLED as "27-inch" (LG 27GS95QE) and 31.5" as
// "32-inch"; 28.2" and the 29" ultrawide go with 27", their nearest class.
const size: SpecFilter = {
  id: "size", label: "Screen size",
  groups: [{ key: "24", label: "Up to 24.5\"" }, { key: "27", label: "27\"" }, { key: "32", label: "32\"" }, { key: "34", label: "34\" ultrawide" }, { key: "38", label: "38–40\"" }, { key: "42", label: "42\" and up" }],
  classify: p => {
    const m = text(p.surface).match(/(\d+(?:[.,]\d+)?)\s*(?:"|”|''|-?\s*inch)/i); if (!m) return [];
    const d = numbers(m[1])[0];
    return [d < 26 ? "24" : d < 30 ? "27" : d < 33 ? "32" : d < 36 ? "34" : d < 41 ? "38" : "42"];
  },
};

// The panel's native resolution (the widest one written), grouped the way Samsung and Tom's Hardware name them.
// 3840×2560 (3:2) has the width of 4K so it sits with 4K; 3840×1600 is a wider 21:9 ultrawide; 7680×2160 is 32:9.
const resolution: SpecFilter = {
  id: "res", label: "Resolution",
  groups: [{ key: "fhd", label: "Full HD (1080p)" }, { key: "qhd", label: "QHD (1440p)" }, { key: "uwqhd", label: "Ultrawide QHD" }, { key: "superwide", label: "Super ultrawide (32:9)" }, { key: "4k", label: "4K UHD" }, { key: "5k", label: "5K and above" }],
  classify: p => {
    const rs = resolutions(text(p.surface)); if (!rs.length) return [];
    const [w, h] = rs.reduce((a, b) => (b[0] * b[1] > a[0] * a[1] ? b : a));
    if (w / h >= 3.2) return ["superwide"];
    if (w >= 5000) return ["5k"];
    if (w >= 3800 && h >= 2100) return ["4k"];
    if (w >= 3400) return ["uwqhd"];
    if (h >= 1400) return ["qhd"];
    if (h >= 1000) return ["fhd"];
    return [];
  },
};

// Every refresh rate written: a dual-mode monitor ("4K 240 Hz / 1080p 480 Hz") goes in each tier it reaches. Tiers
// follow RTINGS' picks (144 incl. 165, 240, 480+).
const refresh: SpecFilter = {
  id: "hz", label: "Refresh rate",
  groups: [{ key: "75", label: "Up to 75 Hz" }, { key: "120", label: "100–120 Hz" }, { key: "180", label: "144–180 Hz" }, { key: "240", label: "200–240 Hz" }, { key: "400", label: "280–400 Hz" }, { key: "480", label: "480 Hz and up" }],
  classify: p => {
    const hz = [...text(p.surface).matchAll(/(\d{2,3})\s*Hz/gi)].map(m => Number(m[1]));
    return [...new Set(hz.map(n => n <= 85 ? "75" : n < 140 ? "120" : n < 190 ? "180" : n < 260 ? "240" : n < 450 ? "400" : "480"))];
  },
};

export default [size, resolution, refresh];
