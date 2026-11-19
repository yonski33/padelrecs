# Thread redesign: migrations waiting for the owner's OK

Not in `drizzle/` on purpose: `npm run db:migrate` cannot pick these up. Nothing here has run on any database.
PadelRecs only (`padelrecs` schema). Routine once the owner types an OK in the Thread session:

1. Dry run: each file is one transaction ending in a check query. Run a copy with its last `COMMIT;` changed to
   `ROLLBACK;` (`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <copy>`): it shows the result and leaves nothing behind.
2. Backup: `pg_dump --schema=padelrecs --table='padelrecs.rackets'` (only 0026 touches an existing table, adding a nullable column).
3. OK from the owner, then move the file into `drizzle/` with the next number and a `meta/_journal.json` entry, mirror the
   table in `db/schema.ts`, and run `npm run db:migrate` for padel.
4. Verify: the check query at the end of each file, then the Thread page section turns on (see each file's header).

| File | What | Turns on |
|---|---|---|
| 0024_trait_votes.sql | One vote per trait group per device, changeable | Racket page "How does it play?" vote grid; home and ranking "How players vote them" from votes |
| 0025_comments.sql | Comments with one level of replies and ▲▼ votes, moderated like reviews | Comments on racket, ranking and guide pages |
| 0026_model_line.sql | `rackets.model_line` tag | "The Metalbone line" block on racket pages (today: "More from <brand>") |
