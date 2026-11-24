// The admin's "Latest comments" page (app/funtimes/comments): pure helpers for its address, its page links and bulk order.
// No database or Next imports, so tests load it directly.

export const COMMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type CommentStatus = typeof COMMENT_STATUSES[number];
export type StatusFilter = CommentStatus | "all";
/** Comments per page on the admin list (owner 2026-11-24: 50). */
export const COMMENTS_PER_PAGE = 50;
/** The most comments one bulk action takes: one page. */
export const BULK_MAX = COMMENTS_PER_PAGE;

export type CommentsQuery = { status: StatusFilter; q: string; page: number; racket: string };

/** Read the list's address (?status=&q=&p=&racket=): anything odd falls back to all statuses, no words, page 1. */
export function parseCommentsQuery(sp: Record<string, string | string[] | undefined>): CommentsQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const s = one(sp.status);
  const status: StatusFilter = (COMMENT_STATUSES as readonly string[]).includes(s) ? s as CommentStatus : "all";
  const q = one(sp.q).trim().slice(0, 200);
  const n = parseInt(one(sp.p), 10);
  const page = Number.isFinite(n) && n >= 1 ? Math.min(n, 10_000) : 1;
  const racket = one(sp.racket).trim().slice(0, 100);
  return { status, q, page, racket: /^[A-Za-z0-9_-]+$/.test(racket) ? racket : "" };
}

/** The list's address for a filter, leaving out the defaults so links stay short. */
export function commentsHref(query: Partial<CommentsQuery>, base = "/funtimes/comments") {
  const p = new URLSearchParams();
  if (query.status && query.status !== "all") p.set("status", query.status);
  if (query.q) p.set("q", query.q);
  if (query.racket) p.set("racket", query.racket);
  if (query.page && query.page > 1) p.set("p", String(query.page));
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

export type PageLookup = {
  /** A racket (product) by id: its name and public address, or null when it's gone. */
  racket: (id: string) => { name: string; href: string } | null;
  /** A guide key's public address, or null when the site has no such guide. */
  guide: (key: string) => string | null;
  /** The site's way to write a Thread address (lib/thread/look.ts th); defaults to the address as is. */
  th?: (href: string) => string;
};

/** Where a comment lives ("racket:<id>", "ranking:<slug>", "guide:<key>", "story:<slug>"), as a label and its real address
 *  on the site. href is null when the page can't be found any more. */
export function commentPageTarget(page: string, look: PageLookup): { kind: string; label: string; href: string | null } {
  const th = look.th ?? ((h: string) => h);
  const at = page.indexOf(":"), kind = at > 0 ? page.slice(0, at) : "", key = at > 0 ? page.slice(at + 1) : "";
  if (!key) return { kind: "other", label: page || "Unknown page", href: null };
  if (kind === "racket") { const r = look.racket(key); return r ? { kind, label: r.name, href: th(r.href) } : { kind, label: "A removed product", href: null }; }
  if (kind === "ranking") return { kind, label: `Ranking: ${key.replace(/-/g, " ")}`, href: th(`/rankings/${key}`) };
  if (kind === "guide") { const g = look.guide(key); return { kind, label: `Guide: ${key.replace(/-/g, " ")}`, href: g ? th(g) : null }; }
  if (kind === "story") return { kind, label: `Story: ${key.replace(/-/g, " ")}`, href: th(`/stories/${key}`) };
  return { kind: "other", label: page, href: null };
}

/** Bulk order: replies before the comments they answer, so a bulk delete that takes a comment and its replies removes the
 *  comment outright instead of leaving it as "[removed]". Ids not in `rows` are dropped; duplicates go. */
export function bulkOrder(ids: string[], rows: { id: string; parentId: string | null }[]) {
  const byId = new Map(rows.map(r => [r.id, r]));
  const wanted = [...new Set(ids)].filter(id => byId.has(id));
  return [...wanted.filter(id => byId.get(id)!.parentId), ...wanted.filter(id => !byId.get(id)!.parentId)];
}

/** Escape a word for an ILIKE pattern (% and _ match literally). */
export const likeWord = (w: string) => `%${w.replace(/[%_\\]/g, m => `\\${m}`)}%`;
