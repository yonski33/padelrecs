// SimRacingRecs' v2 palette and display font (owner mock AgaVcamisXwobUR5sY9CDn, 2026-11-16): carbon ink, warm white paper,
// a signal red-orange accent, a slate offset shadow and Chakra Petch headings, laid over the shared v2 pages' own tokens. The
// layout prints it only on sites that set niche.v2style, so every other site's pages are byte-identical. Score boxes keep the
// shared score colours (green 85+, yellow 70–84, white below; app/globals.css --score-*, owner 2026-11-18), not the accent.
const ROOTS = [".hv2-top", ".hv2", ".hw", ".pg2", ".ar", ".bv2", ".ct2", ".rk2", ".rl2", ".gd", ".lr2", ".qt", ".rf", ".shr"];
const RED = "oklch(0.7 0.19 30)", SLATE = "oklch(0.42 0.03 260)";
export const simracingV2Style = `
${ROOTS.map(r => `html ${r}`).join(",")}{--ink:#141519;--bg:#f7f7f4;--paper:#fff;--mute:#5d6069;--soft:#23252b;--text:#23252b;--faint:#8a8d96;--line:#d3d4d8;--dash:#d3d4d8;--dash2:#b9bbc2;--tile:#eeeee9;--acc:${RED};--marker:${RED};--mint:oklch(0.92 0.04 260);--cream:oklch(0.97 0.04 30);--display:"Chakra Petch",var(--qt-display,"Archivo"),system-ui,sans-serif}
html body:has(main.hv2),html body:has(main.ct2),html body:has(main.rk2),html body:has(main.pg2),html body:has(main.bv2),html body:has(main.gd),html body:has(main.hw),html body:has(main.lr2){background:#f7f7f4}
html .hv2 h1,html .hv2 h2,html .hv2 h3,html .hv2-qk{letter-spacing:-0.02em}
html .hv2 .hv2-qm{box-shadow:5px 5px 0 ${SLATE};border-radius:12px}
html .hv2 h1 .hl{background:${RED};border-radius:10px}
html .hv2 .hv2-subrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin-top:8px}
html .hv2 .hv2-subrow .hv2-sub{margin:0}
html .hv2 .hv2-hero{align-items:flex-start}
html .hv2 .hv2-list>li.top{background:oklch(0.98 0.02 30)}
html .hv2 .hv2-list>li:hover{background:oklch(0.975 0.025 30)}
html .hv2 .hv2-list>li{border-bottom:1.5px dashed var(--line)}
html .hv2 .hv2-chip.arm{background:oklch(0.92 0.04 260)}
html .hv2 .hv2-seg{flex-wrap:wrap;max-width:100%}
html .ct2 .ct2-list>li.first{background:oklch(0.98 0.02 30)}
`;
