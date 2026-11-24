// Product mentions as links (owner "Yes, queue it" 2026-11-23): when a review names another product the site has a page for,
// that name links to it. Built from the catalogue alone (no model calls, no stored aliases): each product's full name without
// the year, and its model name without the brand (and without a trailing core size) when that is distinctive (two words and 8+ letters, or one word with a digit,
// the same rule as lib/thread/mentions.ts). A name only links on a unique match: a key that two products share is dropped, a
// name followed by a generation ("Vapor Power" in "Vapor Power 2") is a different product, and the page's own product never
// links (its names still claim their text, so a part of them can't link elsewhere). Roman generations match their digits
// ("Pro IV" = "Pro 4"). Pure and shared: the server builds the index for the names a page's reviews use, the browser splits
// each text with it (live/mention-links.tsx). SkinRecs can pass its own rows.

export type MentionRow = { id: string; name: string; brand: string; slug?: string; year?: number | null };
/** Short names reviewers use (db/creators/aliases.json): per slug, plus base-model defaults allowed inside variant names. */
export type MentionAliases = { aliases?: Record<string, string[]>; defaults?: Record<string, string> };
/** One product's match keys as regex sources (case-insensitive, separators loose). */
/** `year`: the product's model year, when the catalogue keeps one row per year (a year the text names must match it). */
export type MentionKeys = { id: string; keys: string[]; year?: number; selfRef?: boolean };
export type Seg = { t: string; id?: string };

const ROMAN: Record<string, string> = { ii: "2", iii: "3", iv: "4", "2": "ii", "3": "iii", "4": "iv" };
const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A token, its roman/digit twin, and loose separators ("Pro-IV", "Pro IV", "pro 4").
// Letters and digits in one token may be split by a space or dash in reviews ("J2 CR", "J-2CR").
const tok = (w: string) => ROMAN[w] ? `(?:${esc(w)}|${ROMAN[w]})`
  : /[a-z]/.test(w) && /\d/.test(w) ? w.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/).map(esc).join("[\\s-]?") : esc(w);
// A year ("2026") after a name is not a generation: it is checked against the product's own year (splitMentions).
const GEN = "(?![^a-z0-9]+(?:\\d{1,2}(?![0-9])|ii|iii|iv|vi|gen\\d*|pro|max|plus)(?![a-z0-9]))";
/** `block`: words that, right after the name, make it a longer product's name ("12K" before "Alum": that is the Alum model). */
const source = (ws: string[], block: string[] = []) => `(?<![a-z0-9])${ws.map(tok).join("[^a-z0-9]+")}(?![a-z0-9])${GEN}`
  + (block.length ? `(?![^a-z0-9]+(?:${[...new Set(block)].map(esc).join("|")})(?![a-z0-9]))` : "");
const yearOf = (r: MentionRow): number | null => r.year ?? (Number(r.name.match(/\(?(20\d\d)\)?\s*$/)?.[1]) || null);
/** The year-bound forms of a name: "<name> 2026", "<name> (2026)" and "2026 <name>" mean that year's row only. */
const body = (ws: string[]) => ws.map(tok).join("[^a-z0-9]+");
const yearSources = (ws: string[], y: number) => [`(?<![a-z0-9])${body(ws)}(?![a-z0-9])\\s*\\(?${y}(?![0-9])\\)?`, `(?<![a-z0-9,])${y}\\s+${body(ws)}(?![a-z0-9])${GEN}`];

/** Self-references on a racket page (owner 2026-11-24): "the previous version", "last year's model", "its predecessor" mean the
 *  generation before this racket in its family; "the 2025 version" means that year's row of the family. They link to that row
 *  when the catalogue has it and never otherwise (no previous row: no link). The page's own year only claims its text.
 *  `family`: this racket's rows of other years (lib/thread/mention-years.ts selfFamily). */
export function selfRefKeys(self: MentionRow, family: MentionRow[]): MentionKeys[] {
  const sy = yearOf(self);
  if (!sy) return [];
  const fam = family.filter(r => r.id !== self.id).flatMap(r => { const y = yearOf(r); return y ? [{ r, y }] : []; });
  const prev = fam.filter(x => x.y < sy).sort((a, b) => b.y - a.y)[0]?.r;
  const NOUN = "(?:version|model|one|edition|racket|iteration|release|generation)", B = "(?<![a-z0-9])", E = "(?![a-z0-9])";
  const out: MentionKeys[] = [];
  if (prev) out.push({ id: prev.id, selfRef: true, keys: [
    `${B}(?:the|its) (?:previous|older|earlier|prior|old) ${NOUN}${E}`, `${B}last year['\u2019]s(?: ${NOUN})?${E}`, `${B}(?:the|its) predecessor${E}`] });
  for (const { r, y } of [...fam, { r: self, y: sy }]) out.push({ id: r.id, selfRef: true, keys: [`${B}(?:(?:the|its) )?${y} ${NOUN}${E}`] });
  return out;
}

/** The keys of each product (words), before the uniqueness check. */
function rawKeys(r: MentionRow): string[][] {
  const full = words(r.name.replace(/\s*\(?20\d\d\)?\s*$/, "")), brand = words(r.brand);
  const model = brand.length && brand.every((b, i) => full[i] === b) ? full.slice(brand.length) : [];
  const distinctive = (m: string[]) => (m.length >= 2 && m.join("").length >= 8) || (m.length === 1 && /^(?=.*\d)[a-z0-9]{4,}$/.test(m[0]!));
  // Reviews often drop the core size ("Black Opal" for "Black Opal 14mm"): the model without it is a key too, when still
  // distinctive (and, like every key, only when no other product shares it).
  const sized = /^\d+(?:\.\d+)?mm$/.test(model[model.length - 1] ?? "") ? model.slice(0, -1) : null;
  return [full, ...(distinctive(model) ? [model] : []), ...(sized && distinctive(sized) ? [sized] : [])].filter(k => k.length > 0);
}

const GEN_WORD = /^(\d+|ii|iii|iv|vi|gen\d*|pro|max|plus)$/;
/** True when `key` sits inside another product's name with more name after it ("Alpha Pro" inside "Vapor Alpha Pro Power"
 *  is that paddle); before a generation ("Vapor Power" in "Vapor Power 2") GEN already tells them apart. */
export function inside(key: string[], name: string[]): boolean {
  for (let i = 0; i + key.length <= name.length; i++) {
    if (!key.every((w, j) => name[i + j] === w)) continue;
    const next = name[i + key.length];
    // At the end of that name or before its generation: a shared key (counted) or a different generation (GEN), not this.
    if (next === undefined || GEN_WORD.test(next)) continue;
    return true;
  }
  return false;
}

/** Every product's unique keys. A key two products share links to neither, nor does a key that is part of another
 *  product's longer name; a key that only STARTS another product's name ("AT10 Genius 12K" in "AT10 Genius 12K Alum XTREM")
 *  stays but can't match when that name's next word follows, so the longer name always wins.
 *  `all` (sites with one row per model year): every row of every year, so a name that comes with a year ("... 2026") links
 *  to that year's row; and a year the text names must match the product's year (see splitMentions). */
export function mentionIndex(rows: MentionRow[], extra: MentionAliases = {}, all: MentionRow[] = []): MentionKeys[] {
  const bySlug = new Map(rows.map(r => [r.slug, r.id]));
  const own = (r: MentionRow) => [...rawKeys(r).map(k => k.join(" ")), ...((r.slug ? extra.aliases?.[r.slug] : undefined) ?? []).map(a => words(a).join(" "))];
  const all0 = rows.map(r => ({ id: r.id, full: rawKeys(r)[0] ?? [], keys: own(r) }));
  // Base-model defaults ("Coral" = the original Coral 16mm) may sit inside a variant's name; they still need to be unique.
  const dflt = new Map(Object.entries(extra.defaults ?? {}).map(([a, slug]) => [words(a).join(" "), bySlug.get(slug)]).filter((x): x is [string, string] => !!x[1]));
  for (const [k, id] of dflt) all0.find(a => a.id === id)?.keys.push(k);
  const count = new Map<string, number>();
  for (const a of all0) for (const k of new Set(a.keys)) count.set(k, (count.get(k) ?? 0) + 1);
  // Other products' names, without their brand too ("vapor alpha pro power"), so a model key can't hide inside them.
  const names = all0.flatMap(a => rawKeys(rows.find(r => r.id === a.id)!).map(k => ({ id: a.id, w: k })));
  /** null: the key is part of another product's name (dropped); else the words that must not follow it (longer names it starts). */
  const blockers = (id: string, k: string): string[] | null => {
    const kw = k.split(" "), block: string[] = [];
    for (const n of names) {
      if (n.id === id) continue;
      for (let i = 0; i + kw.length <= n.w.length; i++) {
        if (!kw.every((w, j) => n.w[i + j] === w)) continue;
        const next = n.w[i + kw.length];
        if (next === undefined || GEN_WORD.test(next)) continue;
        if (i === 0) block.push(next); else return null;
      }
    }
    return block;
  };
  const rowOf = new Map(rows.map(r => [r.id, r]));
  const main: MentionKeys[] = all0.map(a => { const y = yearOf(rowOf.get(a.id)!);
    return { id: a.id, ...(y ? { year: y } : {}), keys: [...new Set(a.keys)].filter(k => k && count.get(k) === 1).flatMap(k => {
      if (dflt.get(k) === a.id) return [source(k.split(" "))];
      const bl = blockers(a.id, k); return bl ? [source(k.split(" "), bl)] : []; }) }; }).filter(a => a.keys.length > 0);
  // Year-bound names, from every year's row: "<name> 2026" links to that year's row only, even when the name is shared.
  const yr: MentionKeys[] = [], seenYK = new Map<string, number>();
  const yk = (r: MentionRow) => { const y = yearOf(r); return y ? rawKeys(r).map(k => `${k.join(" ")}|${y}`) : []; };
  for (const r of all) for (const k of new Set(yk(r))) seenYK.set(k, (seenYK.get(k) ?? 0) + 1);
  for (const r of all) { const y = yearOf(r); if (!y) continue;
    const ks = [...new Set(rawKeys(r).map(k => k.join(" ")))].filter(k => seenYK.get(`${k}|${y}`) === 1);
    if (ks.length) yr.push({ id: r.id, year: y, keys: ks.flatMap(k => yearSources(k.split(" "), y)) }); }
  return [...main, ...yr];
}

/** Splits `text` into plain and linked parts. `seen` holds the ids already linked in this card (first mention only); the
 *  page's own product (selfId) claims its text but never links. */
export function splitMentions(text: string, index: MentionKeys[], selfId: string, seen: Set<string>): Seg[] {
  const hits: { a: number; b: number; id: string; year?: number }[] = [];
  for (const p of index) for (const k of p.keys) {
    const re = new RegExp(k, "gi");
    for (let m = re.exec(text); m; m = re.exec(text)) hits.push({ a: m.index, b: m.index + m[0].length, id: p.id, year: p.year });
  }
  // Longest name first at any place; overlapping shorter names drop out.
  hits.sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a));
  const out: Seg[] = []; let at = 0;
  for (const h of hits) {
    if (h.a < at) continue;
    // The own product and an already linked one still claim their text (stays plain), so nothing shorter links inside it.
    // A year the text names next to the name (after it, or before it) must be the product's own: another year is another
    // racket, so the name stays plain rather than opening a different year's page.
    const near = text.slice(h.b).match(/^\s*\(?(20\d\d)(?![0-9])/) ?? text.slice(0, h.a).match(/(?<![,\d])(20\d\d)\s+$/);
    const yearClash = !!(near && h.year && Number(near[1]) !== h.year);
    const link = h.id !== selfId && !seen.has(h.id) && !yearClash;
    if (h.a > at) out.push({ t: text.slice(at, h.a) });
    out.push(link ? { t: text.slice(h.a, h.b), id: h.id } : { t: text.slice(h.a, h.b) });
    if (link) seen.add(h.id);
    at = h.b;
  }
  if (at < text.length) out.push({ t: text.slice(at) });
  return out;
}

/** The ids the texts name (other than selfId), in first-seen order: what the page needs to send to the browser. */
export function namedIds(texts: (string | null | undefined)[], index: MentionKeys[], selfId: string): string[] {
  const seen = new Set<string>();
  for (const t of texts) if (t) splitMentions(t, index, selfId, seen);
  return [...seen];
}
