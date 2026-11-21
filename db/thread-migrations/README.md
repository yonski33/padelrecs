# Thread redesign migrations: applied to PadelRecs on 2026-11-19 (owner OK in the Thread session)

Now `drizzle/0024_trait_votes.sql`, `drizzle/0025_comments.sql`, `drizzle/0026_model_line.sql`, run with `npm run db:migrate`
for padel only (NICHE=padel). Routine followed: dry run (each file in a rolled-back transaction: all clean), backup of
padelrecs.rackets (233 rows, `work/backups/thread-migrations-2026-11-19/`), OK, write, verify.

Verified after the write: padel's migration history ends at 0026; `trait_votes`, `comments`, `comment_votes` exist with RLS
on and 0 rows; `rackets.model_line` exists (nullable, 0 tagged); no other site's schema has the new tables.

Other sites: they share drizzle/, so their next `db:migrate` would add these (empty) tables too. `rackets.model_line` is not
mapped in db/schema.ts until every site's schema has it, so their racket reads are unaffected; read it with SQL on padel.

Next (not done): the trait-vote and comment endpoints and UI, and a dry-run script that fills model_line from
lib/compare-pairs.ts modelFamily for the owner to review before its own write.

## 0027 trait admin: applied to PadelRecs on 2026-11-19 (owner OK typed in the Thread session)

`drizzle/0027_trait_admin.sql` adds `trait_overrides` (per racket and group: review counts replacing the prefill file's,
and a freeze; trait `_all` = the whole racket) and `trait_admin_log` (every Traits-tab change, with what it removed or
replaced). Additive only. Routine: dry run (in a rolled-back transaction: clean), backup of padelrecs.trait_votes (9 rows,
`work/backups/trait-admin-2026-11-19/`), write with `scripts/migrate.ts` (NICHE=padel), verify: history ends at 0027,
both tables exist in padelrecs only with RLS on and 0 rows, trait_votes (9) and rackets (233) unchanged.

## AudioRecs (audiorecs schema): 0021-0027 APPLIED 2026-11-21 (owner typed OK in the AudioRecs session)

Done as planned below: dry run (each of the 7 and all together in rolled-back transactions: clean), backup
`work/backups/audio-thread-migrations-2026-11-21/` (rackets 449, external_reviews 11,805, reviews 131, 21 migration rows),
write with a journal trimmed at 0027. Verified: history ends at 0027 (28 rows); evidence, trait_votes, comments,
comment_votes, trait_overrides and trait_admin_log exist in audiorecs with RLS on and 0 rows; the three tables' row counts
unchanged; /api/trait-votes, /api/comments and /api/thread-poll answer 200 on the preview. 0028 and later not run.

### The plan (as written before the run)

AudioRecs was frozen on 2026-11-14, so its history stops at **0020_quick_take** (21 applied). The Thread pages need
**0021 to 0027**, seven migrations, not four:

| File | What it does on audiorecs | Needed for |
|---|---|---|
| 0021_report_level | adds 3 nullable text columns (external_reviews.player_level, level_quote; reviews.level_quote) | the drizzle chain only |
| 0022_trait_override | adds nullable rackets.trait_override (jsonb) | the drizzle chain only |
| 0023_evidence | creates the empty `evidence` table (RLS on) | the evidence store, later reader passes |
| 0024_trait_votes | creates `trait_votes` (RLS on) | "How does it sound?" votes |
| 0025_comments | creates `comments` + `comment_votes` (RLS on) | Discussion and guide comments |
| 0026_model_line | adds nullable rackets.model_line + check + index | the drizzle chain only |
| 0027_trait_admin | creates `trait_overrides` + `trait_admin_log` (RLS on) | the owner's Traits tab, sentiment overrides |

All additive: new nullable columns and new empty tables, no data changed. The v3 pages (2026-11-21 rebuild) need nothing
newer: the community feed's REVIEW / QUESTION / TIP flair is worked out from the post text (lib/thread/feed.ts), its posts are
0025's comments, the poll is product_votes (0017, applied), and member marks read 0028's tables only where accounts are on. 0028 (accounts) and later stay out, as on skin
and disc golf (accounts are off on AudioRecs).

Routine, once the owner types OK in the session that runs it:
1. Dry run: each of 0021-0027 in a rolled-back transaction on audiorecs; expect exactly these 7 pending.
2. Backup: audiorecs.rackets (449 rows), external_reviews (11,805), reviews (131) and the audiorecs migration rows to
   `work/backups/audio-thread-migrations-<date>/`, checked with `db:check-export`.
3. Write: `NICHE=audio npm run db:migrate` with a journal trimmed at 0027 (as skin did), nothing else.
4. Verify: history ends at 0027 (28 rows); the 5 new tables exist in audiorecs only, RLS on, 0 rows; row counts above
   unchanged; /api/trait-votes and /api/comments answer 200 on the preview.
