# The /guide page: adding a niche's config

The owner asked for "the same guide page with the same vibe for the other sites as well". `/guide` is one template
(`app/guide/page.tsx`), filled from a niche's `guide` config. Padel's is the first: `lib/niche/padel-guide.ts`, wired in
as `guide: padelGuide` in `lib/niche/padel.ts`.

A niche without `guide`:

- has no "guide" nav link;
- 404s `/guide`;
- has no `/guide` sitemap entry;
- shows no home guide row.

## Steps

1. Create `lib/niche/<niche>-guide.ts` and export a `GuideConfig` (types in `lib/guide.ts`).
2. Set `guide: <niche>Guide` on the niche in `lib/niche/<niche>.ts`.
3. Run the tests: `tests/guide.test.ts` checks every niche's config (see the rules at the end).
4. Look at `/guide` locally at 1300px and at 390px.

## The config

| field | what it is |
| --- | --- |
| `title`, `description` | the `<title>` (absolute, no site suffix) and meta description |
| `nav` | the nav word; default `"guide"` |
| `crumb` | the breadcrumb's last step, e.g. `"racket guide"` |
| `h1` | `[before, highlighted]`, e.g. `["Padel rackets,", "decoded"]` |
| `intro` | one or two plain sentences |
| `tldr` | 2–4 personas: `{ label, desc, picks }`, where `picks` (`style`, `level`, `arm`) preset the quick match |
| `sections` | the numbered sections, in order; each one is a chip in the sticky nav |
| `buys` | optional: `{ section, kicker, tail? }` → "Players are happiest with a X or Y." (see below) |
| `overheard` | optional: a real player's line (see below) |
| `home` | optional: `{ section, title, link }`, one section's options as tiles under the home list, then the link |
| `cta` | `{ title, text, button }`; the button opens the quick match (`/#match`) |

### Sections

`{ id, title, sub, layout, filter? | spec?, options, rule?, textOnlyNote?, liked? }`

- `id` is the anchor (`/guide#balance`).
- `sub` is the small line after the title ("where the weight sits").

`layout` is the section kind. Each kind takes 2–4 options, and the columns follow the count.

| layout | looks like | padel uses it for | option fields it shows |
| --- | --- | --- | --- |
| `cards` | a row of cards with an icon | Shape | `icon`, `label`, `text`, `best` ("best for: …") |
| `scale` | a slider bar with an end per option | Feel | `label`, `text` |
| `toggles` | cards with a vertical marker | Balance | `kicker` ("Live at the net?"), `label`, `text` |
| `numbers` | big-number columns | Weight, Budget | `big` ("355–370g"), `label`, `text` |
| `split` | a split pair; the accent is dotted mint | Surface | `label`, `text` |
| `dark-split` | a split; the accent is dark | Face | `label`, `note` ("3K–18K"), `text` |

- `accent: true` on an option highlights it.
- `icon` names an icon in `app/guide/guide-icon.tsx`. Add your niche's SVGs there; an unknown name draws nothing.

### Where the numbers come from (never type a number into the config)

A section counts by one catalogue field. Every option needs a `value` in that field.

- **`filter`**: a built-in catalogue field (`style`, `level`, `shape`, `weight`, `feel`; see `lib/catalog-filter.ts`).
- **`spec`**: `{ key, label, column, classify }` adds a catalogue filter from one spec column.
  - `column` is `shape | weight | balance | core | surface`.
  - `classify(specText)` returns an option `value` or `null`.
  - `key` is the address key (`/rackets?balance=low`).
  - `label` is its name under the catalogue's "more filters".
  - Example: padel's Balance uses `balanceOf` and Face uses `faceOf` (in `lib/guide.ts`). Put your niche's classifiers beside them.
- **Neither**: a text-only section. It must have a `textOnlyNote` saying why there are no counts, e.g. "no counts here yet: we don't have reliable prices for most rackets".

Each counted option then shows:

- **"see N rackets →"**: N is the length of the `/rackets` list that link opens: one row per model, newest year.
- **"Most-liked [option] racket"**: one line per section. It shows the top Player score in the option named by the section's `liked` (or the biggest option), and only when 3+ of its rackets are rated. Set `liked: false` to hide it. An option's `liked` sets the wording, e.g. `"medium-weight"`.
- **`buys`**: names the section's two options with the highest share of positive reviews (options with 50+ judged reviews only), "from N player reviews". The `tail` sentence is dropped when its `unlessTop` value is one of the two.

The links and the "more filters" groups work on the v2 catalogue (`app/rackets/catalog-v2.tsx`, padel today). If your site's
catalogue is another page, the counts are still right, but wire the filter keys into that page before linking to it.
`/guide` also needs the niche's quick match (`niche.finder`, `matchContext`).

### The overheard quote

`{ kicker, reportId, words, who, similar, lesson }`

- `words` must be verbatim from report `reportId`. The page checks this on every render and drops the block if the text no longer matches.
- `similar` lists the report ids that say the same thing. The page shows "N more players said something similar", counting only the ids it finds.
- No real quote, no block.

## Rules (`tests/guide.test.ts` checks the ones marked ✓)

- ✓ Section ids are unique.
- ✓ `layout` is one of the six kinds.
- ✓ Each section has 2–4 options; a counted section has a `value` on every option.
- ✓ A section has `filter` or `spec`, not both.
- ✓ A text-only section has a `textOnlyNote`.
- ✓ A `spec.key` doesn't clash with a catalogue param.
- ✓ `buys` and `home` name real sections.
- ✓ There are 2–4 tl;dr personas.
- ✓ The copy says "players", never "owners", and has no "% liked" or "% loved".
- Text stays 16px or more for body and 13px or more for mono (the CSS already does this; don't shrink it).
- Budget: if prices cover fewer than ~60% of the catalogue, make Budget a text-only `numbers` section.
- Don't add FAQ markup for search engines unless the page has real FAQ content.
