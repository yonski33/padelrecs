# PadelRecs — Next.js / Vercel migration

A standalone Next.js App Router + TypeScript + Drizzle/PostgreSQL repository. Supabase supplies PostgreSQL and admin authentication. Vercel hosts the app. Public review submissions do not require accounts.

This copy preserves the existing interface and admin workflows: player review moderation, manual web reviews, new-racket creation, and editing racket specifications. It has no Vinext, Cloudflare Worker, D1, Sites deployment, or ChatGPT identity dependency.

## Keep RedRecs untouched

This repository is exclusively for **PadelRecs**. Do not reuse the `RedRecs` / `reddit-digest-next` repository, Vercel project, Supabase database, auth project, domains, environment variables, integrations, or production branches.

The intended GitHub repository is `yonski33/padelrecs`. New Vercel and Supabase project names must be `padelrecs`, in the new **PadelRecs** Supabase organization. Record the exact new IDs in `deployment/targets.json` only after checking the names in their dashboards. Before any cloud write or deployment, read back the selected resource and confirm its name and ID belong to PadelRecs.

The known pre-existing Supabase project is explicitly blocked in code. Database and auth connections also refuse to run until the new PadelRecs project ref is recorded. A database URL for another Supabase project is rejected even if the environment variable name is correct.

## One codebase, several Recs sites

PadelRecs is the first of several niche sites (PickleballRecs, TennisRecs, GolfRecs, GamingRecs) served by this same code. Each Vercel project sets `NICHE` (unset = `padel`):

- `lib/niche/<niche>.ts` holds everything niche-specific that is text or data: site name and domain, product words ("racket"), theme colours and rating-icon images, rating categories (mapped onto the fixed `*_rating` columns), player-profile options, spec fields, quick tags, source platforms, SEO and share-card copy, About and 404 copy. `lib/niche/types.ts` documents every field.
- `app/art/<niche>.tsx` holds the drawings: product icon by shape with brand marks, and the logo / rating icon. Register new modules in `app/art/index.ts` and `lib/niche/index.ts`.
- Live sites: padelrecs.com (Vercel project `padelrecs`, `NICHE` unset) pickleballrecs.com (Vercel project `pickleballrecs`, `NICHE=pickleball`) skinrecs.com (Vercel project `skinrecs`, `NICHE=skin`) tennisrecs.com (Vercel project `tennisrecs`, `NICHE=tennis`) and runningrecs.com (Vercel project `runningrecs`, `NICHE=running`); all build from `main` of this repo and share the Frankfurt database. `deployment/targets.json` `vercelProjects` lists them.
- Each niche stores its data in its own Postgres schema (`padelrecs`, …) of the one Frankfurt Supabase project. `deployment/targets.json` `nicheSchemas` must list it, or every connection is refused.
- `drizzle/*.sql` is generated for `padelrecs`; `npm run db:migrate` rewrites it for the active niche's schema (`db/migrations.ts`) and tracks other niches in their own `drizzle.__drizzle_migrations_<schema>` table. Run every `db:*` script with the right `NICHE=…`. Exports record their schema, and `db:import` refuses a snapshot from another schema unless `--from-other-schema` is given.

## Local setup

Requires Node.js 22.13+ and npm.

```sh
npm ci
cp .env.example .env.local
```

Create the new Supabase project as described in [DEPLOYMENT.md](./DEPLOYMENT.md), record its ref in `deployment/targets.json`, and fill `.env.local`. Keep credentials out of Git.

```sh
npm run db:migrate
npm run dev
```

Open http://localhost:3000. `DATABASE_URL` is needed for catalog pages. The admin sign-in page can show its unconfigured state before credentials are supplied.

## Checks without cloud credentials

```sh
npm run typecheck
npm test
npm run build
```

Tests run PostgreSQL inside an isolated PGlite engine; they do not contact Supabase or any production service. They cover imports, rollback, duplicate-safe racket creation, long review text, public/private review separation, RLS, spoofed identity headers and protected target checks. Live Supabase sign-in still needs to be verified after the new project exists.

## Data transfer

The live Sites data is **not** part of the Git repository. A private local snapshot is in ignored `backups/`; it contains optional private email fields. Never commit or upload it as application source.

```sh
# Validate the export without opening a database connection.
npm run db:import -- backups/sites-2026-10-17.json
# Test importing and comparing every exported field using a temporary local PostgreSQL engine.
npm run db:check-export -- backups/sites-2026-10-17.json
# After verifying the NEW PadelRecs target and applying migrations:
npm run db:import -- backups/sites-2026-10-17.json --apply
npm run db:verify -- backups/sites-2026-10-17.json
```

Import uses one transaction and preserves IDs, slugs, review bodies, optional private emails, statuses, dates, racket specifications and foreign keys. Repeating an identical import is safe. Conflicting same-ID/different-value data aborts rather than overwriting it. Existing different-ID/same-slug conflicts also abort.

This is a working snapshot, not an automatic sync. Before cutover, pause new writes briefly, take a fresh full export, migrate into an empty PadelRecs database, verify every field and count, and only then switch the public domain. Do not reimport an old snapshot over newer edits.

There is no request-time seeding or automatic deletion. Optional `npm run db:seed` inserts only the illustrative starter catalog for local development; it is blocked when NODE_ENV=production. Use the real export for deployment.

## Database and privacy

The four tables are in a dedicated `padelrecs` PostgreSQL schema, not the default public Data API schema. RLS is enabled with no browser policies. Next.js reads/writes through its server-only PostgreSQL connection. Do not expose this schema in Supabase Data API settings or add broad anonymous grants.

`db/data.ts` explicitly omits private email fields and pending/rejected reviews from public results. Public API submissions always save as pending. External excerpts do not affect player ratings. Catalog creation and the review save run together in a PostgreSQL transaction.

## Admin access

Create your admin user inside the **new PadelRecs** project's Supabase Auth dashboard. Put its verified user UUID in `ADMIN_USER_IDS`. `/funtimes/login` signs in with the existing Auth user’s email and password. An email-link option is also available for existing accounts only; it does not sign up public users. Password login verifies the returned user UUID against `ADMIN_USER_IDS`, and signs out non-admin sessions. Email throttling is shown explicitly. Supabase callback URL: `https://YOUR-PADELRECS-HOST/auth/callback`.

The server verifies the Supabase user before authorizing every admin page and POST. It never trusts the old Sites headers, browser-supplied roles, or email text as authorization. Writes require a matching Origin. `SITE_URL` must be the exact deployed origin; preview environments need their own exact URL and allowed callback.

## Files

- `app/`: original pages, forms and protected admin workflows
- `lib/supabase/`, `proxy.ts`: verified cookie-based Supabase sessions
- `db/schema.ts`, `drizzle/`: PostgreSQL schema and migrations
- `db/racket-selection.ts`: duplicate-safe catalog creation inside transactions
- `db/transfer.ts`, `scripts/`: validated import, verification and database setup
- `deployment/targets.json`: explicit PadelRecs resource identities and exclusions
- `tests/`: isolated PostgreSQL and authorization tests
- `.github/workflows/check.yml`: typecheck, tests and production build

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the account and launch sequence.
