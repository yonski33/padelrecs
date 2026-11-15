import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, score } from "../../db/data";
import { niche } from "../../lib/niche";
import { signals, MIN_SIGNAL_REVIEWS, type SignalInput } from "../../lib/signal";
import { signalCategory } from "../signals";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import SignalTry from "./signal-try";
import FaqList from "./faq-list";
import "./how.css";
import { fitConfigFor } from "../../lib/fit-config";

// "How we make these" (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/CVvBQnDCRtn2PhCdd77PA5). PadelRecs
// only for now. Every number on it comes from the real formula (lib/signal.ts) and the real catalog.
export const metadata: Metadata = { title: "How we make these", description: `How ${niche.site.name} turns player reviews into one honest line and a score.`, alternates: { canonical: "/how-we-make-these" } };

export default async function HowWeMakeThese() {
  const cfg = fitConfigFor(niche);
  if (!cfg) notFound();
  const R = cfg.word, Rc = R[0].toUpperCase() + R.slice(1);
  const data = await catalog();
  const products: SignalInput[] = data.listed.map(r => { const s = score(data, r.id); return { id: r.id, category: signalCategory(r), positive: s.positive, mixed: s.mixed, judged: s.judged }; });
  // The two example rackets, scored by the same formula against the real catalog.
  const example = (pos: number, mix: number, neg: number) => signals([...products, { id: "__ex", category: "all", positive: pos, mixed: mix, judged: pos + mix + neg }]).get("__ex")?.signal ?? "–";
  const steps = [
    ["Collect", `Player reviews sent through this site, YouTube reviews we watch and summarise, and what players write in public ${cfg.sourceWords.forum}s.`, "oklch(0.88 0.17 125)"],
    ["Tag the verdict", "Each review becomes one of three: loved it, mixed, or not for me. We also note the player's level and what they liked or hated.", "oklch(0.93 0.14 100)"],
    ["Count it", `Verdicts roll up into a signal score per ${R}. More reviews = more confidence.`, "oklch(0.94 0.05 200)"],
    ["Write one honest line", "We sum up what people keep saying, the good and the catch, so you can scan instead of reading 60 reviews.", "oklch(0.92 0.06 30)"],
  ];
  const rules = [
    ["✗", "Brands can't pay for placement.", "Not for a higher rank, a nicer summary, or to remove a bad review."],
    ["✗", `No free ${R}s in exchange for coverage.`, "If a brand sends one, it doesn't get reviewed by us."],
    ["$", "Some \"check price\" links are affiliate.", "They pay for hosting. They never change the order: the score is worked out from reviews only."],
    [`${MIN_SIGNAL_REVIEWS}+`, `Minimum ${MIN_SIGNAL_REVIEWS} reviews to be ranked.`, `Below that, a ${R} has a page but no spot in any list.`],
    ["↻", "Scores move with new reviews.", "Every published review counts toward the numbers."],
  ];
  const faqs: [string, string][] = [
    [`Why don't you test ${R}s yourselves?`, `One tester's arm, level and style is one data point. Sixty owners across all levels tells you far more about how a ${R} behaves for someone like you.`],
    ["Can a brand flood you with fake reviews?", `Every site review goes through a check before it's published, and we watch for bursts from new visitors on the same ${R}. Suspicious batches get held, not counted.`],
    ["What does a mixed verdict mean?", "The player liked parts but wouldn't fully recommend it, e.g. loved the sweet spot, hated the bounce. It counts as neither a yes nor a no."],
  ];
  return <>
    <main className={`hw ${qtFontVars}`}>
      <section>
        <p className="hw-k">{"// how we make these"}</p>
        <h1>{`No lab. No sponsored ${R}s. Just a lot of `}<span className="hl">players</span>.</h1>
        <p className="hw-lead">{`We don't test ${R}s ourselves. We collect what people who actually own them say, count it honestly, and boil it down so you can decide in two minutes.`}</p>
      </section>
      <section>
        <h2>The process, in 4 steps</h2>
        <ol className="hw-steps">{steps.map(([t, b, bg], i) => <li key={t}><span style={{ background: bg }}>{i + 1}</span><div><b>{t}</b><p>{b}</p></div></li>)}</ol>
      </section>
      <section id="signal">
        <h2 className="tight">The signal score, explained</h2>
        <p className="hw-sub">{`It's the share of players who loved the ${R}, held back while only a few people have spoken. So a handful of glowing reviews can't beat a crowd of good ones.`}</p>
        <SignalTry products={products} word={R}/>
        <div className="hw-ex">
          <div><strong>{`${Rc} A:`}</strong> 5 reviews, all loved it → <strong>{example(5, 0, 0)}</strong>. Promising, but too early to trust.</div>
          <div><strong>{`${Rc} B:`}</strong> 60 reviews, 48 loved it → <strong>{example(48, 8, 4)}</strong>. Fewer fans by percentage, but far more proof.</div>
        </div>
        <p className="hw-sub hw-dots">{`The "How it plays" dots on ${R} pages work the same way: from player reports, we count how often each ${R} is called ${cfg.dotsWords}, then compare it with the rest of the catalog. 5 dots means more than most ${R}s; no dots means too few reports to say.`}</p>
      </section>
      <section id="match">
        <h2 className="tight">The match %, explained</h2>
        <p className="hw-sub">{`When you pick your style, level and arm on the home page, each ${R} gets a match %: how well it fits those picks, from player reports. Not a % of happy players. It weighs the ${R}'s Control or Power score against your style, whether players and brands put it at your level, the Arm comfort score if you have a sore arm, and a little of the Player score. It always agrees with the word beside it: a Strong fit scores 70–99, Worth a look 45–69, Probably not your match 15–44. Too few reports? No % at all.`}</p>
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
        <div><p className="t">The site is only as good as its reviews.</p><p>{`Got a ${R}? Two taps and you're part of it.`}</p></div>
        <a href="/add-review">+ add a review</a>
      </section>
    </main>
    <V2Footer/>
  </>;
}
