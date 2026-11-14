import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// CameraRecs, approved by the owner (2026-11-14). Resolution (MP) and weight are skipped: 360 and action cameras quote
// stitched or pixel figures that don't compare with interchangeable-lens bodies, and weights mix with/without battery.

// Sensor format as B&H files bodies. Monochrome bodies go with their format. The 1.4-inch Canon PowerShot V1 goes with
// 1-inch: it is a fixed-lens compact, not a Micro Four Thirds body. Fractional sizes (1/1.1", 1/2.3") are smaller than 1-inch.
const sensor: SpecFilter = {
  id: "sensor", label: "Sensor size",
  groups: [{ key: "medium", label: "Medium format" }, { key: "ff", label: "Full-frame" }, { key: "apsc", label: "APS-C" }, { key: "mft", label: "Micro Four Thirds" }, { key: "1in", label: "1-inch & 1.4-inch" }, { key: "small", label: "Smaller than 1-inch" }],
  classify: p => {
    const s = text(p.balance);
    if (has(s, /medium format/i)) return ["medium"];
    if (has(s, /full[\s-]*frame/i)) return ["ff"];
    if (has(s, /aps-?c/i)) return ["apsc"];
    if (has(s, /four thirds|\bm43\b|\bMFT\b/i)) return ["mft"];
    if (has(s, /\b1\/\d/)) return ["small"];
    if (has(s, /\b1(?:\.\d+)?[\s-]*(?:inch|")/i)) return ["1in"];
    return [];
  },
};

// Lens mount. Fujifilm G and Hasselblad X share a medium-format group; Canon EF-M (2, discontinued) is too small for its
// own group and stays out. Anything with a built-in lens (fixed lenses, 360° pairs, action cams) is "Fixed lens".
const mount: SpecFilter = {
  id: "mount", label: "Lens mount",
  groups: [{ key: "sony-e", label: "Sony E" }, { key: "fuji-x", label: "Fujifilm X" }, { key: "canon-rf", label: "Canon RF" }, { key: "nikon-z", label: "Nikon Z" }, { key: "l", label: "L-Mount (Leica, Panasonic, Sigma)" }, { key: "mft", label: "Micro Four Thirds" }, { key: "leica-m", label: "Leica M" }, { key: "mf", label: "Medium-format mounts" }, { key: "fixed", label: "Fixed lens" }],
  classify: p => {
    const s = text(p.core);
    if (has(s, /sony e\b/i)) return ["sony-e"];
    if (has(s, /fuji\w* x mount/i)) return ["fuji-x"];
    if (has(s, /canon rf/i)) return ["canon-rf"];
    if (has(s, /nikon z/i)) return ["nikon-z"];
    if (has(s, /\bL-?mount/i)) return ["l"];
    if (has(s, /four thirds/i)) return ["mft"];
    if (has(s, /leica m\b/i)) return ["leica-m"];
    if (has(s, /fuji\w* g mount|hasselblad x/i)) return ["mf"];
    if (has(s, /mount/i)) return [];
    if (has(s, /fixed|360|fov|\d\s*mm\b.*\bf\/?\d|\blens/i)) return ["fixed"];
    return [];
  },
};

export default [sensor, mount];
