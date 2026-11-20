// A reply to a reply in Thread comments (owner 2026-11-20): it starts with "@Name " to show who is answered, and posts under
// the same top-level comment (one indent level). The mention alone isn't a comment. Pure, for the composer and tests.
export const mentionOf = (name: string) => `@${name} `;
export const withoutMention = (text: string, mention?: string) => mention && text.startsWith(mention.trim()) ? text.slice(mention.trim().length) : text;
