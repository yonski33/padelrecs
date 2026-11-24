import "./skin-product.css";
import "./home-beauty.css";
import "./pages-beauty.css";
import { catalog, score } from "../../db/data";
import { signals, MIN_SIGNAL_REVIEWS, type SignalInput } from "../../lib/signal";
import { FEW_VOICES } from "../../lib/attr-score";
import { signalCategory } from "../signals";
import { V2Footer } from "../v2-footer";
import SignalTry from "../how-we-make-these/signal-try";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";

/** "How we score" for SkinRecs in the owner's beauty design (Claude Design "SkinRecs how we score", 2026-11-16). The numbers
 *  come from the real formula (lib/signal.ts) and catalogue, as on padel's page; the rules say what the site really does
 *  (site reviews are checked before they count, not each one read by a person). */
/** The name the owner's designs use for the 0-99 score on every SkinRecs page. */
const scoreLabel = "User score";
const GREEN = "oklch(0.86 0.07 155)", MARK = "oklch(0.92 0.14 98)", PAPER = "#fffdfa";

export default async function ScoreBeauty() {
  const data = await catalog();
  const products: SignalInput[] = data.listed.map(r => { const s = score(data, r.id); return { id: r.id, category: signalCategory(r), positive: s.positive, mixed: s.mixed, judged: s.judged }; });
  const example = (pos: number, mix: number, neg: number) => signals([...products, { id: "__ex", category: "all", positive: pos, mixed: mix, judged: pos + mix + neg }]).get("__ex")?.signal ?? "–";
  const steps = [
    ["Collect", "Reviews sent through this site, YouTube reviews from skincare creators and dermatologists, beauty blogs, and what people write in public skincare forums.", "oklch(0.9 0.06 20)"],
    ["Read the take", "Each review becomes one of three: loved it, mixed, or not for me. We also note the writer's skin type, when they say it, and what helped or irritated.", MARK],
    ["Count it", `Reviews roll up into a ${scoreLabel.toLowerCase()} per product. More reviews, more confidence.`, "oklch(0.93 0.05 155)"],
    ["Write one honest line", "We sum up what people keep saying, the good and the catch, so you can scan instead of reading 60 reviews.", "oklch(0.94 0.045 45)"],
  ];
  const rules = [
    ["✕", "Brands can't pay for placement.", "Not for a higher rank, a nicer summary, or to remove a bad review."],
    ["✕", "No free products in exchange for coverage.", "If a brand sends one, we don't review it."],
    ["$", "Some “check price” links are affiliate.", "They pay for hosting. The score is worked out from reviews only, so links never change the order."],
    [`${MIN_SIGNAL_REVIEWS}+`, `Minimum ${MIN_SIGNAL_REVIEWS} reviews to be ranked.`, "Below that, a product has a page but no spot in any list."],
    ["◐", "Reviews are sorted by skin type.", `So oily-skin reviewers don't drown out dry-skin ones. “Who it suits” needs at least ${FEW_VOICES} people of a skin type before it says anything.`],
    ["↻", "Scores move with new reviews.", "Every published review counts toward the numbers."],
  ];
  const faqs = [
    ["Why don't you test products yourselves?", "One face is one data point. Sixty reviewers across every skin type tell you far more about how a product behaves on skin like yours."],
    ["Are you dermatologists?", "No. We count what real people report. For eczema, rosacea, persistent acne or anything that worries you, see a dermatologist."],
    ["Can a brand flood you with fake reviews?", "Every review sent through this site is checked before it's published, and we watch for bursts from new visitors on the same product. Suspicious batches get held, not counted."],
    ["What does a mixed review mean?", "The reviewer liked parts but wouldn't fully recommend it, for example loved the texture but it pilled under SPF. It counts as neither a yes nor a no."],
  ];
  return <main className={`bp bs ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bs-wrap">
      <section className="bs-hero"><div className="bs-k">how we score</div>
        <h1>No lab. No sponsored jars. Just a lot of <em>real skin</em>.</h1>
        <p>{"We don't test products on our own faces. We collect what people who actually used them say, count it honestly, and boil it down so you can decide in two minutes."}</p></section>

      <section><h2>The process, in 4 steps</h2>
        <ol className="bs-steps">{steps.map(([t, b, bg], i) => <li key={t}><span style={{ background: bg }}>{i + 1}</span><div><b>{t}</b><p>{b}</p></div></li>)}</ol></section>

      <section id="signal"><h2>{`The ${scoreLabel.toLowerCase()}, explained`}</h2>
        <p className="bs-sub">{"It blends how much people love a product with how many have weighed in, held back while only a few people have spoken. So a handful of glowing reviews can't beat a crowd of good ones. It's not a % of happy users."}</p>
        <div className="bs-try"><SignalTry products={products} tones={[GREEN, MARK, PAPER]} plain/></div>
        <div className="bs-ex">
          <div><strong>Serum A:</strong> 5 reviews, all loved it, scores <strong>{example(5, 0, 0)}</strong>. Promising, but too early to trust.</div>
          <div><strong>Serum B:</strong> 60 reviews, 48 loved it, scores <strong>{example(48, 8, 4)}</strong>. Fewer fans by percentage, far more proof.</div>
        </div></section>

      <section id="match"><h2>Match % is different</h2>
        <p className="bs-sub">{`The ${scoreLabel.toLowerCase()} is the same for everyone. Match % is just for you: how well a product fits the skin type, goal and sensitivity you picked, from what people with your skin type said. A Strong fit is 75 or more, Worth a try 55 to 74. Too few people with your skin type? No % at all.`}</p>
        <div className="bs-two">
          <div><span className="bs-badge">86</span><span><b>{scoreLabel}</b><small>How much reviewers liked it, overall.</small></span></div>
          <div className="pink"><span className="bs-pill">91%</span><span><b>Match %</b><small>How well it fits your skin. Weighted by reviewers like you.</small></span></div>
        </div>
        <p className="bs-mono">the two numbers above are examples</p></section>

      <section><h2>House rules</h2>
        <div className="bs-rules">{rules.map(([i, t, b]) => <div key={t}><span>{i}</span><div><strong>{t}</strong> {b}</div></div>)}</div></section>

      <section className="bh-faq bs-faq"><h2>Fair questions</h2>
        <div className="bp-card">{faqs.map(([q, a]) => <details key={q}><summary><span>{q}</span><i aria-hidden="true"/></summary><p>{a}</p></details>)}</div></section>

      <section className="bg-cta"><div><b>The site is only as good as its reviews.</b><span>{"Used something? Two taps and you're part of it."}</span></div>
        <a className="bp-btn" href="/add-review">+ add a review</a></section>
    </div>
    <V2Footer/>
  </main>;
}
