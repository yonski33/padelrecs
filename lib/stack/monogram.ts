// A tool's tile until it has a real logo: its initials on a square, ink for Build and green for Grow. A plain placeholder
// (the padel placeholder is a racket shape), drawn as an SVG data address so it costs no request.
import type { Side } from "./catalog";

export const initials = (name: string) => {
  const words = name.replace(/\.[a-z]+$/i, "").split(/[\s.-]+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const w = words[0] ?? "?", caps = w.match(/[A-Z]/g) ?? [];
  return w.length <= 3 ? w : caps.length >= 2 ? caps.slice(0, 2).join("") : w[0].toUpperCase();
};
const FILL: Record<Side, string> = { build: "#1d1b26", grow: "#2f6b3c" };
export function monogram(name: string, side: Side) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${FILL[side]}"/>`
    + `<text x="32" y="41" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${initials(name).length > 2 ? 18 : 24}" fill="#fbfaf6">${initials(name)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
