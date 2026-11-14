import type postgres from "postgres";
import type { Report } from "../lib/quick-take-check";
import { niche } from "../lib/niche";

/** Every stored report on one product, in the shape the quick-take checker reads (lib/quick-take-check.ts), plus the extras a
 *  writer uses (tags, level, nickname, saved tips). Own reviews count by their verdict like everywhere else: 4–5 positive,
 *  3 mixed, 1–2 negative. */
export type ExportedReport = Report & { tags: string[]; level?: string | null; nickname?: string | null; tips?: unknown };
export async function quickTakeReports(client: postgres.Sql, schema: string, racketId: string): Promise<ExportedReport[]> {
  const web = await client.unsafe(`select id, source_platform, source_name, source_url, source_date, created_at, sentiment, summary, excerpt, excerpt_translation, source_language, tags, tips
    from "${schema}".external_reviews where racket_id = $1 order by coalesce(source_date, created_at), id`, [racketId]) as unknown as Record<string, unknown>[];
  const own = await client.unsafe(`select id, rating, review_text, alias, player_level, tags, created_at, tips
    from "${schema}".reviews where racket_id = $1 and status = 'approved' order by created_at, id`, [racketId]) as unknown as Record<string, unknown>[];
  const s = (v: unknown) => typeof v === "string" && v.trim() ? v : null;
  return [
    ...web.map(e => ({
      id: String(e.id), kind: "web" as const, platform: String(e.source_platform), sourceName: s(e.source_name), url: s(e.source_url),
      date: s(e.source_date), sentiment: (s(e.sentiment) as Report["sentiment"]) ?? null,
      // Our words (the summary, or our translation of a foreign excerpt): readable, never quotable.
      summary: [s(e.summary), s(e.excerpt_translation)].filter(Boolean).join(" · ") || null,
      // The player's words, quotable, but only when they wrote in English.
      words: s(e.excerpt) && (!s(e.source_language) || e.source_language === "en") ? s(e.excerpt) : null,
      tags: (e.tags as string[]) ?? [], tips: e.tips ?? undefined,
    })),
    ...own.map(v => {
      const rating = Number(v.rating);
      return {
        id: String(v.id), kind: "own" as const, platform: niche.site.name, sourceName: null, url: null, date: s(v.created_at)?.slice(0, 10) ?? null,
        sentiment: (rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative") as Report["sentiment"], summary: null, words: s(v.review_text),
        tags: (v.tags as string[]) ?? [], level: s(v.player_level), nickname: s(v.alias), tips: v.tips ?? undefined,
      };
    }),
  ];
}
