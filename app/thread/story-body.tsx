// A story's text, from the safe Markdown subset (lib/thread/story-markdown.ts). Whitelist only: p, h2, ul/ol/li, blockquote,
// strong and em, all plain React text; nothing is set as HTML. Shared by the story page and the composer's Preview.
import type { ReactNode } from "react";
import { parseStory, type Inline } from "../../lib/thread/story-markdown";

const line = (xs: Inline[]): ReactNode[] => xs.map((x, i) => x.t === "b" ? <strong key={i}>{x.s}</strong> : x.t === "i" ? <em key={i}>{x.s}</em> : <span key={i}>{x.s}</span>);
export function StoryBody({ body }: { body: string }) {
  return <div className="th-story-body">{parseStory(body).map((b, i) => b.t === "h" ? <h2 key={i} className="th-story-h">{line(b.inl)}</h2>
    : b.t === "q" ? <blockquote key={i}>{line(b.inl)}</blockquote>
    : b.t === "ul" ? <ul key={i}>{b.items.map((it, j) => <li key={j}>{line(it)}</li>)}</ul>
    : b.t === "ol" ? <ol key={i}>{b.items.map((it, j) => <li key={j}>{line(it)}</li>)}</ol>
    : "inl" in b ? <p key={i}>{line(b.inl)}</p> : null)}</div>;
}
