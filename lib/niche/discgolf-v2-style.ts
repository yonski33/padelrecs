// DiscGolfRecs' v2 palette and display font (owner mock S8ZGdwXLf1VdGPcYrpeoQ1, 2026-11-16): pine ink, warm paper, disc orange,
// a green offset shadow and Familjen Grotesk headings, laid over the shared v2 pages' own tokens. The layout prints it only on
// sites that set niche.v2style, so every other site's pages are byte-identical.
const ROOTS = [".hv2-top", ".hv2", ".hw", ".pg2", ".ar", ".bv2", ".ct2", ".rk2", ".rl2", ".gd", ".lr2", ".qt", ".rf", ".shr"];
const ORANGE = "oklch(0.78 0.16 55)", GREEN = "oklch(0.55 0.09 160)";
export const discgolfV2Style = `
${ROOTS.map(r => `html ${r}`).join(",")}{--ink:#16251d;--bg:#f8f7f1;--paper:#fff;--mute:#55645a;--soft:#26352c;--text:#26352c;--faint:#7c897f;--line:#cdd3cc;--dash:#cdd3cc;--dash2:#b9c2ba;--tile:#efefe6;--acc:${ORANGE};--marker:${ORANGE};--mint:oklch(0.93 0.05 150);--cream:oklch(0.96 0.04 85);--display:"Familjen Grotesk",var(--qt-display,"Archivo"),system-ui,sans-serif}
html body:has(main.hv2),html body:has(main.ct2),html body:has(main.rk2),html body:has(main.pg2),html body:has(main.bv2),html body:has(main.gd),html body:has(main.hw),html body:has(main.lr2){background:#f8f7f1}
html .hv2 h1,html .hv2 h2,html .hv2 h3,html .hv2-qk{letter-spacing:-0.03em}
html .hv2 .hv2-qm{box-shadow:5px 5px 0 ${GREEN};border-radius:14px}
html .hv2 h1 .hl{background:${ORANGE};border-radius:12px}
html .hv2 .hv2-subrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin-top:8px}
html .hv2 .hv2-subrow .hv2-sub{margin:0}
html .hv2 .hv2-hero{align-items:flex-start}
html .hv2 .hv2-list>li.top{background:oklch(0.98 0.03 60)}
html .hv2 .hv2-list>li:hover{background:oklch(0.97 0.035 60)}
html .hv2 .hv2-list>li{border-bottom:1.5px dashed var(--line)}
html .hv2 .hv2-sc.mid b{background:oklch(0.92 0.08 60)}
html .hv2 .hv2-chip.arm{background:oklch(0.93 0.05 150)}
html .hv2 .hv2-seg{flex-wrap:wrap;max-width:100%}
html .ct2 .ct2-list>li.first{background:oklch(0.98 0.04 60)}
`;
