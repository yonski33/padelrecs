import "./skin-product.css";
import "./home-beauty.css";
import "./pages-beauty.css";
import Link from "next/link";
import { skinContext } from "./context";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { niche, catalogPath, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { FEW_VOICES } from "../../lib/attr-score";
import { V2Footer } from "../v2-footer";

/** The SkinRecs guide, "Skincare, decoded" (owner's Claude Design "SkinRecs guide", 2026-11-16). Every count is the catalogue's
 *  and links to the list it counts: "good for <type>" is the who-it-suits score (65+ from enough people of that type), texture
 *  is the texture score reviewers give, fragrance and price are the product facts. The actives table and rules of thumb are
 *  the owner's general advice. The mock's statistics ("from 4,318 reviews", "41 people said something similar") are left out:
 *  we have no count behind them. */
const GOOD = 65;
const Head = ({ i, t, s }: { i: number; t: string; s: string }) => <div className="bg-h"><span>{`0${i}`}</span><h2>{t}</h2><small>{s}</small></div>;
const Rule = ({ k = "rule of thumb", children }: { k?: string; children: React.ReactNode }) => <p className="bg-rule"><span>{k}</span><span>{children}</span></p>;

export default async function GuideBeauty() {
  const ctx = await skinContext(), { data } = ctx;
  const listed = data.listed, a = (id: string) => ctx.attrs.get(id);
  const good = (id: string, k: string) => { const s = a(id)?.scores[`suits_${k}`]; return !!s && s.score >= GOOD && s.n >= FEW_VOICES; };
  const n = (f: (r: (typeof listed)[number]) => boolean) => listed.filter(f).length;
  const href = (q: Record<string, string>) => `${catalogPath}?${new URLSearchParams(q)}`;
  const nameOf = (r: (typeof listed)[number]) => displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name);
  const top = (f: (r: (typeof listed)[number]) => boolean) => listed.filter(f).filter(r => ctx.signal(r.id) !== null).sort((x, y) => ctx.signal(y.id)! - ctx.signal(x.id)!)[0];
  const tex = (id: string) => { const t = a(id)?.scores.texture; return !t || t.n < 3 ? null : t.score < 35 ? "light" : t.score > 65 ? "rich" : "mid"; };
  const balm = niche.typePages?.find(t => t.shape === "Balm & ointment"), sun = niche.typePages?.find(t => t.shape === "Sunscreen");
  const ff = (id: string) => a(id)?.facts.fragrance_free;
  const price = (id: string) => a(id)?.facts.price;
  const topLotion = top(r => r.shape === "Moisturizer" && tex(r.id) === "mid"), topSun = top(r => r.shape === "Sunscreen");

  const nav = [["Skin type", "type"], ["Texture", "texture"], ["Actives", "actives"], ["Fragrance", "fragrance"], ["Layering", "layering"], ["Sunscreen", "spf"], ["Budget", "budget"]];
  const tldr = [
    { who: "Dry & tight", pick: "rich textures, ceramides, fragrance-free", href: "/?skin=dry&goal=hydrate&tex=rich#match" },
    { who: "Oily & shiny", pick: "light gels, niacinamide, thin layers", href: "/?skin=oily&goal=clear&tex=light#match" },
    { who: "Red & reactive", pick: "fragrance-free, few ingredients, mineral SPF", href: "/?goal=calm&sens=1&ff=1#match" },
    { who: "Starting retinol", pick: "a plain moisturizer, go slow, SPF every day", href: "/?goal=calm#match" },
  ];
  const types = [
    { k: "dry", name: "Dry", feels: "tight, flaky", line: "Needs oils and ceramides to hold water in.", fill: "oklch(0.93 0.04 45)", shine: 0 },
    { k: "normal", name: "Normal", feels: "comfortable", line: "Most textures work. Keep it simple.", fill: "oklch(0.93 0.04 20)", shine: 10 },
    { k: "combination", name: "Combination", feels: "shiny T-zone, dry cheeks", line: "Light all over, a richer layer only where needed.", fill: "oklch(0.9 0.05 20)", shine: 16 },
    { k: "oily", name: "Oily", feels: "shiny by noon", line: "Still needs moisture, just lighter. Skipping it backfires.", fill: "oklch(0.86 0.06 20)", shine: 24 },
  ].map(t => ({ ...t, n: n(r => good(r.id, t.k)) }));
  const textures = [
    { name: "Light", line: "Gels and fluids. Weightless, sinks in fast. Often picked by oily skin.", n: n(r => tex(r.id) === "light"), at: 8, href: "/?tex=light#match" },
    { name: "In between", line: "Lotions and soft creams. The everyday middle that suits most people.", n: n(r => tex(r.id) === "mid"), at: 40, href: "/#match" },
    { name: "Rich", line: "Thicker creams with more cushion. Dry skin, winter.", n: n(r => tex(r.id) === "rich"), at: 70, href: "/?tex=rich#match" },
    ...(balm ? [{ name: "Balm", line: "Seals everything in. Very dry or flaky patches.", n: n(r => r.shape === balm.shape), at: 94, href: `/${balm.slug}` }] : []),
  ];
  const actives: [string, string, string, number][] = [
    ["Ceramides", "Repair the skin barrier, stop tightness.", "Nothing much. Safe for almost everyone.", 3],
    ["Niacinamide", "Calms oil and redness, evens tone.", "High % can sting or flush at first.", 3],
    ["Hyaluronic acid", "Pulls water into skin for bounce.", "Apply to damp skin or it can feel tight.", 3],
    ["Vitamin C", "Brightens and fades dark spots.", "Can tingle. Goes off if it turns orange.", 2],
    ["Exfoliating acids", "Smooth texture, unclog pores.", "Overuse leads to redness. 2 to 3 nights a week.", 1],
    ["Retinol", "Fine lines, acne, texture over months.", "Peeling at first. Start slow, always use SPF.", 1],
  ];
  const steps = [["Cleanser", "Gentle, not squeaky. Squeaky means stripped."], ["Serum", "Thin and targeted. Your actives live here."],
    ["Moisturizer", "Seals the layers in. Never skip it."], ["SPF", "Morning only, always last. Two finger lengths."]];
  const budget = [
    { big: "$", name: "Budget", line: "Most of the cleansers and moisturizers reviewers love live here.", k: "$" },
    { big: "$$", name: "Sweet spot", line: "Better sunscreens and well-made serums.", k: "$$" },
    { big: "$$$", name: "Splurge", line: "Nicer textures and jars. Rarely better results.", k: "$$$" },
  ].map(b => ({ ...b, n: n(r => price(r.id) === b.k) }));
  const ffN = n(r => ff(r.id) === "free"), scentN = n(r => ff(r.id) === "fragrance" || ff(r.id) === "oils");
  const sunN = sun ? n(r => r.shape === sun.shape) : 0;

  return <main className={`bp bg ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bg-wrap">
      <section className="bg-hero">
        <div className="bg-crumbs"><Link href="/">home</Link> / skin guide</div>
        <h1>Skincare, <em>decoded</em></h1>
        <p>{"Seven things decide whether a product works for you. Here's what each one means for your skin, in plain words."}</p>
      </section>
      <nav className="bg-nav" aria-label="Sections">{nav.map(([t, id], i) => <a key={id} href={`#${id}`}><span>{`0${i + 1}`}</span>{t}</a>)}</nav>

      <section className="bg-tldr"><span className="bp-tag sm">tl;dr, if you read nothing else</span>
        <div>{tldr.map(t => <a key={t.who} href={t.href}><b>{t.who}</b><span>{t.pick}</span><small>match me →</small></a>)}</div></section>

      <section id="type" className="bg-sec"><Head i={1} t="Skin type" s="how your skin behaves by midday"/>
        <div className="bg-types">{types.map(t => <div key={t.k}>
          <span className="bg-dot" style={{ background: t.fill }} aria-hidden="true"><i style={{ width: t.shine, height: t.shine }}/></span>
          <b>{t.name}</b><small>{`feels: ${t.feels}`}</small><span>{t.line}</span>
          {t.n > 0 && <a href={href({ skin: t.k })}>{`${t.n} good for ${t.name.toLowerCase()} skin →`}</a>}</div>)}</div>
        <Rule k="quick test">Wash with a gentle cleanser, apply nothing, check in an hour. Tight means dry, shiny means oily, both means combination.</Rule>
      </section>

      <section className="bg-pull"><span>a rule worth keeping</span>
        <p>{"Most “bad reactions” are "}<mark>too much, too fast</mark>. Add one new product at a time.</p></section>

      <section id="texture" className="bg-sec"><Head i={2} t="Texture" s="how rich it feels on skin"/>
        <div className="bg-tex">
          <div className="bg-track" aria-hidden="true">{textures.map(t => <i key={t.name} style={{ left: `${t.at}%` }}/>)}</div>
          <div className="bg-texs" style={{ "--n": textures.length } as React.CSSProperties}>{textures.map(t => <div key={t.name}><b>{t.name}</b><span>{t.line}</span>
            {t.n > 0 && <a href={t.href}>{`${t.n} products →`}</a>}</div>)}</div>
        </div>
        <Rule>Oily? Go lighter. Dry or cold out? Go richer. Unsure? A lotion is the safe middle.</Rule>
        {topLotion && <a className="bg-top" href={productHref(topLotion)}>{`Top-rated in-between moisturizer: ${nameOf(topLotion)} →`}</a>}
      </section>

      <section id="actives" className="bg-sec"><Head i={3} t="Key actives" s="the ingredients doing the work"/>
        <div className="bg-act" role="table">
          <div className="bg-ar head" role="row"><span>ingredient</span><span>does</span><span>watch out</span><span>gentle?</span></div>
          {actives.map(([name, does, watch, g]) => <div key={name} className="bg-ar" role="row"><b>{name}</b><span>{does}</span><span className="w">{watch}</span>
            <span className="bp-drops" role="img" aria-label={`${g} of 3`}>{[1, 2, 3].map(k => <i key={k} className={k <= g ? "on" : undefined}/>)}</span></div>)}
        </div>
        <Rule>Retinol and acids at night, not on the same night. Vitamin C and SPF in the morning.</Rule>
      </section>

      <section id="fragrance" className="bg-sec"><Head i={4} t="Fragrance" s="nice smell, common trigger"/>
        <div className="bg-two">
          <div><b>Fragrance-free</b><span>No added scent or essential oils. The safe pick for reactive, red or broken-out skin.</span>
            {ffN > 0 && <a href={href({ ff: "1" })}>{`see ${ffN} products →`}</a>}</div>
          <div className="dots"><span className="bg-card"><b>Fragranced</b><span>Fine for many people. If you sting, itch or flush, this is the first thing to cut.</span>
            {scentN > 0 && <small>{`${scentN} products list a fragrance or essential oils`}</small>}</span></div>
        </div>
        <p className="bg-mono">{"“unscented” can still mean masking fragrance. Look for “fragrance-free”, or “parfum” missing from the list."}</p>
      </section>

      <section id="layering" className="bg-sec"><Head i={5} t="Layering" s="thinnest to thickest"/>
        <div className="bg-steps">{steps.map(([t, l], i) => <div key={t} className={i === 3 ? "on" : undefined}><em>{i + 1}</em><b>{t}</b><span>{l}</span></div>)}</div>
        <Rule>Pilling? Use less, and give each layer a minute before the next.</Rule>
      </section>

      <section id="spf" className="bg-sec"><Head i={6} t="Sunscreen" s="mineral or chemical"/>
        <div className="bg-two">
          <div><b>Mineral</b><span>Zinc or titanium. Gentle on reactive skin, but can leave a white cast.</span></div>
          <div className="dark"><b>Chemical <small>filters</small></b><span>Sheer and light, no cast. Occasionally stings around the eyes.</span></div>
        </div>
        <span className="bg-links">{sun && sunN > 0 && <a href={`/${sun.slug}`}>{`see all ${sunN} sunscreens →`}</a>}
          {topSun && <a href={productHref(topSun)}>{`Top-rated sunscreen: ${nameOf(topSun)} →`}</a>}</span>
      </section>

      <section id="budget" className="bg-sec"><Head i={7} t="Budget" s="what you get for your money"/>
        <div className="bg-steps three">{budget.map((b, i) => <div key={b.k} className={i === 1 ? "on" : undefined}><em>{b.big}</em><b>{b.name}</b><span>{b.line}</span>
          {b.n > 0 && <a href={href({ price: b.k })}>{`see ${b.n} products →`}</a>}</div>)}</div>
        <Rule>{"Save on cleanser and moisturizer. Spend on sunscreen you'll actually wear."}</Rule>
      </section>

      <section className="bg-cta"><div><b>Skip the theory. Get matched.</b><span>{"Pick your skin type and goal to see every product ranked for you."}</span></div>
        <Link className="bp-btn" href="/#match">Find my match →</Link></section>
      <p className="bg-mono">{`Counts are from the ${listed.length} products we track. "Good for" means people with that skin type rated it well, at least ${FEW_VOICES} of them.`}</p>
    </div>
    <V2Footer/>
  </main>;
}
