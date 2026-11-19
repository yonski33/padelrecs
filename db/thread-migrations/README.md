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
