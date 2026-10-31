import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { externalReviews, rackets, reviewVotes } from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";
import type { Niche } from "../lib/niche/types";
import type { Sentiment } from "../lib/review-options";

/**
 * Publishing approved candidates from the research agent's queue (research-agent/data/candidates.jsonl) as web reviews.
 * Each web review shows our summary and, when there is one, the source's exact words as a quote, plus the moderated sentiment,
 * so our own words are never presented as the source's. Already-published items are updated when their text changed.
 */
const candidate = z.object({
  id: z.string().min(1),
  racket_name: z.string().min(1),
  source_platform: z.string(),
  source_name: z.string().min(1),
  source_url: z.string().url(),
  source_date: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  // A source in another language: its ISO 639-1 code and our English translation of the excerpt (the excerpt stays verbatim).
  source_language: z.string().regex(/^[a-z]{2}$/).nullable().optional(),
  excerpt_translation: z.string().nullable().optional(),
  sentiment: z.enum(["positive", "negative", "mixed"]).nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.string(),
}).passthrough();
export type Candidate = z.infer<typeof candidate>;

export function parseCandidates(jsonl: string): Candidate[] {
  return jsonl.split("\n").filter(l => l.trim()).map((l, i) => {
    const parsed = candidate.safeParse(JSON.parse(l));
    if (!parsed.success) throw new Error(`Line ${i + 1} of the queue is not a valid candidate`);
    return parsed.data;
  });
}

/** Web review ids are derived from the candidate id, so publishing twice can never create a second copy. */
export const webReviewId = (candidateId: string) => `research-${candidateId}`;

/** Same page regardless of tracking parameters, mobile/old hosts, fragments or a trailing slash. A YouTube comment is its video
 *  plus its comment id (…/watch?v=<video>&lc=<comment>), so two comments under one video stay two sources. On a forum script page
 *  (…/index.php?threads/<thread>/post-<id>) the query is the page itself, so it is kept, minus tracking parameters. */
export function sameSource(url: string) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase().replace(/^(www|m|old|new|np)\./, "");
  const query = host === "youtube.com"
    ? ["v", "lc"].map(k => u.searchParams.get(k) ? `${k}=${u.searchParams.get(k)}` : "").filter(Boolean).join("&")
    : u.pathname.endsWith(".php") ? u.search.slice(1).split("&").filter(p => p && !/^(utm_\w+|fbclid|gclid)=/i.test(p)).join("&") : "";
  return `${host}${u.pathname.replace(/\/+$/, "")}${query ? `?${query}` : ""}`;
}

type Row = typeof externalReviews.$inferInsert;
type Update = { candidateId: string; id: string; excerpt: string | null; summary: string | null; sentiment: Sentiment | null; tags: string[]; sourceLanguage: string | null; excerptTranslation: string | null };
/** A published web review whose candidate the research agent withdrew (its source no longer says what we quote). */
type Removal = { candidateId: string; id: string };
export type Plan = { rows: (Row & { candidateId: string })[]; updates: Update[]; removals: Removal[]; skipped: { candidate: Candidate; reason: string }[] };

type SiteReview = { id: string; racketId: string; sourceUrl: string; excerpt: string | null; summary: string | null; sentiment: Sentiment | null; tags: string[]; sourceLanguage?: string | null; excerptTranslation?: string | null };
export function planImport(candidates: Candidate[], site: { rackets: { id: string; name: string; year?: number }[]; external: SiteReview[] }, niche: Pick<Niche, "sourcePlatforms" | "tags">, now = new Date()): Plan {
  const plan: Plan = { rows: [], updates: [], removals: [], skipped: [] };
  const byId = new Map(site.external.map(e => [e.id, e]));
  const quoted = new Set(site.external.map(e => `${e.racketId}|${sameSource(e.sourceUrl)}`));
  const tagBank = new Set(niche.tags.map(t => t.label));
  for (const c of candidates) {
    if (c.status === "withdrawn") {
      if (byId.has(webReviewId(c.id))) plan.removals.push({ candidateId: c.id, id: webReviewId(c.id) });
      continue;
    }
    if (c.status !== "approved" && c.status !== "published") continue;
    const skip = (reason: string) => plan.skipped.push({ candidate: c, reason });
    const excerpt = c.excerpt?.trim() && c.excerpt.trim().length >= 20 ? c.excerpt.trim() : null;
    const summary = c.summary?.trim() && c.summary.trim().length >= 30 ? c.summary.trim() : null;
    const sentiment = c.sentiment ?? null;
    // English sources carry no language; a foreign quote is only shown through its translation, so it needs one.
    const sourceLanguage = c.source_language && c.source_language !== "en" ? c.source_language : null;
    const excerptTranslation = sourceLanguage && excerpt && c.excerpt_translation?.trim() ? c.excerpt_translation.trim() : null;
    const live = byId.get(webReviewId(c.id));
    if (live) {
      // Published before: bring the site's text and tags in line with the queue, never anything else.
      const tags = [...new Set(c.tags)].filter(t => tagBank.has(t)).slice(0, 3);
      if ((excerpt || summary) && (live.excerpt !== excerpt || live.summary !== summary || live.sentiment !== sentiment || JSON.stringify(live.tags) !== JSON.stringify(tags) || (live.sourceLanguage ?? null) !== sourceLanguage || (live.excerptTranslation ?? null) !== excerptTranslation)) plan.updates.push({ candidateId: c.id, id: live.id, excerpt, summary, sentiment, tags, sourceLanguage, excerptTranslation });
      continue;
    }
    if (c.status !== "approved") continue;
    if (!excerpt && !summary) { skip("needs an exact quote (20+ characters) or a summary (30+ characters)"); continue; }
    if (sourceLanguage && excerpt && !excerptTranslation) { skip(`a quote in "${sourceLanguage}" needs an English translation (excerpt_translation)`); continue; }
    const wanted = c.racket_name.trim().toLowerCase();
    // Queued under a name that still ended in the model year (PickleballRecs dropped years from names on 2026-10-22).
    const racket = site.rackets.find(r => r.name.toLowerCase() === wanted) ?? site.rackets.find(r => r.year !== undefined && `${r.name} ${r.year}`.toLowerCase() === wanted);
    if (!racket) { skip(`no racket named "${c.racket_name}" on the site`); continue; }
    if (!niche.sourcePlatforms.includes(c.source_platform)) { skip(`source platform "${c.source_platform}" is not one the site uses`); continue; }
    const tags = [...new Set(c.tags)];
    if (tags.some(t => !tagBank.has(t)) || tags.length > 3) { skip("tags outside the site's tag bank, or more than 3"); continue; }
    const key = `${racket.id}|${sameSource(c.source_url)}`;
    if (quoted.has(key)) { skip("this source is already quoted for this racket on the site"); continue; }
    quoted.add(key);
    plan.rows.push({
      candidateId: c.id, id: webReviewId(c.id), racketId: racket.id, excerpt, summary, sentiment, sourceLanguage, excerptTranslation,
      sourcePlatform: c.source_platform, sourceName: c.source_name.trim(), sourceUrl: c.source_url.trim(),
      // Only full dates are shown on the site; a month or year alone would display as the 1st.
      sourceDate: c.source_date && /^\d{4}-\d{2}-\d{2}$/.test(c.source_date) ? c.source_date : null,
      externalRating: null, tags, createdAt: now.toISOString(),
    });
  }
  return plan;
}

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
export async function siteState(db: Pick<Database, "select">) {
  const [r, e] = await Promise.all([
    db.select({ id: rackets.id, name: rackets.name, year: rackets.year }).from(rackets),
    db.select({ id: externalReviews.id, racketId: externalReviews.racketId, sourceUrl: externalReviews.sourceUrl, excerpt: externalReviews.excerpt, summary: externalReviews.summary, sentiment: externalReviews.sentiment, tags: externalReviews.tags, sourceLanguage: externalReviews.sourceLanguage, excerptTranslation: externalReviews.excerptTranslation }).from(externalReviews),
  ]);
  return { rackets: r, external: e };
}

/** Inserts new rows, applies text updates and deletes withdrawn web reviews (and their helpful votes) in one transaction;
 *  an existing id is never overwritten by an insert. */
export async function applyImport(db: Database, plan: Plan) {
  if (!plan.rows.length && !plan.updates.length && !plan.removals.length) return { inserted: 0, updated: 0, removed: 0 };
  return db.transaction(async tx => {
    const inserted = plan.rows.length ? await tx.insert(externalReviews).values(plan.rows.map(({ candidateId: _, ...row }) => row)).onConflictDoNothing({ target: externalReviews.id }).returning({ id: externalReviews.id }) : [];
    let updated = 0;
    for (const u of plan.updates) {
      const done = await tx.update(externalReviews).set({ excerpt: u.excerpt, summary: u.summary, sentiment: u.sentiment, tags: u.tags, sourceLanguage: u.sourceLanguage, excerptTranslation: u.excerptTranslation }).where(eq(externalReviews.id, u.id)).returning({ id: externalReviews.id });
      updated += done.length;
    }
    let removed = 0;
    if (plan.removals.length) {
      const ids = plan.removals.map(r => r.id);
      await tx.delete(reviewVotes).where(and(eq(reviewVotes.reviewType, "web"), inArray(reviewVotes.reviewId, ids)));
      removed = (await tx.delete(externalReviews).where(inArray(externalReviews.id, ids)).returning({ id: externalReviews.id })).length;
    }
    return { inserted: inserted.length, updated, removed };
  });
}

/** The queue with published items marked, so the research agent shows them as on the site. */
export function markPublished(jsonl: string, published: { candidateId: string; id: string }[], now = new Date()) {
  const byCandidate = new Map(published.map(p => [p.candidateId, p.id]));
  return jsonl.split("\n").filter(l => l.trim()).map(l => {
    const c = JSON.parse(l);
    const siteId = byCandidate.get(c.id);
    return JSON.stringify(siteId ? { ...c, status: "published", published_at: now.toISOString(), site_review_id: siteId } : c);
  }).join("\n") + "\n";
}
