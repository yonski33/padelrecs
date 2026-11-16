# Niche sites: rules every site design follows

Each site is one niche config here (`lib/niche/<id>.ts`) rendered by the shared app. `GUIDE.md` covers the /guide page's
config. This file holds the rules that hold on every site, whatever its design.

## Filters and picks are client-side

**Rule: a filter, sort or pick change never asks the server.** This covers the home's quick match, the catalogue's filters
and sort, type and brand pages, ranking picks and a product page's fit or skin check. New site designs must use
`useInstantView` and `instantClick` from `app/instant-view.ts`. (Owner 2026-11-15 for padel, 2026-11-16 for SkinRecs:
taps took 0.4–4 s when every tap rendered the page again on the server.)

How a filter UI is built:

1. **The server renders the first view for the address**, so every combination is still a real, shareable page.
   The page also sends the rows the view needs, once: ranking inputs and display fields. Examples are
   `app/home-payload.ts` and `app/skin/payload.ts`.
2. **A client component holds the view with `useInstantView`.** A tap re-runs the same pure functions the server used,
   such as `lib/home-rank.ts`, `lib/catalog-filter.ts`, `app/skin/rank.ts` and `app/skin/product-view.ts`. The hook then
   writes the address with `history.pushState`, or `replaceState` with `"replace"`.
   - Links stay real `<a href>` links with `onClick={instantClick(…)}`, so a new tab or no JavaScript still gets the
     server's page.
   - Never use a Next `<Link scroll={false}>`, `router.push` / `router.replace`, or `useSearchParams` for a filter.
     Each one is a server render per tap.
3. **Each simple address is served from a cached page per view.** `proxy.ts` rewrites it to `app/v/…`, and the
   `lib/view-key.ts` key lists say which query keys a view holds.
   - A niche with its own picks gets its own key lists, like SkinRecs' `SKIN_*_VIEW`. It never gets padel's: those views
     rendered padel's pages and 500'd on SkinRecs (#374).
   - Free text (`?q=`) and unknown keys render per request.

`tests/instant-views.test.ts` fails CI when an app file uses a server round trip for a tap. The only exceptions are the
listed legacy pages: review lists, "load more", padel's brands sort and the classic and light looks. That list only
shrinks. The test also checks that each instant UI goes through the hook, that every address SkinRecs' picks write is a
cached view on its own keys, and that the browser's ranking equals the server's.
