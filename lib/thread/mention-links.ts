// Product mentions as links (owner "Yes, queue it" 2026-11-23): when a review names another product the site has a page for,
// that name links to it. Built from the catalogue alone (no model calls, no stored aliases): each product's full name without
// the year, and its model name without the brand (and without a trailing core size) when that is distinctive (two words and 8+ letters, or one word with a digit,
// the same rule as lib/thread/mentions.ts). A name only links on a unique match: a key that two products share is dropped, a
// name followed by a generation ("Vapor Power" in "Vapor Power 2") is a different product, and the page's own product never
// links (its names still claim their text, so a part of them can't link elsewhere). Roman generations match their digits
// ("Pro IV" = "Pro 4"). Pure and shared: the server builds the index for the names a page's reviews use, the browser splits
// each text with it (live/mention-links.tsx). SkinRecs can pass its own rows.

export type MentionRow = { id: string; name: string; brand: string };
/** One product's match keys as regex sources (case-insensitive, separators loose). */
export type MentionKeys = { id: string; keys: string[] };
export type Seg = { t: string; id?: string };

const ROMAN: Record<string, string> = { ii: "2", iii: "3", iv: "4", "2": "ii", "3": "iii", "4": "iv" };
const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A token, its roman/digit twin, and loose separators ("Pro-IV", "Pro IV", "pro 4").
// Letters and digits in one token may be split by a space or dash in reviews ("J2 CR", "J-2CR").
const tok = (w: string) => ROMAN[w] ? `(?:${esc(w)}|${ROMAN[w]})`
  : /[a-z]/.test(w) && /\d/.test(w) ? w.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/).map(esc).join("[\\s-]?") : esc(w);
const GEN = "(?![^a-z0-9]+(?:\\d+|ii|iii|iv|vi|gen\\d*|pro|max|plus)(?![a-z0-9]))";
const source = (ws: string[]) => `(?<![a-z0-9])${ws.map(tok).join("[^a-z0-9]+")}(?![a-z0-9])${GEN}`;

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

/** Every product's unique keys. A key two products share links to neither. */
export function mentionIndex(rows: MentionRow[]): MentionKeys[] {
  const all = rows.map(r => ({ id: r.id, keys: rawKeys(r).map(k => k.join(" ")) }));
  const count = new Map<string, number>();
  for (const a of all) for (const k of new Set(a.keys)) count.set(k, (count.get(k) ?? 0) + 1);
  return all.map(a => ({ id: a.id, keys: [...new Set(a.keys)].filter(k => count.get(k) === 1).map(k => source(k.split(" "))) }))
    .filter(a => a.keys.length > 0);
}

/** Splits `text` into plain and linked parts. `seen` holds the ids already linked in this card (first mention only); the
 *  page's own product (selfId) claims its text but never links. */
export function splitMentions(text: string, index: MentionKeys[], selfId: string, seen: Set<string>): Seg[] {
  const hits: { a: number; b: number; id: string }[] = [];
  for (const p of index) for (const k of p.keys) {
    const re = new RegExp(k, "gi");
    for (let m = re.exec(text); m; m = re.exec(text)) hits.push({ a: m.index, b: m.index + m[0].length, id: p.id });
  }
  // Longest name first at any place; overlapping shorter names drop out.
  hits.sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a));
  const out: Seg[] = []; let at = 0;
  for (const h of hits) {
    if (h.a < at) continue;
    // The own product and an already linked one still claim their text (stays plain), so nothing shorter links inside it.
    const link = h.id !== selfId && !seen.has(h.id);
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
