// CoffeeRecs' v2 palette (PM 2026-11-18, design v2 with product page v11c): dark-roast ink, warm paper, the crema accent the
// site already uses (#f0a35e) and a roast-brown offset shadow, over the shared v2 pages' own tokens. Printed only on sites that
// set niche.v2style, so every other site's pages are byte-identical. Score boxes keep the shared score colours (green 85+,
// yellow 70–84, white below; app/globals.css --score-*, owner 2026-11-18), never the accent.
const ROOTS = [".hv2-top", ".hv2", ".hw", ".pg2", ".ar", ".bv2", ".ct2", ".rk2", ".rl2", ".gd", ".lr2", ".qt", ".rf", ".shr"];
const CREMA = "#f0a35e", ROAST = "#4a2511";
export const coffeeV2Style = `
${ROOTS.map(r => `html ${r}`).join(",")}{--ink:#2b1a12;--bg:#faf6f3;--paper:#fff;--mute:#6b5a50;--soft:#3a2a22;--text:#3a2a22;--faint:#9a8a80;--line:#e2d6cd;--dash:#e2d6cd;--dash2:#cdbdb2;--tile:#f3ece6;--acc:${CREMA};--marker:${CREMA};--mint:#f6eee9;--cream:#fff5eb}
html body:has(main.hv2),html body:has(main.ct2),html body:has(main.rk2),html body:has(main.pg2),html body:has(main.bv2),html body:has(main.gd),html body:has(main.hw),html body:has(main.lr2){background:#faf6f3}
html .hv2 .hv2-qm{box-shadow:5px 5px 0 ${ROAST};border-radius:12px}
html .hv2 h1 .hl{background:${CREMA};border-radius:10px}
html .hv2 .hv2-list>li.top{background:#fff8f1}
html .hv2 .hv2-list>li:hover{background:#fdf3ea}
html .hv2 .hv2-seg{flex-wrap:wrap;max-width:100%}
html .ct2 .ct2-list>li.first{background:#fff8f1}
html .rf .v11-tile{border:1.5px dashed var(--line);background:var(--tile);color:var(--mute);font-weight:600;font-size:11px}
html .rf .rv-badge:has(b.hi){background:var(--score-g)}
html .rf .rv-badge:has(b.mid){background:var(--score-y)}
html .rf .rv-badge:has(b.plain),html .rf .rv-badge:has(b:not(.hi):not(.mid)){background:var(--score-w)}
`;
