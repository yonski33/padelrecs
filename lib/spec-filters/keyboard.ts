import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// KeyboardRecs, approved by the owner (2026-11-14). Switches and weight are skipped (86 distinct switch values; the Rapid
// trigger and Low-profile categories already cover the main split; nobody filters keyboards by weight).

// Layout size classes as RTINGS and Corsair name them; 96% and 98% share the "compact full" group. Split is a layout
// rather than a size but buyers look for it, so it keeps its own group.
const layout: SpecFilter = {
  id: "layout", label: "Layout",
  groups: [{ key: "full", label: "Full size (100%)" }, { key: "96", label: "96–98%" }, { key: "tkl", label: "TKL (80%)" }, { key: "75", label: "75%" }, { key: "65", label: "65%" }, { key: "60", label: "60%" }, { key: "split", label: "Split" }],
  classify: p => {
    const s = text(p.balance);
    if (has(s, /split/i)) return ["split"];
    if (has(s, /full/i) || has(s, /\b100\s*%/)) return ["full"];
    if (has(s, /\b9[4-9]\s*%/)) return ["96"];
    if (has(s, /tkl|tenkeyless|\b8[07]\s*%/i)) return ["tkl"];
    if (has(s, /\b75\s*%/)) return ["75"];
    if (has(s, /\b65\s*%/)) return ["65"];
    if (has(s, /\b60\s*%/)) return ["60"];
    return [];
  },
};

// Wired only, a 2.4 GHz receiver (LIGHTSPEED, HyperSpeed, SLIPSTREAM, Logi Bolt, Unifying) and Bluetooth. Tri-mode boards
// sit in both wireless groups; "Wireless (Bluetooth) + wired" is Bluetooth only.
const connection: SpecFilter = {
  id: "conn", label: "Connection",
  groups: [{ key: "wired", label: "Wired only" }, { key: "24", label: "2.4 GHz receiver" }, { key: "bt", label: "Bluetooth" }],
  classify: p => {
    const s = text(p.core); if (!s) return [];
    const keys: string[] = [];
    if (has(s, /2\.4\s*GHz|lightspeed|hyperspeed|slipstream|bolt|unifying/i)) keys.push("24");
    if (has(s, /bluetooth/i)) keys.push("bt");
    if (!keys.length && !has(s, /wireless/i) && has(s, /wired|usb/i)) keys.push("wired");
    return keys;
  },
};

export default [layout, connection];
