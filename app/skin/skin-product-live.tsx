"use client";
// The SkinRecs product page's skin check in the browser (owner 2026-11-16: "changing … skin picks … is slow"). The server
// renders the address's picks (a cached page per set of picks, app/v/racket); a tap re-runs the page's answers
// (app/skin/product-view.ts) on the data sent once with the page and updates the address with no request
// (app/instant-view.ts). Links stay real links: a new tab, or no JavaScript, still gets the server's page.
import type { ReactNode } from "react";
import { useInstantView, instantClick } from "../instant-view";
import { productView, GOAL_LABEL, type ProductInput } from "./product-view";
import ProductCompare from "./product-compare";
import ProductSticky from "./product-sticky";
import { attrProfileFor } from "../../lib/attr-profile";
import { niche } from "../../lib/niche";
import { SKIN_TYPES, GOALS, readSkinChoice, skinHref, type SkinChoice } from "../../lib/skin-choice";

const PILL = { good: ["Strong fit", "oklch(0.9 0.05 155)"], maybe: ["Worth a try", "oklch(0.93 0.03 70)"], no: ["Probably not", "oklch(0.93 0.04 30)"] } as const;
const reviewsWord = (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`;
const types = niche.typePages ?? [];

export function SkinProductLive({ input, choice: first, summary, photo, hero, reviews, specs, buy }: { input: ProductInput; choice: SkinChoice;
  summary: string | null; photo: string | null; /** The hero's product side, server-rendered. */ hero: ReactNode; reviews: ReactNode; specs: ReactNode;
  buy: { url: string; label: string; rel: string } | null }) {
  // The picks only (a product page has no type pick); the address keeps the hero anchor, as the server's links did.
  const at = (c: SkinChoice) => skinHref({ ...c, type: null, typeSlug: null }, input.here, "#bp-hero");
  const [choice, set] = useInstantView(first, q => readSkinChoice(Object.fromEntries(q), types), at, "replace");
  const v = productView(attrProfileFor(niche)!, input, choice);
  const { kind, pct, tags, sensOn } = v, goal = choice.goal;
  const go = (next: SkinChoice, cls: string, on?: boolean) => ({ href: at(next), onClick: instantClick(() => set(next)), className: cls, "aria-current": on ? "true" as const : undefined });
  const pill = (label: string, next: SkinChoice, on: boolean, small = false) => <a key={label} {...go(next, `bp-pick${on ? " on" : ""}${small ? " sm" : ""}`, on)}>{label}</a>;
  const sensNext = { ...choice, concerns: sensOn ? choice.concerns.filter(x => x !== "sensitive") : [...choice.concerns, "sensitive"], noConcerns: false };
  const typesRow = (small = false) => SKIN_TYPES.map(k => pill(k, { ...choice, skin: k }, choice.skin === k, small));
  const goalsRow = (small = false) => GOALS.map(g => pill(GOAL_LABEL[g], { ...choice, goal: g }, goal === g, small));
  const start = readSkinChoice({}, types);

  return <>
    <a className="bp-back" href={v.backHref}>{v.backLabel}</a>
    <section id="bp-hero" className="bp-hero">
      {hero}
      <div className="bp-check">
        {!v.answered ? <div className="bp-ask">
          <span className="bp-tag">✦ skin check</span>
          <div><div className="bp-q">Is this right for <em>your</em> skin?</div>
            <div className="bp-sub">{`Two taps and we'll check it against ${reviewsWord(v.total)} from people with your skin.`}</div></div>
          <div className="bp-steps">
            <div><span className="bp-sl">1. Your skin type</span><div className="bp-picks">{typesRow()}</div></div>
            <div><span className="bp-sl">2. What do you want it to do?</span><div className="bp-picks">{goalsRow()}</div></div>
            <a {...go(sensNext, "bp-sens", sensOn)}><i>{sensOn ? "✓" : ""}</i>My skin reacts easily <span>(optional)</span></a>
          </div>
          {v.bestFor.length > 0 && <div className="bp-best"><strong>Generally best for</strong>{` ${v.bestFor.join(", ")}.`}</div>}
        </div> : <div className="bp-ans" aria-live="polite">
          <div className="bp-ansh"><span className="bp-tag">✦ your match</span>
            <span className="bp-verdict" style={{ background: kind && kind !== "thin" ? PILL[kind][1] : "#f4ede6" }}>{pct === null ? "— · not enough reports" : `${pct}% · ${PILL[kind as "good"][0]}`}</span></div>
          <div><div className="bp-q big">{v.headline}</div><div className="bp-sub">{`For your ${tags.join(", ")} skin, here's the short answer.`}</div></div>
          {v.why && <div className="bp-why"><span>✓ Why it suits you</span><p>{v.why}</p></div>}
          {v.consider && <div className="bp-know"><span>◦ Worth knowing</span><p>{v.consider}</p></div>}
          <input type="checkbox" id="bp-edit" className="bp-edit-t" aria-label="Edit your answers"/>
          <div className="bp-foot"><span>{tags.map(t => t[0].toUpperCase() + t.slice(1)).join(" · ")}</span>
            <span><label htmlFor="bp-edit" className="bp-editl"><span className="o">edit</span><span className="c">done ✓</span></label><a href={input.here} onClick={instantClick(() => set(start))}>start over</a></span></div>
          <div className="bp-editp"><div className="bp-picks">{typesRow(true)}</div><div className="bp-picks">{goalsRow(true)}
            <a {...go(sensNext, "bp-sens sm", sensOn)}><i>{sensOn ? "✓" : ""}</i>reactive</a></div></div>
        </div>}
      </div>
    </section>

    <section className="bp-col">
      {!v.answered && summary && <div className="bp-bottom"><span className="bp-tag">the bottom line</span><span>{summary}</span></div>}
      {(v.yesL.length > 0 || v.noL.length > 0) && <div id="yes-no">
        <div className="bp-h"><h2>Why yes, why not</h2><span>{v.answered ? `sorted for your ${tags.join(" · ")} skin` : "from real reviews, YouTube & blogs"}</span></div>
        <div className="bp-yn">
          {([["yes", "Why yes", "✓", v.yesL], ["no", "Why not", "!", v.noL]] as const).map(([k, label, icon, list]) => list.length > 0 && <div key={k} className={`bp-card bp-side-${k}`}>
            <div className="bp-ynh"><i>{icon}</i><b>{label}</b></div>
            <input type="checkbox" id={`bp-more-${k}`} className="bp-more-t" aria-label="Show all"/>
            {list.map((p, i) => <div key={p.key} className={`bp-item${p.forYou ? " you" : ""}${i >= 3 ? " extra" : ""}`}>
              <div className="bp-it"><b>{p.title}</b>{p.forYou && <span className="bp-tag sm">for your skin</span>}</div>
              <span className="bp-txt">{p.pre}<mark>{p.hl}</mark>{p.post}</span>
              <span className="bp-proof">{p.proof}</span></div>)}
            {list.length > 3 && <label htmlFor={`bp-more-${k}`} className="bp-morel"><span className="o">{`+ ${list.length - 3} more`}</span><span className="c">− show less</span></label>}
          </div>)}
        </div>
      </div>}
      {v.self.length > 0 && <div id="compare"><h2 className="bp-h2">How it feels &amp; compares</h2>
        <ProductCompare self={v.self} tabs={v.tabs} selfTotal={v.total} photo={photo}/></div>}
    </section>

    {reviews}
    {specs}

    <ProductSticky pct={pct} word={kind && kind !== "thin" ? PILL[kind][0] : null} pillBg={kind && kind !== "thin" ? PILL[kind][1] : "#f4ede6"} buy={buy}/>
  </>;
}
