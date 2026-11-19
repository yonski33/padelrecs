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
