// SimRacingRecs compatibility table (PM 2026-11-18, PR B step 2; Grok sources it from the makers' pages with
// grok/simracing-data/PROMPT-simracing-compat-table.md). Four CSVs (wheelbases / wheels / pedals / shifters _compat.csv) are
// checked and turned into db/compat/simracing.json by scripts/simracing-compat-import.mts. Pure, so tests feed it strings.
//   Rules: every row names a catalogue product of the file's type, exactly; every row has a maker link; no product twice.

/** The makers' own sites (by catalogue brand). A link on any other host (a shop, a forum) doesn't count as a source. */
export const MAKER_HOSTS: Record<string, string[]> = {
  asetek: ["asetek.com"], fanatec: ["fanatec.com"], heusinkveld: ["heusinkveld.com"], logitech: ["logitechg.com", "logitech.com", "logi.com"],
  moza: ["mozaracing.com"], "sim-lab": ["sim-lab.eu"], simagic: ["simagic.com"], simucube: ["simucube.com"], thrustmaster: ["thrustmaster.com"],
};
export const COMPAT_FILES = { wheelbases: "Wheelbase", wheels: "Wheel", pedals: "Pedals", shifters: "Shifter / handbrake" } as const;
export type CompatKind = keyof typeof COMPAT_FILES;
/** The columns each file must have (the prompt's tables). */
export const COMPAT_COLUMNS: Record<CompatKind, string[]> = {
  wheelbases: ["name", "fixed_rim", "qr_system", "platforms", "editions", "pedal_ports", "shifter_ports", "source", "notes"],
  wheels: ["name", "needs", "fits_bases", "console_note", "source", "notes"],
  pedals: ["name", "connection", "works_on_pc_alone", "plugs_into_bases", "console", "source", "notes"],
  shifters: ["name", "type", "connection", "works_on_pc_alone", "plugs_into_bases", "console", "source", "notes"],
};

/** A small CSV reader (quoted fields, doubled quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
    if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(c => c.trim())) rows.push(row); row = [];
    } else cell += ch;
  }
  row.push(cell); if (row.some(c => c.trim())) rows.push(row);
  const [head = [], ...body] = rows, keys = head.map(h => h.trim().toLowerCase());
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

export type CatalogItem = { name: string; brand: string; shape: string | null };
export type CompatRow = Record<string, string> & { name: string; source: string };
/** Checks one file's rows against the catalogue: the problems (empty when clean) and the rows that passed. */
export function checkCompat(kind: CompatKind, rows: Record<string, string>[], catalog: CatalogItem[]): { problems: string[]; ok: CompatRow[]; missing: string[] } {
  const problems: string[] = [], ok: CompatRow[] = [], seen = new Set<string>(), shape = COMPAT_FILES[kind];
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  for (const c of COMPAT_COLUMNS[kind]) if (rows.length && !cols.includes(c)) problems.push(`${kind}: missing column "${c}"`);
  for (const r of rows) {
    const item = catalog.find(x => x.name === r.name);
    if (!item) { problems.push(`${kind}: "${r.name}" is not a catalogue name${near(r.name, catalog)}`); continue; }
    if (item.shape !== shape) { problems.push(`${kind}: "${r.name}" is a ${item.shape}, not a ${shape}`); continue; }
    if (seen.has(r.name)) { problems.push(`${kind}: "${r.name}" twice`); continue; }
    seen.add(r.name);
    const links = (r.source ?? "").split(/[\s;|]+/).filter(u => /^https?:\/\//.test(u));
    const hosts = MAKER_HOSTS[item.brand] ?? [];
    if (!links.some(u => { try { const h = new URL(u).hostname; return hosts.some(m => h === m || h.endsWith(`.${m}`)); } catch { return false; } }))
      { problems.push(`${kind}: "${r.name}" has no ${item.brand} maker link (${r.source || "no source"})`); continue; }
    ok.push(r as CompatRow);
  }
  const missing = catalog.filter(x => x.shape === shape && !seen.has(x.name)).map(x => x.name);
  return { problems, ok, missing };
}
/** " (did you mean …?)" for a name that differs only in case, spacing or punctuation. */
function near(name: string, catalog: CatalogItem[]): string {
  const k = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const m = catalog.find(x => k(x.name) === k(name));
  return m ? ` (did you mean "${m.name}"?)` : "";
}
