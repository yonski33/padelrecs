// A story's text, from the safe Markdown subset (lib/thread/story-markdown.ts). Whitelist only: p, h2, ul/ol/li, blockquote,
// strong and em, all plain React text; nothing is set as HTML. Shared by the story page and the composer's Preview.
// `points` (PadelRecs Story v3, owner design 2026-11-21): a paragraph that opens with a bold "1. Something." shows as a
// numbered point, a big numeral beside the bold words as its heading and the rest as its text.
import type { ReactNode } from "react";
import { parseStory, type Inline } from "../../lib/thread/story-markdown";

const line = (xs: Inline[]): ReactNode[] => xs.map((x, i) => x.t === "b" ? <strong key={i}>{x.s}</strong> : x.t === "i" ? <em key={i}>{x.s}</em> : <span key={i}>{x.s}</span>);
/** "1. Progress happens fast." in bold at the start of a paragraph → its number, heading and the text after it. */
export function pointOf(inl: Inline[]): { n: string; head: string; rest: Inline[] } | null {
  const m = inl[0]?.t === "b" ? /^(\d{1,2})[.)]\s+([\s\S]+)$/.exec(inl[0].s.trim()) : null;
  if (!m) return null;
  const rest = inl.slice(1).map((x, i) => i === 0 ? { ...x, s: x.s.replace(/^\s+/, "") } : x).filter(x => x.s);
  return { n: m[1], head: m[2], rest };
}
export function StoryBody({ body, points = false }: { body: string; points?: boolean }) {
  return <div className="th-story-body">{parseStory(body).map((b, i) => {
    const pt = points && b.t === "p" ? pointOf(b.inl) : null;
    if (pt) return <div key={i} className="th-story-pt"><span className="n" aria-hidden="true">{pt.n}</span>
      <div><h2 className="th-story-h"><span className="sr-only">{`${pt.n}. `}</span>{pt.head}</h2>{pt.rest.length > 0 && <p>{line(pt.rest)}</p>}</div></div>;
    return b.t === "h" ? <h2 key={i} className="th-story-h">{line(b.inl)}</h2>
      : b.t === "q" ? <blockquote key={i}>{line(b.inl)}</blockquote>
      : b.t === "ul" ? <ul key={i}>{b.items.map((it, j) => <li key={j}>{line(it)}</li>)}</ul>
      : b.t === "ol" ? <ol key={i}>{b.items.map((it, j) => <li key={j}>{line(it)}</li>)}</ol>
      : "inl" in b ? <p key={i}>{line(b.inl)}</p> : null;
  })}</div>;
}
