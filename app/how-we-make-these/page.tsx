import type { Metadata } from "next";
// Reads the catalog on every request (the layout no longer forces it, see app/layout.tsx).
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { catalog, score } from "../../db/data";
import { niche, isV2, v2copy, scoreLabel, kicker } from "../../lib/niche";
import { attrProfileFor } from "../../lib/attr-profile";
import { signals, MIN_SIGNAL_REVIEWS, type SignalInput } from "../../lib/signal";
import { signalCategory } from "../signals";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import SignalTry from "./signal-try";
import FaqList from "./faq-list";
import "./how.css";

// "How we make these" (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/CVvBQnDCRtn2PhCdd77PA5). PadelRecs
// only for now. Every number on it comes from the real formula (lib/signal.ts) and the real catalog.
export const metadata: Metadata = { title: "How we make these", description: `How ${niche.site.name} turns player reviews into one honest line and a score.`, alternates: { canonical: "/how-we-make-these" } };

const w = niche.words;
export default async function HowWeMakeThese() {
  if (!isV2) notFound();
  const data = await catalog();
  const products: SignalInput[] = data.listed.map(r => { const s = score(data, r.id); return { id: r.id, category: signalCategory(r), positive: s.positive, mixed: s.mixed, judged: s.judged }; });
  // The two example rackets, scored by the same formula against the real catalog.
  const example = (pos: number, mix: number, neg: number) => signals([...products, { id: "__ex", category: "all", positive: pos, mixed: mix, judged: pos + mix + neg }]).get("__ex")?.signal ?? "–";
  // SkinRecs (attribute profile): its own words for the score, the dots and the match (padel's text is unchanged).
  const skin = !!attrProfileFor(niche), scoreName = skin ? scoreLabel : "Player score";
  const steps = [
    ["Collect", skin ? "Reviews sent through this site, YouTube reviews and beauty blogs we summarise, and what people write in public skincare forums." : `Player reviews sent through this site, YouTube reviews we watch and summarise, and what players write in public ${v2copy.sport ? `${v2copy.sport} ` : ""}forums.`, "oklch(0.88 0.17 125)"],
    ["Tag the verdict", skin ? "Each review becomes one of three: loved it, mixed, or not for me. We also note the writer's own skin type, when they say it, and what they liked or hated." : "Each review becomes one of three: loved it, mixed, or not for me. We also note the player's level and what they liked or hated.", "oklch(0.93 0.14 100)"],
    ["Count it", `Verdicts roll up into a ${scoreName} per ${w.one}. More reviews = more confidence.`, "oklch(0.94 0.05 200)"],
    ["Write one honest line", "We sum up what people keep saying, the good and the catch, so you can scan instead of reading 60 reviews.", "oklch(0.92 0.06 30)"],
  ];
  const rules = [
    ["✗", "Brands can't pay for placement.", "Not for a higher rank, a nicer summary, or to remove a bad review."],
    ["✗", `No free ${w.many} in exchange for coverage.`, "If a brand sends one, it doesn't get reviewed by us."],
    ["$", "Some \"check price\" links are affiliate.", "They pay for hosting. They never change the order: the score is worked out from reviews only."],
    [`${MIN_SIGNAL_REVIEWS}+`, `Minimum ${MIN_SIGNAL_REVIEWS} reviews to be ranked.`, `Below that, a ${w.one} has a page but no spot in any list.`],
    ["↻", "Scores move with new reviews.", "Every published review counts toward the numbers."],
  ];
  const faqs: [string, string][] = [
    [`Why don't you test ${w.many} yourselves?`, `One tester's arm, level and style is one data point. Sixty owners across all levels tells you far more about how a ${w.one} behaves for someone like you.`],
    ["Can a brand flood you with fake reviews?", `Every site review goes through a check before it's published, and we watch for bursts from new visitors on the same ${w.one}. Suspicious batches get held, not counted.`],
    ["What does a mixed verdict mean?", "The player liked parts but wouldn't fully recommend it, e.g. loved the sweet spot, hated the bounce. It counts as neither a yes nor a no."],
  ];
  return <>
    <main className={`hw ${qtFontVars}`}>
      <section>
        <p className="hw-k">{kicker("how we make these")}</p>
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
          <div><strong>{`${w.One} A:`}</strong> 5 reviews, all loved it → <strong>{example(5, 0, 0)}</strong>. Promising, but too early to trust.</div>
          <div><strong>{`${w.One} B:`}</strong> 60 reviews, 48 loved it → <strong>{example(48, 8, 4)}</strong>. Fewer fans by percentage, but far more proof.</div>
        </div>
        <p className="hw-sub hw-dots">{skin ? `"Who it suits" on ${w.one} pages counts only people who said they have that skin type: dry, oily, combination, sensitive or acne-prone. It needs at least 3 of them, and with few it leans on the ${w.one}'s overall verdict. The "How it feels" dots compare how often each ${w.one} is called hydrating or gentle (or drying and irritating) with the rest of its type. Finish and texture sit on a line from matte to dewy and light to rich.` : `The "How it plays" dots on ${w.one} pages work the same way: from player reports, we count how often each ${w.one} is called forgiving, powerful, controlled, good in defence, kind to the arm or fast, then compare it with the rest of the catalog. 5 dots means more than most ${w.many}; no dots means too few reports to say.`}</p>
      </section>
      <section id="match">
        <h2 className="tight">The match %, explained</h2>
        <p className="hw-sub">{skin ? `When you pick your skin type, sensitive or acne-prone, and a finish on the home page, each ${w.one} gets a match %: how well it fits your skin, from what people with your skin type said. Not a % of happy users. It weighs "who it suits" for your skin type most, then sensitive and acne-prone if ticked, then finish or texture, and a little of the ${scoreName}. A Strong fit scores 75 or more, Worth a look 55–74. Too few people with your skin type? No % at all. Fragrance-free is a filter, not a score.` : `When you pick your style, level and arm on the home page, each ${w.one} gets a match %: how well it fits those picks, from player reports. Not a % of happy players. It weighs the ${w.one}'s Control or Power score against your style, whether players and brands put it at your level, the Arm comfort score if you have a sore arm, and a little of the Player score. It always agrees with the word beside it: a Strong fit scores 70–99, Worth a look 45–69, Probably not your match 15–44. Too few reports? No % at all.`}</p>
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
