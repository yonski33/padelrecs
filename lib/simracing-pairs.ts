// SimRacingRecs "Works with" (PM / owner 2026-11-18): product pairs read only from the makers' compatibility table
// (db/compat/simracing.json, Grok 2026-11-18, every row with a maker link; lib/simracing-compat.ts checks it). Never a
// brand guess. Pure, so tests feed it plain rows.
//   - a pair holds when either product's own row names the other (or a maker-wide phrase covers it: "all MOZA bases");
//   - an "unknown" cell says nothing; a fixed-rim base takes no rims;
//   - a pair the makers' own checkers disagree on is "check": kept out (summary section C, plus the T3PM / T80 one);
//   - notes the buyer needs ride along: a rim that needs a hub, the G Racing Adapter on console.

export type CompatTable = Partial<Record<"wheelbases" | "wheels" | "pedals" | "shifters", Record<string, Record<string, string>>>>;
export type PairItem = { name: string; brand: string; shape: string | null };
export type Pair = { name: string; shape: string; note?: string };
const WB = "Wheelbase", W = "Wheel", P = "Pedals", S = "Shifter / handbrake";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A cell with something the maker said: "unknown" alone says nothing, "unknown port list; MOZA chart: …" still does. */
const known = (t: string | undefined) => !!t && t.replace(/\bunknown\b[^;]*;?/gi, "").trim().length > 0;
/** The text a product list is read from: "except …" and "not compatible with …" clauses name products that don't fit. */
const positive = (t: string) => t.replace(/\b(except|not compatible with|not listed|leaves? out|not on)\b[^;)]*/gi, " ");
/** The ways the makers' text names a product: its name without the brand, that without "8 Nm" / "Edition" tails, and
 *  its first model code with a digit ("T80", "G29", "TH8A", "T-LCM", "P500"). */
export function aliases(p: PairItem): string[] {
  const brand = p.name.split(" ")[0], model = p.name.slice(brand.length + 1).replace(/^Racing /, "");
  const out = new Set([p.name, model, model.replace(/\s+\d+(?:\.\d+)?\s*Nm$/i, ""), model.replace(/\s+(Pedals|Pedal Set|Wheel Add-On|Add-On|Steering Wheel|Wheel|Wheelbase|Direct Drive Wheelbase|Shifter|Handbrake)$/i, "")]);
  const code = model.split(/\s+/).find(w => /\d/.test(w) && /[A-Za-z]/.test(w) && w.length >= 2);
  if (code) out.add(code);
  // A short all-caps model word ("HGP", "SGP", "HBP"): matched only inside the brand's own rows (see mentions).
  const caps = model.split(/\s+/)[0];
  if (/^[A-Z]{2,4}\d?$/.test(caps)) out.add(caps);
  // Never a bare type word ("Pedals" from "Simucube Pedals", "Handbrake" from "Heusinkveld Handbrake"): the text uses them generically.
  return [...out].filter(a => a.length >= 2 && !/^(DD|GT|Pro|Sport|Ultra|Ultimate|Edition|Pedals?|Pedal Set|Handbrake|Shifter|Wheel|Wheelbase|Steering Wheel)$/i.test(a)).sort((a, b) => b.length - a.length);
}
/** The catalogue products of `shapes` a text names, longest name first (a matched span isn't read twice). */
export function mentions(text: string, items: PairItem[], shapes: string[], ownBrand?: string): PairItem[] {
  let t = ` ${text} `; const out: PairItem[] = [];
  // Another brand's product counts only when the text names that brand too ("Logitech G29"), never on a bare model word.
  const brandIn = (b: string) => b === ownBrand || new RegExp(`\\b${esc(b.replace(/-/g, "[- ]?"))}`, "i").test(text) || (b === "sim-lab" && /sim-?lab/i.test(text));
  const cands = items.filter(x => x.shape && shapes.includes(x.shape) && (ownBrand === undefined || brandIn(x.brand))).flatMap(x => aliases(x).map(a => ({ x, a }))).sort((p, q) => q.a.length - p.a.length);
  // Products sharing an alias ("CSL DD" for the 5 Nm and the 8 Nm) all match it; then its span is read no more.
  for (const a of [...new Set(cands.map(c => c.a))]) {
    // Spaces and hyphens are loose ("T300 RS" is the T300RS, "T-GT II" the TGT II).
    const body = esc(a).replace(/(?:\\-|\s)+/g, "[\\s-]*").replace(/([A-Za-z])(?=\d)|(\d)(?=[A-Za-z])/g, "$1$2[\\s-]?");
    const re = new RegExp(`(?<![A-Za-z0-9-])${body}(?![A-Za-z0-9])`, "i");
    if (!re.test(t)) continue;
    for (const { x } of cands.filter(c => c.a === a)) if (!out.includes(x)) out.push(x);
    t = t.replace(new RegExp(`(?<![A-Za-z0-9-])${body}(?![A-Za-z0-9])`, "gi"), " ");
  }
  return out;
}
/** Maker-wide phrases ("all MOZA bases", "Asetek Racing wheelbases except Initium", "Simucube 2") as product sets. */
export function wide(text: string, items: PairItem[], shape: string): PairItem[] {
  const t = text.toLowerCase(), of = (brand: string, test: (n: string) => boolean = () => true) => items.filter(x => x.shape === shape && x.brand === brand && test(x.name));
  let out: PairItem[] = [];
  if (shape === WB) {
    if (/all (current )?moza (force feedback )?(wheel ?)?bases/.test(t)) out.push(...of("moza"));
    if (/all fanatec wheel ?bases/.test(t)) out.push(...of("fanatec"));
    if (/all clubsport bases/.test(t)) out.push(...of("fanatec", n => /ClubSport/.test(n)));
    if (/all podium bases/.test(t)) out.push(...of("fanatec", n => /Podium/.test(n)));
    if (/asetek racing wheelbases/.test(t)) out.push(...of("asetek", n => !(/except initium/.test(t) && /Initium/.test(n))));
    if (/simagic wheelbase/.test(t)) out.push(...of("simagic"));
    // Simagic names families: "Alpha EVO (Series)" is every EVO base, "Alpha Series" the first-generation Alphas.
    if (/alpha evo\b/.test(t)) out.push(...of("simagic", n => /Alpha EVO/.test(n)));
    if (/alpha series/.test(t)) out.push(...of("simagic", n => /Alpha/.test(n) && !/EVO/.test(n)));
    if (/logitech g direct[- ]drive/.test(t)) out.push(...of("logitech", n => /RS50|PRO/.test(n)));
    if (/simucube 2\b/.test(t)) out.push(...of("simucube", n => /Simucube 2/.test(n)));
    if (/simucube 3\b/.test(t)) out.push(...of("simucube", n => /Simucube 3/.test(n)));
  }
  if (shape === P && /all fanatec pedals/.test(t)) out.push(...of("fanatec"));
  out = out.filter((x, i, a) => a.indexOf(x) === i);
  return out;
}
/** "A <-> B: only…", "A paired with B; …" lines of the summary's section C: pairs the makers' checkers disagree on. */
export function checkPairs(summary: string, items: PairItem[]): [string, string][] {
  const sec = summary.split(/^### C\./m)[1]?.split(/^### D\./m)[0] ?? "";
  const all = items.map(x => x.shape!).filter(Boolean), one = (s: string) => mentions(s, items, [...new Set(all)])[0]?.name;
  const out: [string, string][] = [];
  for (const line of sec.split("\n")) {
    const m = /^- (.+?) <-> (.+?):/.exec(line) ?? /^- (.+?) paired with (.+?)[;,]/.exec(line);
    const a = m && one(m[1]), b = m && one(m[2]);
    if (a && b) out.push([a, b]);
  }
  return out;
}

const GSERIES = /^Logitech G(29|920|923)$/;
/** Every product's "works with" list, both ways, from the table. */
export function buildPairs(table: CompatTable, items: PairItem[], check: [string, string][]): Record<string, Pair[]> {
  const byName = new Map(items.map(x => [x.name, x])), out = new Map<string, Map<string, Pair>>();
  const isCheck = (a: string, b: string) => check.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const fixed = new Set(Object.entries(table.wheelbases ?? {}).filter(([, r]) => /^yes/i.test(r.fixed_rim ?? "")).map(([n]) => n));
  const add = (a: PairItem, b: PairItem, note?: string) => {
    if (a === b || isCheck(a.name, b.name)) return;
    const rimOnFixed = (a.shape === W && fixed.has(b.name)) || (b.shape === W && fixed.has(a.name));
    if (rimOnFixed) return;
    for (const [x, y] of [[a, b], [b, a]] as const) {
      const m = out.get(x.name) ?? out.set(x.name, new Map()).get(x.name)!;
      const prev = m.get(y.name);
      m.set(y.name, { name: y.name, shape: y.shape!, ...(note ?? prev?.note ? { note: note ?? prev!.note } : {}) });
    }
  };
  const from = (kind: keyof CompatTable, col: string, shapes: string[], noteOf?: (row: Record<string, string>, target: PairItem, me: PairItem) => string | undefined) => {
    for (const [name, row] of Object.entries(table[kind] ?? {})) {
      const me = byName.get(name), text = row[col];
      if (!me || !known(text)) continue;
      const targets = [...mentions(positive(text), items, shapes, me.brand), ...shapes.flatMap(sh => wide(text, items, sh))].filter((x, i, a) => a.indexOf(x) === i);
      for (const t of targets) add(me, t, noteOf?.(row, t, me));
    }
  };
  const hubNote = (row: Record<string, string>) => /rs wheel hub/i.test(row.needs ?? "") ? "needs the RS Wheel Hub"
    : /\bhub\b/i.test(row.needs ?? "") && /needed|only via a hub|needs? a hub|a hub:|requires/i.test(`${row.needs} ${row.fits_bases}`) ? "needs a hub" : undefined;
  from("wheels", "fits_bases", [WB], hubNote);
  // A rim that only fits through a hub names its bases in the hub line: the brand's QR bases, with the note.
  for (const [name, row] of Object.entries(table.wheels ?? {})) {
    const me = byName.get(name);
    if (me && hubNote(row) && known(row.fits_bases)) for (const t of mentions(positive(`${row.fits_bases} ${row.notes ?? ""}`), items, [WB], me.brand)) add(me, t, hubNote(row));
  }
  // The G Racing Adapter: a Logitech RS / PRO add-on on a G29 / G920 / G923 needs it on console (Logitech's pages).
  const adapter = (row: Record<string, string>, t: PairItem, me: PairItem) => /racing adapter/i.test(Object.values(row).join(" ")) && (GSERIES.test(t.name) || GSERIES.test(me.name))
    && !(GSERIES.test(t.name) && GSERIES.test(me.name)) && [t, me].some(x => /^Logitech (RS|PRO)/.test(x.name)) ? "needs the G Racing Adapter on console" : undefined;
  from("pedals", "plugs_into_bases", [WB], adapter);
  from("shifters", "plugs_into_bases", [WB], adapter);
  from("wheelbases", "pedal_ports", [P], adapter);
  from("wheelbases", "shifter_ports", [S], adapter);
  return Object.fromEntries([...out].map(([k, m]) => [k, [...m.values()].sort((a, b) => a.shape.localeCompare(b.shape) || a.name.localeCompare(b.name))]));
}
