import type { Metadata } from "next";
// Reads the catalog on every request (the layout no longer forces it, see app/layout.tsx).
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { catalog, score } from "../../db/data";
import { niche, isV2, v2copy, scoreLabel, siteColor } from "../../lib/niche";
import { fitConfigFor } from "../../lib/fit-config";
import { attrProfileFor } from "../../lib/attr-profile";
import { signals, type SignalInput } from "../../lib/signal";
import { NEW_UNDER } from "../../lib/score-view";
import { MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import { MIN_LIST_REVIEWS } from "../../lib/top-lists";
import { signalCategory } from "../signals";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import SignalTry from "./signal-try";
import FaqList from "./faq-list";
import "./how.css";

// "How we make these" (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/CVvBQnDCRtn2PhCdd77PA5). PadelRecs
// only for now. Every number on it comes from the real formula (lib/signal.ts) and the real catalog.
export const metadata: Metadata = { title: "How we make these", description: `How ${niche.site.name} turns ${niche.people.one} reviews into one honest line and a score.`, alternates: { canonical: "/how-we-make-these" } };

const w = niche.words;
export default async function HowWeMakeThese() {
  if (!isV2) notFound();
  // SkinRecs: the owner's beauty design (app/skin/score-beauty.tsx, 2026-11-16).
  // Skin pages load only on SkinRecs, so other sites' routes don't preload the beauty fonts (app/skin/beauty-fonts.ts).
  if (attrProfileFor(niche)) { const { default: ScoreBeauty } = await import("../skin/score-beauty"); return <ScoreBeauty/>; }
  const data = await catalog();
  const products: SignalInput[] = data.listed.map(r => { const s = score(data, r.id); return { id: r.id, category: signalCategory(r), positive: s.positive, mixed: s.mixed, judged: s.judged }; });
  // The two example rackets, scored by the same formula against the real catalog.
  const example = (pos: number, mix: number, neg: number) => signals([...products, { id: "__ex", category: "all", positive: pos, mixed: mix, judged: pos + mix + neg }]).get("__ex")?.signal ?? "–";
  // SkinRecs (attribute profile): its own words for the score, the dots and the match (padel's text is unchanged).
  const quick = fitConfigFor(niche)?.quick;
  const skin = !!attrProfileFor(niche), scoreName = skin ? scoreLabel : quick && v2copy.score ? `${v2copy.score[0].toUpperCase()}${v2copy.score.slice(1)}` : "Player score";
  const steps = [
    ["Collect", skin ? "Reviews sent through this site, YouTube reviews and beauty blogs we summarise, and what people write in public skincare forums." : `Player reviews sent through this site, YouTube reviews we watch and summarise, and what players write in public ${v2copy.sport ? `${v2copy.sport} ` : ""}forums.`, siteColor("--site-acc", "oklch(0.88 0.17 125)")],
    ["Tag the verdict", skin ? "Each review becomes one of three: loved it, mixed, or not for me. We also note the writer's own skin type, when they say it, and what they liked or hated." : "Each review becomes one of three: loved it, mixed, or not for me. We also note the player's level and what they liked or hated.", siteColor("--site-acc", "oklch(0.93 0.14 100)")],
    ["Count it", `Verdicts roll up into a ${scoreName} per ${w.one}. More reviews = more confidence.`, "oklch(0.94 0.05 200)"],
    ["Write one honest line", "We sum up what people keep saying, the good and the catch, so you can scan instead of reading 60 reviews.", "oklch(0.92 0.06 30)"],
  ];
  // The lowest review floor of the site's lists (each list sets its own; MIN_LIST_REVIEWS where unset).
  const listMin = Math.min(...(niche.topLists ?? []).map(l => l.minReviews ?? MIN_LIST_REVIEWS), Infinity);
  const rules = [
    ["✗", "Brands can't pay for placement.", "Not for a higher rank, a nicer summary, or to remove a bad review."],
    ["✗", `No free ${w.many} in exchange for coverage.`, "If a brand sends one, it doesn't get reviewed by us."],
    ["$", "Some \"check price\" links are affiliate.", "They pay for hosting. They never change the order: the score is worked out from reviews only."],
    // The real thresholds (Grok pickleball audit 2026-11-17, #16): a score from NEW_UNDER reviews; the lists' own floor.
    [`${NEW_UNDER}+`, `A score from ${NEW_UNDER} reviews.`, `Below that, a ${w.one} has a page that says "New", with no score${listMin >= NEW_UNDER ? " and no spot in any list" : ""}.`],
    ["↻", "Scores move with new reviews.", "Every published review counts toward the numbers."],
  ];
  const faqs: [string, string][] = [
    [`Why don't you test ${w.many} yourselves?`, `One tester's arm, level and style is one data point. Sixty players across all levels tells you far more about how a ${w.one} behaves for someone like you.`],
    ["Can a brand flood you with fake reviews?", `Every site review goes through a check before it's published, and we watch for bursts from new visitors on the same ${w.one}. Suspicious batches get held, not counted.`],
    ["What does a mixed verdict mean?", "The player liked parts but wouldn't fully recommend it, e.g. loved the sweet spot, hated the bounce. It counts as neither a yes nor a no."],
  ];
  return <>
    <main className={`hw ${qtFontVars}`}>
      <section>
        <p className="hw-k">{"// how we make these"}</p>
        <h1>{`No lab. No sponsored ${w.many}. Just a lot of `}<span className="hl">{niche.people.many}</span>.</h1>
        <p className="hw-lead">{`We don't test ${w.many} ourselves. We collect what people who actually own them say, count it honestly, and boil it down so you can decide in two minutes.`}</p>
      </section>
      <section>
        <h2>The process, in 4 steps</h2>
        <ol className="hw-steps">{steps.map(([t, b, bg], i) => <li key={t}><span style={{ background: bg }}>{i + 1}</span><div><b>{t}</b><p>{b}</p></div></li>)}</ol>
      </section>
      <section id="signal">
        <h2 className="tight">{`The ${scoreName}, explained`}</h2>
        <p className="hw-sub">{skin ? `It blends how much people love the ${w.one} with how many have weighed in, held back while only a few people have spoken. So a handful of glowing reviews can't beat a crowd of good ones. It's not a % of happy users.` : `It blends how much players love the ${w.one} with how many have weighed in, held back while only a few people have spoken. So a handful of glowing reviews can't beat a crowd of good ones. It's not a % of happy players.`}</p>
        <SignalTry products={products}/>
        <div className="hw-ex">
          <div><strong>{`${w.One} A:`}</strong> 5 reviews, all loved it → <strong>New</strong>{`. No score until ${NEW_UNDER} reviews: promising, but too early to trust.`}</div>
          <div><strong>{`${w.One} B:`}</strong> 60 reviews, 48 loved it → <strong>{example(48, 8, 4)}</strong>. Fewer fans by percentage, but far more proof.</div>
        </div>
        <p className="hw-sub hw-dots">{skin ? `"Who it suits" on ${w.one} pages counts only people who said they have that skin type: dry, oily, combination, sensitive or acne-prone. It needs at least 3 of them, and with few it leans on the ${w.one}'s overall verdict. The "How it feels" dots compare how often each ${w.one} is called hydrating or gentle (or drying and irritating) with the rest of its type. Finish and texture sit on a line from matte to dewy and light to rich.` : quick ? `The three "How it plays" bars on ${w.one} pages work the same way: from thrower reports, we count how often each ${w.one} is called easy to throw, long and accurate, then compare it with the rest of the catalog; the flight numbers set limits (a speed 11+ driver is never "easy to throw"). 5 out of 5 means more than most ${w.many}.`
          : `The "How it ${fitConfigFor(niche)?.words?.howIt ?? "plays"}" dots on ${w.one} pages work the same way: from player reports, we count how often each ${w.one} is called ${fitConfigFor(niche)?.dotsWords ?? "forgiving, powerful, controlled, good in defence, kind to the arm or fast"}, then compare it with the rest of the catalog. 5 dots means more than most ${w.many} and 2 less than most; no dots means too few reports to say.`}</p>
      </section>
      <section id="match">
        <h2 className="tight">The match %, explained</h2>
        <p className="hw-sub">{skin ? `When you pick your skin type, sensitive or acne-prone, and a finish on the home page, each ${w.one} gets a match %: how well it fits your skin, from what people with your skin type said. Not a % of happy users. It weighs "who it suits" for your skin type most, then sensitive and acne-prone if ticked, then finish or texture, and a little of the ${scoreName}. A Strong fit scores 75 or more, Worth a look 55–74. Too few people with your skin type? No % at all. Fragrance-free is a filter, not a score.` : quick?.armFilter ? `When you pick a gear type, your level and console on the home page, each ${w.one} gets a match %: how well it fits those picks, from ${niche.people.one} reports, YouTube reviewers and our own expert ratings. Not a % of happy ${niche.people.many}. It weighs whether ${niche.people.many} put it at your level and a little of the ${scoreName}. The type and console picks are filters: a PC-only ${w.one} never shows when you race on console.`
          : quick ? `When you pick a ${w.one} type, your level and ${quick.arm} on the home page, each ${w.one} gets a match %: how well it fits those picks, from player reports, YouTube reviewers and the flight numbers. Not a % of happy players. It weighs whether players put it at your level, how it suits a slower arm if you tick that, the stability you pick (if any), and a little of the ${scoreName}. The type you pick is a filter, not a score. A Strong fit scores 75 or more, Worth a look 55–74. Too few reports? No % at all.` : `When you pick your style, level and arm on the home page, each ${w.one} gets a match %: how well it fits those picks, from player reports. Not a % of happy players. It weighs the ${w.one}'s Control or Power score against your style, whether players and brands put it at your level, the Arm comfort score if you have a sore arm, and a little of the Player score. It always agrees with the word beside it: a Strong fit scores 75 or more, Worth a look 55–74, Probably not under 55. A ${w.one} held back by your level or a sore arm stays under 55, in its own order. Under ${MIN_FIT_REPORTS} reports? No % at all.`}</p>
      </section>
      <section>
        <h2>House rules</h2>
        <div className="hw-rules">{rules.map(([icon, t, b]) => <div key={t}><span>{icon}</span><div><strong>{t}</strong> {b}</div></div>)}</div>
      </section>
      <section>
        <h2>Fair questions</h2>
        <FaqList faqs={faqs}/>
      </section>
      <section className="hw-cta">
        <div><p className="t">The site is only as good as its reviews.</p><p>{`Got a ${w.one}? Two taps and you're part of it.`}</p></div>
        <a href="/add-review">+ add a review</a>
      </section>
    </main>
    <V2Footer/>
  </>;
}
