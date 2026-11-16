# Grok content pipeline (DiscGolfRecs pilot, 2026-11-16)

An outside LLM (the owner's Grok account) writes disc-page content from an evidence pack; we validate and spot-check it.
1. `build_pack.py NN slugs.txt 40`: the pack (specs, flight numbers, level fit, expert values, up to 40 snippets with ids
   `eN`, an allowed try-instead list with `known_for` tags). No URLs or report ids; the id map stays local.
   Needs the inventory (`inv.json`, from the home/match context) and per-disc exports from `export-quicktake-input.mts`.
2. The owner pastes `PROMPT-v2.md` plus the pack into Grok and saves the reply as `discgolf-batch-NN.out.json`.
3. `validate.py pack.json out.json`: schema, cited ids, 2+ sources, voice (`lib/voice.ts`), banned words, title/body
   overlap, contradictions, biggest catch first, tagline catch, try-instead list, ≤105 characters. Then spot-check 3 discs.
4. `convert_grok.py NN …`: snippet ids → report ids, Grok's tags → the card tags, into `db/racket-page/discgolf.json` and
   `db/fit-card/discgolf.json`; `tests/discgolf-content.test.ts` checks the result.
