# PickleballRecs on the Thread design: plan (2026-11-19)

Goal: PickleballRecs (NICHE pickleball) gets the Thread look PadelRecs runs today, from the same code.
Inputs: the owner's Claude mockups (design_handoff_pickleballrecs, 14 pages) and live PadelRecs after
PRs #500 to #519. The mockups were made before today's padel fixes, so **live padel wins where they differ**.
Pickleball words and content come from the mockups.

Doc only. No code, no DB write. Nothing merges.

## 1. How it is built (reuse, no fork)

- One flag per niche in `lib/thread/look.ts`: `THREAD_DEFAULT` becomes a per-niche map
  (`{ padel: true, pickleball: false }`). Pickleball starts with Thread as a preview only (`?look=thread`).
  The owner flips it to `true` when happy. `?look=classic` keeps working as the rollback.
- `threadSite()` lists padel and pickleball. Same proxy rewrite, same `app/thread/*` pages.
- Padel-only words move into a per-niche Thread config: `lib/thread/sites/padel.ts` (today's text, unchanged)
  and `lib/thread/sites/pickleball.ts` (mockup text). It holds the nouns (racket/paddle), guide paths,
  vote groups, vote boards, prefill rules, list blurbs, level and side options, and the page copy.
- **Padel stays byte-identical.** A new test renders padel's Thread config, trait groups, guide paths,
  `threadPath` results and copy, and compares them to a snapshot taken from main before the change.
  The existing Thread tests keep running on padel.
- StackRecs pilot A (#520, open) makes the same files niche-aware (`threadSite`, `threadPath`, traits API,
  header and footer props). I will build on the same shape it uses, so whichever lands first, the other
  rebases with small conflicts. I will note this in the shared notes folder for that session.

## 2. Where the mockups differ from live padel (padel wins)

| Mockup says | Live padel now, which pickleball will follow |
|---|---|
| Brands in the top menu | Brands off the menu; brand pages in Thread style (#501, #503) |
| "You" tag on the voted row | No "You" pills; tap again removes the vote; instant +1 (#501, #508) |
| Hide counts under 5 | Real counts at any size; poll % only from 10 votes (#508) |
| Poll title varies | "Poll: would you buy it again?" (#510) |
| Home hero with level, style and sore-arm chips | One "Find my match" sentence with the yellow tag, "Any" by default, live "Showing N" (#507) |
| Home "How players vote them" (6 vote boxes) | "Top picks by players" numbered lists, padel rules (#511, #515) |
| Home sidebar "New from around the web" | "Latest from the comments" (#519) |
| Latest reviews with quote marks | Soft rows with verdict chips, no quote marks (#518) |
| No "Add a review" in header | "Add a review" in the header; count pill next to the H1 (#507) |
| Header search box only | Header search with live suggestions, current models first (#505) |
| Page width 1140 px | Classic's page width (#506) |
| "How does it play?" slim or folded, "Show 4 more" | All 9 groups in a 3 by 3 grid, no collapse, no per-group meta, prefilled from reviews (#502, #512) |
| TL;DR in a bordered box | TL;DR on a lime fill, no border (#510) |
| "Is it right for me?" short line | Set off by a divider; result explains why and suggests better fits under 80% (#513) |
| Reviews sorted by Helpful | Newest / Most positive / Critical first; verdict chips and source tabs with counts (#510) |
| Composer with green focus ring | Calm composer: black Post button, a hint when disabled; "+ Add your review" in lime |
| Comment helpful counts start at 0, tags on comments | Comments start at score 1, no tags, soft border |
| "Posting as" a generated nickname, "New name" | A name is required, or a Level/Side pick (#506, #514); fallback "Player" |
| List rows "See reviews ›" and no prices | Same, plus the quiet "Check price" with the commission note padel shows; no exact prices |
| Score page: loved 1, mixed 0.5; ranked at 20+ | The real volume-weighted player score and its rules (padel Score page) |
| Footer "Kept by [your names]", "How we score" | Padel's footer pattern; "How the score works"; no "we" |
| Hover colours vary | Readable hovers: light tint or border only; selected is black with cream text (#501) |
| All paddles listed | Current models only (familyRowIds / superseded rule); home top 10 matches classic; curated lists lead (#490) |
| Score badge green 85+, yellow 70 to 84 | Same rule as padel's Thread badge (they match) |

Pickleball adds owner tools the same way: approve, edit, delete, hide and rename on paddle pages (#504),
and the admin Traits tab for pickleball.

## 3. Questions for the owner (please answer in the session)

**Q1. "How does it play?" vote groups (9, in a 3 by 3 grid).** The mockup has these 9:

| Key (stored) | Title | Options |
|---|---|---|
| game_type | Game type | Doubles · Singles · Both |
| plays_like | Plays like | Control · All-round · Power |
| level | Best for | Beginner · Intermediate · Advanced |
| sweet_spot | Sweet spot | Big · Medium · Small |
| arm | Arm friendly | Very · Somewhat · Not really |
| feel | Feel | Soft · Medium · Hard |
| pop | Pop | Low · Medium · High |
| maneuver | Maneuverable | Very · Somewhat · Not really |
| durability | Durability | Holds up well · Average · Wears fast |

The mockup has **no Spin group**, but live PickleballRecs rates spin, has a "Best for spin" list and a Spin
style in the match. Suggestion: swap **Maneuverable** for **Spin** (Lots · Some · Little). Keep the mockup
as is, or swap?

**Q2. Find my match fields.** The mockup has I'm Beginner / Intermediate / Advanced, I want Control /
Balance / Power, and Sore arm. The live pickleball engine also has a **Spin** style. Suggestion: add Spin
as a 4th "I want" option (the engine already scores it). Yes or no?

**Q3. Level and side for names (the "name or Level/Side" rule).** Pickleball has no court side. Suggestion,
from the live pickleball review form:
- Level: Beginner · Intermediate · Advanced · Competitive (the live form's four, with DUPR hints).
- "Plays": Doubles · Singles · Both (stored in the same `playing_side` column, as the live form does).
- Byline: "Gali A · Intermediate, mostly doubles".

The mockup bylines show DUPR numbers ("3.5 · doubles"). Words (as above) or DUPR numbers?

**Q4. Rankings hub.** The mockup cards: Best overall, Best for beginners, Best for sore arms, Best for control,
Best for power, Best at the kitchen, Best standard, Best elongated, Best for singles. Live pickleball also
has **Best for spin**. Suggestion:
- Keep the live lists (overall, power, control, spin, tennis elbow, beginners), curated top 10s first.
- "Best at the kitchen" from the engine's hand-speed trait, shown only with 10+ paddles (padel's rule).
- Shape lists: only if 10+ current paddles have the shape filled in. Today the pickleball config says
  shapes are too sparse, so these may stay hidden at first.
- "Best for singles" from Game type votes, hidden until 10 paddles have enough votes.

**Q5. Guides.** Addresses: `/guide` (How to choose), `/guides/beginner-tips`, `/guides/paddle-shapes`,
`/guides/doubles-or-singles`, `/guides/tennis-elbow`. The doubles or singles guide's picks need Game type
votes; until then it lists the top paddles from the live engine without a doubles or singles split. OK?

**Q6. Catalog filters.** Mockup: Shape, Level, Feel, Brand, Arm friendly. Shape and Feel come from specs and
the engine, so paddles with no data drop out when those filters are on. OK, or leave Feel out at first?

**Q7. Accounts (#516).** Padel has optional accounts to reserve a name. Pickleball too, or later?

## 4. Database steps (each needs the owner's typed OK in this session)

The pickleball schema has none of the Thread tables yet (checked read-only 2026-11-19: padel has
trait_votes, comments, comment_votes, accounts, account_posts and rackets.model_line; pickleball has none).

| Migration | What | Needed for |
|---|---|---|
| 0024 trait_votes | vote table, additive | How does it play?, Top picks |
| 0025 comments + comment_votes | additive | Comments |
| 0026 rackets.model_line | nullable column | current-models rule (same as padel) |
| 0027 trait_admin | additive | admin Traits tab |
| 0028 accounts | additive | only if Q7 is yes |
| 0029 comment level and side | 2 nullable columns | only once #514 lands |

Each runs dry first with a backup, on `NICHE=pickleball` only. Until they run, the pickleball Thread pages
show votes and comments as empty (padel's no-table fallback) and read-only.

## 5. Build order (small PRs, each `[preview pickleball]`, none merged)

1. **Niche-aware Thread core.** Per-niche flag, config files, guide paths, traits, APIs open for pickleball.
   Padel snapshot tests. Pickleball preview stays off by default (`?look=thread` only).
2. **Home.** Find my match sentence, Top picks by players, Latest player reviews, Latest from the comments.
3. **Paddle page.** TL;DR, Is it right for me?, Poll, How does it play? grid with pickleball prefill rules,
   reviews, comments, owner tools.
4. **Catalog, brands, rankings hub and ranking pages.**
5. **Guides, About, Score, Affiliate, Contact** with mockup copy, checked for the copy rules.
6. Go-live switch (flag to true) only when the owner says so.

Every PR gets desktop and phone screenshots per page it changes.

## 6. Copy rules (checked in every PR)

No em dashes. No "we" or "us". Lines 105 characters or less. Never claim testing. No exact prices.
"Check price" stays quiet with the commission note. Mockup text that breaks a rule is rewritten
(for example the mockup footer's "How we score" becomes "How the score works").
