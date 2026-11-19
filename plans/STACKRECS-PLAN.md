# Build + Grow pilot ("stackrecs"): plan for owner sign-off

Status: plan only. No data, no migration, no Vercel change. Nothing is seeded until the owner signs off
here. Sources: the owner's BUILD-GROW-PLAN.md and the two research notes of 2026-11-19 (coding tools,
grow side).

## 1. NICHE id and renaming

- NICHE id: `stackrecs`. Postgres schema: `stackrecs`. Both are internal and never shown to visitors.
- The public name lives in one place, `lib/niche/stackrecs.ts` `site` (name, domain, wordmark,
  descriptor). Picking BuildGrowRecs, ShipRecs or another name later is a one-file change. The id and
  schema can stay, as `software` did for SoftwareRecs.
- No domain and no Vercel project until the owner says so (see section 9 for previews).

## 2. Catalog (38 tools)

Each name and version is checked on the vendor's own site before seeding. A tool has a side (Build or
Grow), a category (stored in the `shape` column, so no new column) and a website URL.

**Build: coding agents (15)** Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Devin Desktop (was
Windsurf), Google Antigravity, Cline, Kilo Code, Aider, OpenCode, Zed, JetBrains AI, Kiro, Amp, Warp.

**Build: app and site builders (8)** Lovable, Replit Agent, Bolt.new, v0, Base44, Framer AI, Webflow AI,
Hostinger Horizons. Optional adds: Emergent and Google AI Studio (both in the coding research's
suggested slice).

**Grow: SEO and marketing (15, from the grow check's verdict)**
- SEO suites: Semrush, Ahrefs, SE Ranking, Moz Pro.
- Content and on-page: Surfer, Clearscope, Frase, NeuronWriter.
- AI writing: Jasper, Writesonic, Koala.
- Technical SEO: Screaming Frog, Sitebulb.
- AI visibility: Otterly.AI, Peec AI.

Left out for now (from the check): Copy.ai, MarketMuse, Byword, Alli AI, Profound, Similarweb.

## 3. Vote groups ("How does it build?" and "How does it grow?")

Same mechanics as padel's "How does it play?": one vote per group per device, changeable, a second tap
clears. Keys fit the existing `trait_votes` check (`^[a-z_]{2,20}$`), so the table needs no change.

**Build (all 23 Build tools)**

| Key | Group | Options |
|---|---|---|
| `limits` | Usage limits | Rarely hit / Hit them sometimes / Hit them often |
| `cost` | Cost predictability | Predictable / Some surprises / Bill shock |
| `code_quality` | Code quality | Clean / Needs review / Messy |
| `autonomy` | Autonomy | Runs on its own / Needs nudges / Needs hand-holding |
| `scope` | Scope discipline | Stays on task / Drifts a bit / Changes too much |
| `consistency` | Consistency | Steady / Varies day to day / Hit or miss |
| `big_codebase` | Big codebases | Handles them / Gets lost sometimes / Small projects only |
| `lock_in` | Lock-in and export | Easy to leave / Some lock-in / Hard to leave |
| `best_for` | Best for | Non-coder / Hobby dev / Pro team |

**Grow (all 15 Grow tools)**

| Key | Group | Options |
|---|---|---|
| `data_accuracy` | Data accuracy | Trust it / Directional only / Often off |
| `value` | Value for money | Worth it / Fair / Overpriced |
| `learning` | Learning curve | Easy / Takes a week / Steep |
| `ai_quality` | AI features | Useful / Hit and miss / Gimmick |
| `reporting` | Reporting | Client-ready / Basic / Weak |
| `results` | Speed of results | Quick wins / Slow but steady / Didn't move rankings |
| `support` | Support | Helpful / Slow / Hard to reach |
| `integrations` | Integrations | Plugs in well / Some gaps / Stands alone |
| `best_for` | Best for | Solo / Agency / In-house team |

Note: the grow check's 9 "which tool wins" questions (backlink data, content scores, crawler of choice
and so on) compare tools, so they fit a poll or a guide page better than a per-tool vote. Proposed as a
later /guide, not for the pilot.

Home boards (top picks by vote), 3 per side:
- Build: Rarely hits limits, Best for non-coders, Stays on task.
- Grow: Most trusted data, Best value, Easiest to learn.

## 4. Find my match (home quiz)

Three taps, all client-side (lib/niche/README.md rule), every combination a real cached address:

1. I want to: **Build** / **Grow**.
2. I am:
   - Build: Non-coder / Some code / Developer.
   - Grow: Solo / Agency / In-house team.
3. Budget:
   - Build: Free / Under $30 a month / Any.
   - Grow: Free or trial / Under $150 a month / Any. (SEO suites start near $130, so "under $30" would
     leave almost nothing.)

Ranking uses the shared engine (lib/engine): Player score, the `best_for` votes and review mentions for
the "I am" pick, and a plain price fact per tool for the budget gate. A tool with no fit evidence for
the pick is never ranked as a fit (same caution rule as padel).

## 5. Data and sweeps

Sources, as on padel: own reviews and votes, plus Reddit, YouTube and blog summaries.

- **Reddit.** The research tools could not open Reddit pages. The project's own Reddit API client
  (`research-agent/scripts/reddit.mjs`, the one shared app and rate schedule) is a different route, but
  sweeps are paused since the Reddit Reviews pivot. Proposal: one test run on 5 tools (Claude Code,
  Cursor, Lovable, Semrush, SE Ranking) in r/ClaudeAI, r/cursor, r/vibecoding, r/SEO, r/bigseo, then
  check the yield before any wider sweep. Reddit stays a score input plus 4 or 5 short summaries per
  tool, as on padel. Needs the owner's OK.
- **YouTube.** The shared YouTube lane, Sonnet summaries with a second check, product info only. Many
  2026 videos are affiliate reviews: a video whose description carries an affiliate link for the tool is
  labelled and counts half. Vendor-owned channels do not count.
- **Blogs.** Independent first-hand reviews only. Vendor-owned sites (Backlinko and Exploding Topics
  belong to Semrush) and rival vendors' comparison pages are left out.
- **Hacker News** (public Algolia API) for coding agents, as a forum source under the forum rules. Owner
  OK first.
- Not used: G2, Capterra, TrustRadius and Product Hunt review text (their terms, and copying risk).

## 6. Versions and freshness

- **Version tag on every review.** The existing review `variant` field holds it ("Cursor 3.x", "Semrush
  2026"), so no migration. A tool's allowed tags live in its catalog row, as DiscGolf's plastics do
  (lib/variants.ts). Reviews show the tag as a chip, and the page can filter by it.
- **Older reviews weigh less.** Full weight for 3 months, then the weight halves every 3 months (6
  months 0.5, 9 months 0.25), with a floor of 0.1. Reviews over 18 months old leave the score and stay
  readable. Reviews tagged with a version two or more majors back count half on top of that.
- **"Last updated"** on each product page: the date of the newest counted review or vote.
- **Weekly freshness pass** (later, after the pilot settles): new versions, price changes, renamed or
  retired tools. A renamed tool keeps its page and 301s from the old slug; a retired tool is marked
  "Retired" and leaves the rankings.

## 7. Bias rule (code and copy)

- Scores come only from votes and outside reviews. The scoring code takes no affiliate or commission
  input, and a test fails CI if the score functions ever read affiliate fields.
- No owner-curated top 10s on this site: rankings are by score only. Owner expert notes (recommended)
  show labelled "Owner notes" and never change a score. Never worded as testing.
- Claude Code is treated like any other tool: no default spot, no boost, no special copy. The
  /how-we-make-these page says this, and that the site is built with AI agents, including Claude Code.
- "Try it" links only where a programme exists, with a short note: "Commission link. It never changes
  the score."

## 8. "Try it" links (affiliate IDs left empty, the owner adds them)

- Build, programme found: Lovable, Framer AI, Webflow AI, Hostinger Horizons, Base44; v0 via Vercel's
  programme.
- Grow, programme found: Semrush, SE Ranking, Surfer, Frase, NeuronWriter, Jasper, Koala, Otterly.AI.
- Grow, terms conflicting (verify in the dashboard before any link): Moz Pro, Writesonic.
- No programme found, so no "Try it": all 15 coding agents, Replit Agent, Bolt.new, Ahrefs, Clearscope,
  Screaming Frog, Sitebulb, Peec AI. Their pages link to the vendor site with no commission.

## 9. Build steps (after sign-off)

1. **PR A, code only, no data:** make the Thread pages niche-aware without changing padel. Trait groups,
   boards, copy and the catalog path move into the niche config; padel's stay as today and padel tests
   pin it. Adds `lib/niche/stackrecs.ts`, the Build and Grow tabs, the side heading ("How does it
   build?" or "How does it grow?"), version chips, the freshness weight (stackrecs only), "Try it" with
   the commission note, and the bias test.
2. **DB step (owner's typed OK):** add `stackrecs` to `deployment/targets.json` `nicheSchemas`, run the
   existing migrations for the new schema (empty tables), then seed the 38 catalog rows. Backup and dry
   run first.
3. **PR B, data:** the Reddit test run, YouTube and blog summaries, prefilled vote groups from reviews.
4. **Previews:** `[preview stackrecs]` needs a Vercel project for the site (no domain). Until the owner
   creates one, screenshots come from a local build with `NICHE=stackrecs`.

## 10. Owner decisions on this PR

1. NICHE id `stackrecs` and the 38-tool catalog (add Emergent and Google AI Studio or not).
2. The two vote sets and their options.
3. The quiz fields, including the Grow budget steps.
4. The Reddit test run and Hacker News as a source.
5. The freshness weights (3-month full weight, 3-month half-life, 18-month cutoff).
6. A Vercel project for previews, or local screenshots for now.
