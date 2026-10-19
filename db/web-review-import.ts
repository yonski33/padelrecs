import { z } from "zod";
import { externalReviews, rackets } from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";
import type { Niche } from "../lib/niche/types";

/**
 * Publishing approved candidates from the research agent's queue (research-agent/data/candidates.jsonl) as web reviews.
 * Only approved items with an exact quote are published; the site shows web reviews as the source's own words,
 * so our own summaries are never presented as quotes.
 */
const candidate = z.object({
  id: z.string().min(1),
  racket_name: z.string().min(1),
  source_platform: z.string(),
  source_name: z.string().min(1),
  source_url: z.string().url(),
  source_date: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
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

/** Same page regardless of tracking parameters, mobile/old hosts, fragments or a trailing slash. */
export function sameSource(url: string) {
  const u = new URL(url);
  u.hash = ""; u.search = "";
  return `${u.hostname.toLowerCase().replace(/^(www|m|old|new|np)\./, "")}${u.pathname.replace(/\/+$/, "")}`;
}

type Row = typeof externalReviews.$inferInsert;
export type Plan = { rows: (Row & { candidateId: string })[]; skipped: { candidate: Candidate; reason: string }[] };

export function planImport(candidates: Candidate[], site: { rackets: { id: string; name: string }[]; external: { id: string; racketId: string; sourceUrl: string }[] }, niche: Pick<Niche, "sourcePlatforms" | "tags">, now = new Date()): Plan {
  const plan: Plan = { rows: [], skipped: [] };
  const ids = new Set(site.external.map(e => e.id));
  const quoted = new Set(site.external.map(e => `${e.racketId}|${sameSource(e.sourceUrl)}`));
  const tagBank = new Set(niche.tags.map(t => t.label));
  for (const c of candidates) {
    if (c.status !== "approved") continue;
    const skip = (reason: string) => plan.skipped.push({ candidate: c, reason });
    if (ids.has(webReviewId(c.id))) { skip("already published"); continue; }
    const excerpt = c.excerpt?.trim();
    if (!excerpt || excerpt.length < 20) { skip("no exact quote of at least 20 characters (summaries are never published as quotes)"); continue; }
    const racket = site.rackets.find(r => r.name.toLowerCase() === c.racket_name.trim().toLowerCase());
    if (!racket) { skip(`no racket named "${c.racket_name}" on the site`); continue; }
    if (!niche.sourcePlatforms.includes(c.source_platform)) { skip(`source platform "${c.source_platform}" is not one the site uses`); continue; }
    const tags = [...new Set(c.tags)];
    if (tags.some(t => !tagBank.has(t)) || tags.length > 3) { skip("tags outside the site's tag bank, or more than 3"); continue; }
    const key = `${racket.id}|${sameSource(c.source_url)}`;
    if (quoted.has(key)) { skip("this source is already quoted for this racket on the site"); continue; }
    quoted.add(key);
    plan.rows.push({
      candidateId: c.id, id: webReviewId(c.id), racketId: racket.id, excerpt,
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
    db.select({ id: rackets.id, name: rackets.name }).from(rackets),
    db.select({ id: externalReviews.id, racketId: externalReviews.racketId, sourceUrl: externalReviews.sourceUrl }).from(externalReviews),
  ]);
  return { rackets: r, external: e };
}

/** Inserts the planned rows in one transaction; an existing id aborts nothing and is simply left alone. */
export async function applyImport(db: Database, plan: Plan) {
  if (!plan.rows.length) return 0;
  return db.transaction(async tx => {
    const inserted = await tx.insert(externalReviews).values(plan.rows.map(({ candidateId: _, ...row }) => row)).onConflictDoNothing({ target: externalReviews.id }).returning({ id: externalReviews.id });
    return inserted.length;
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
