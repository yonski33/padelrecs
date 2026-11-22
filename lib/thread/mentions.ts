// "Similar paddles mentioned" (owner mockup Racket Page Hybrid v19, 2026-11-22): other catalogue products the creator reviews
// name, counted once per review, most mentioned first. A name matches on its full name without the year, or on its model
// name alone when that is distinctive (two words or more, 8+ letters), so "Perseus Pro IV" counts but "Coral" alone does not.
// A one-word model with a digit ("J6CR") is distinctive too. Pure: the page passes its reviews and the catalogue rows.
const norm = (t: string) => ` ${t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
export type Mention<R> = { row: R; n: number };
export function mentions<R extends { id: string; name: string; brand: string; current?: boolean }>(
  reviews: { summary: string; more?: string | null; compared?: string | null; short?: string }[], rows: R[], selfId: string, min = 1, max = 4): Mention<R>[] {
  const texts = reviews.map(r => norm([r.summary, r.more, r.compared].filter(Boolean).join(" ")));
  const out: Mention<R>[] = [];
  for (const row of rows) {
    if (row.id === selfId || row.current === false) continue;
    const full = norm(row.name.replace(/\s*\(?20\d\d\)?\s*$/, "")).trim();
    const model = full.startsWith(norm(row.brand).trim()) ? full.slice(norm(row.brand).trim().length).trim() : "";
    // A name followed by a generation ("Vapor Power" in "Vapor Power 2") is a different paddle.
    const keys = [full, ...((model.split(" ").length >= 2 && model.replace(/ /g, "").length >= 8) || /^(?=.*\\d)[a-z0-9]{4,}$/.test(model) ? [model] : [])]
      .map(k => new RegExp(` ${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (?!(\\d+|ii|iii|iv|v|vi|gen\\d*|pro)\\b)`));
    const n = texts.filter(t => keys.some(k => k.test(t))).length;
    if (n >= min) out.push({ row, n });
  }
  return out.sort((a, b) => b.n - a.n || a.row.name.localeCompare(b.row.name)).slice(0, max);
}
