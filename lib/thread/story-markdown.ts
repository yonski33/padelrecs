// Story formatting (owner 2026-11-20): a small, safe Markdown subset kept in the story's plain body field (no migration).
// Blocks: paragraphs (blank lines between), "## " subheadings, "- " bullet lists, "1. " numbered lists, "> " quotes.
// Inline: **bold** and *italic*. Nothing else is markup: no HTML, no images, no links (a URL stays plain text, and the shop
// link rule in lib/thread/stories.ts still applies). Old plain-text stories parse to the same paragraphs as before. Pure.
export type Inline = { t: "text" | "b" | "i"; s: string };
export type Block = { t: "p" | "h" | "q"; inl: Inline[] } | { t: "ul" | "ol"; items: Inline[][] };

const KIND = (line: string) => /^##\s+/.test(line) ? "h" : /^[-*]\s+/.test(line) ? "ul" : /^\d{1,3}[.)]\s+/.test(line) ? "ol" : /^>\s?/.test(line) ? "q" : "p";
const strip = (line: string, k: string) => k === "h" ? line.replace(/^##\s+/, "") : k === "ul" ? line.replace(/^[-*]\s+/, "") : k === "ol" ? line.replace(/^\d{1,3}[.)]\s+/, "") : k === "q" ? line.replace(/^>\s?/, "") : line;

/** **bold** and *italic* (or _italic_); an unmatched marker stays as text. */
export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|(?<![A-Za-z0-9])_([^_\n]+?)_(?![A-Za-z0-9])/g;
  let at = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > at) out.push({ t: "text", s: text.slice(at, m.index) });
    out.push(m[1] !== undefined ? { t: "b", s: m[1] } : { t: "i", s: m[2] ?? m[3] });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ t: "text", s: text.slice(at) });
  return out;
}

export function parseStory(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n"), blocks: Block[] = [];
  let cur: { k: string; lines: string[] } | null = null;
  const flush = () => {
    if (!cur) return;
    const k = cur.k, ls = cur.lines;
    if (k === "ul" || k === "ol") blocks.push({ t: k, items: ls.map(l => inline(l.trim())) });
    else if (k === "h") for (const l of ls) blocks.push({ t: "h", inl: inline(l.trim()) });
    else { const text = ls.join("\n").trim(); if (text) blocks.push({ t: k as "p" | "q", inl: inline(text) }); }
    cur = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    const k = KIND(line.trimStart());
    // A heading is always its own block; a list or quote line continues its block; a paragraph line continues a paragraph.
    if (!cur || cur.k !== k || k === "h") { flush(); cur = { k, lines: [] }; }
    cur.lines.push(strip(line.trimStart(), k));
  }
  flush();
  return blocks;
}

/** The words a reader sees (markup removed): for the minimum length and the description. */
export function plainText(body: string) {
  return parseStory(body).map(b => "items" in b ? b.items.map(i => i.map(x => x.s).join("")).join("\n") : b.inl.map(x => x.s).join("")).join("\n\n");
}
