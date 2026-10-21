# PadelRecs deployment checklist

## 1. Resource identity: before any changes

Create entirely NEW resources. Never modify or connect the existing RedRecs / reddit-digest-next resources.

| Resource | New PadelRecs target | Status |
| --- | --- | --- |
| GitHub | public `yonski33/padelrecs` (ID `1423182114`) | Created by user |
| Supabase organization | `reddit-digest-next` (`kcrlvsjbamphyowzlqxs`) | User chose organization; only PadelRecs project is used |
| Supabase project | `PadelRecs` (`pqkcxsqkhibcmrzrxuhx`) | Verified; schema and fresh import complete |
| Vercel project | `padelrecs` (`prj_L2FtJaXgJAFjjaPMBGfbIBhHDHKx`), connected only to `yonski33/padelrecs` | Deployed; final verification in progress |
| Domain | `padelrecs.com` / `www.padelrecs.com` | Change only after verification |

Read back each new resource's exact name and ID and record it in `deployment/targets.json`. The Supabase ref in `.env.local` must match the recorded new ref. Never copy `.vercel` metadata, Git remotes or secrets from another project.

## 2. Supabase project

The user created a separate **PadelRecs** project in the existing organization and approved using it. The earlier project `wwwcnebilsfcvmkxatmu` was deleted by the user. A replacement was created under the user’s `reddit-digest-next` organization; verify its new ref before any connection or data change. Do not change the organization subscription or any existing project.

The replacement project `pqkcxsqkhibcmrzrxuhx` is active in region `ap-northeast-2`. Verify the exact project name and ref before any write.

Verify the project's name and ID in the dashboard. Record its project ref in `deployment/targets.json` under `supabaseProjectRef`, and in `.env.local` as `SUPABASE_PROJECT_REF`.

Copy only the NEW project's:

- PostgreSQL **shared Session pooler** URI (port 5432) into `DATABASE_URL`. Repeated queries stalled through this project’s transaction-pooler endpoint; the session endpoint passed repeated page-load checks. Runtime connections are limited to one per instance with a 20-second idle timeout.
- Direct or session pooler URI into `MIGRATION_DATABASE_URL` (optional; use a reachable connection).
- Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
- Publishable key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

The database password is server-only. No Supabase service-role key is required by this app. Keep `.env.local` private.

Run `npm run db:migrate`. The migrations create four tables in the private `padelrecs` schema with RLS enabled. Do not expose that schema to the Data API.

## 3. Configure admin authentication

In the NEW project's Authentication dashboard:

1. Create your existing admin user, then copy its Auth user UUID into `ADMIN_USER_IDS`.
2. Set the site URL to the exact PadelRecs deployment origin.
3. Add `http://localhost:3000/auth/callback` for local testing and the exact deployment `/auth/callback` URL for hosting. Do not use broad wildcard redirects for production.
4. Verify email delivery; configure production SMTP if needed before relying on sign-in emails.

Set `SITE_URL=http://localhost:3000` locally. After deployment, set it to that exact new Vercel origin. Public reviewers do not need accounts.

## 4. Import and verify data

A private local export has been saved in `backups/sites-2026-10-17-latest.json`. This directory is ignored by Git and excluded from source packaging. It includes real reviews and potentially private contact details; do not publish it.

```sh
npm run db:import -- backups/sites-2026-10-17-latest.json
npm run db:check-export -- backups/sites-2026-10-17-latest.json
npm run db:import -- backups/sites-2026-10-17-latest.json --apply
npm run db:verify -- backups/sites-2026-10-17-latest.json
```

Check that the host/ref is the new PadelRecs project before `--apply`. The script validates all references and verifies every imported field within the transaction; mismatches abort. It never overwrites existing conflicting data.

## 5. GitHub

The user created the separate public repository `yonski33/padelrecs`. Keep private backups and credentials excluded. Check the URL reads exactly `github.com/yonski33/padelrecs`.

This folder is a separate repository. Verify its remote before pushing. Push the reviewed migration commit to the new repository's main branch. Do not push to reddit-digest-next or change any of its branches, webhooks, secrets or deployments.

Only application source is uploaded: no backups, node_modules, .env.local, .next, .vercel, local databases or credentials. GitHub Actions will run the included checks.

## 6. Vercel preview setup

Create a NEW project named `padelrecs` and connect only the new GitHub repository. Use the Next.js preset, Node.js 22.x, root directory `.`, install `npm ci`, build `npm run build`, and default output directory. Do not import the RedRecs project.

Configure the new project's environment variables from `.env.example` for the appropriate environments. Store database credentials as secrets. For each deployment environment, `SITE_URL` and Supabase's allowed auth callback must agree with that environment's exact origin. Use a stable PadelRecs staging domain for repeated preview sign-in testing if needed; do not point RedRecs domains here.

### Page caching

Public pages (home, catalogue, type, brand and product pages, share images, sitemap) are static and served from Vercel's edge cache; they re-render from the database at most every 5 minutes, and right away after a change (see `lib/revalidate.ts`). Filtered and sorted addresses (`/?source=`, `/rackets?brand=`, `/cleansers?sort=`…) are rewritten to dynamic twins under `app/filtered` and get a 60-second CDN cache. Admin, sign-in, add-review, votes and search stay dynamic, and the proxy runs only on `/admin`, `/auth` and `/api/admin`.

Set `REVALIDATE_SECRET` (Production) in every site's Vercel project, and the same value in `.env.local`, so `db:publish-web-reviews` and `db:import` can ask the live site to refresh at once. Without it they still work, and pages catch up within 5 minutes.

Before each deployment, read back the Vercel project ID, project name, GitHub repository and Supabase ref and match them to `deployment/targets.json`.

## 7. Test before domain cutover

- Public homepage, search, filters, brand/racket links, ratings.
- Player review submission remains pending; private email is absent from public responses.
- New racket and new brand creation, including duplicate submissions.
- Admin sign-in/out; anonymous and non-admin access denied.
- Approve/reject/move to pending; public feed updates correctly.
- Add web reviews and source links; long text saves intact.
- Edit all racket specs; linked reviews and URLs remain intact.
- Database has the imported counts and every exported field matches.

The local test suite and build pass without cloud credentials. Supabase email delivery, real sessions, Vercel environment settings and hosted database connectivity require these final live checks.

## 8. Final cutover

The existing ChatGPT Sites instance stays live while staging is prepared. Keep it as the source of truth until cutover.

Pause submissions/admin edits on the old site briefly, export a fresh complete snapshot, import into a clean new target database (or explicitly reconcile changes), and verify it. Do not assume the earlier backup includes later edits.

Only after approval and final verification, add the PadelRecs domain in the new Vercel project and update only that domain's DNS. Update the auth site URL and callback for the final domain. Disable old-site writes so reviews do not split between databases. Keep the old data backup until the new deployment is confirmed stable.

No RedRecs resource, domain, database, environment variable or deployment is involved in any step.
