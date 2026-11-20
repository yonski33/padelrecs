// Member stories (PadelRecs Thread pilot, owner 2026-11-20): the rules a story is checked against before it is saved. Pure,
// so the API, the composer and tests share them. The body is a small Markdown subset (lib/thread/story-markdown.ts);
// paragraphs are split on blank lines, and old plain-text stories read as before.
import { plainText } from "./story-markdown";
export const STORY_TITLE = { min: 8, max: 100 } as const;
export const STORY_BODY = { min: 400, max: 12000 } as const;
export const STORY_RACKETS_MAX = 5;

/** Shop and affiliate links are never allowed in a story (owner); other links send it to the queue (the spam check). */
const SHOP = /\b(amzn\.[a-z]+|amazon\.[a-z.]+|ebay\.[a-z.]+|aliexpress\.|padelnuestro|padel-?market|zona-?de-?padel|decathlon\.|shop\.|store\.)|[?&](tag|aff|affid|aff_id|affiliate|ref|ref_id|partner|utm_[a-z]+)=|\/(aff|affiliate|go|recommends)\//i;
export const hasShopLink = (text: string) => SHOP.test(text);

/** What's wrong with a story, in the words shown under the composer; null when it can be saved. */
export function storyProblem(s: { title: string; body: string; rackets?: string[] }): string | null {
  // The minimum counts the words a reader sees, not the formatting marks (lib/thread/story-markdown.ts).
  const title = s.title.trim(), raw = s.body.trim(), body = plainText(raw).trim();
  if (title.length < STORY_TITLE.min) return `Give it a title of ${STORY_TITLE.min} characters or more.`;
  if (title.length > STORY_TITLE.max) return `Keep the title under ${STORY_TITLE.max} characters.`;
  if (body.length < STORY_BODY.min) return `A story needs ${STORY_BODY.min} characters at least (${body.length} so far).`;
  if (raw.length > STORY_BODY.max) return `Keep it under ${STORY_BODY.max.toLocaleString("en-US")} characters.`;
  if (hasShopLink(title) || hasShopLink(raw)) return "Shop and affiliate links aren't allowed in stories.";
  if ((s.rackets?.length ?? 0) > STORY_RACKETS_MAX) return `Tag ${STORY_RACKETS_MAX} rackets at most.`;
  return null;
}
/** The paragraphs of a story body (blank lines between them; single line breaks stay inside a paragraph). */
export const paragraphs = (body: string) => body.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
/** The post's address: the title in plain words, then a short id so two stories with one title never share it. */
export function storySlug(title: string, id: string) {
  const base = title.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return `${base || "story"}-${id.replace(/-/g, "").slice(0, 6)}`;
}
/** The post's description for search and shares: its first paragraph, cut at a word near 155 characters. */
export function storyDescription(body: string) {
  const first = paragraphs(plainText(body))[0] ?? "";
  if (first.length <= 155) return first;
  const cut = first.slice(0, 155), at = cut.lastIndexOf(" ");
  return `${cut.slice(0, at > 100 ? at : 155).replace(/[,.;:!?]+$/, "")}…`;
}
