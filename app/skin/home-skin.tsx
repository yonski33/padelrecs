import "../home-v2.css";
import "./skin-v2.css";
import Link from "next/link";
import { skinContext } from "./context";
import { rankSkin, fitWord } from "./rank";
import { listShopLink } from "../../lib/amazon-offer";
import { displayName } from "../../lib/brand-name";
import { rankedLists, listHref } from "../rankings/lists";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { platformName } from "../../lib/source-label";
import { niche, catalogPath, productHref } from "../../lib/niche";
import { newThisWeek } from "../../lib/new-this-week";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { SKIN_TYPES, FINISHES, skinHref, skinPicked, skinWords, skinQuery, type SkinChoice } from "../../lib/skin-choice";

/** The SkinRecs home in design v2, built around quick match (owner 2026-11-15: the home page IS the quiz). Picks live in the
 *  URL; the list is ranked on the server by lib/attr-score.ts (what people with your skin type said, not how many of them). */
const LIST_SIZE = 10, DAY = 86_400_000;
const MATCH_NOTE = "How well it fits your skin, from what people with your skin type said. Not a % of happy users.";
const clip = (t: string, n = 140) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;
function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
const FINISH_TYPES = new Set(["Moisturizer", "Sunscreen", "Serum"]);

export default async function HomeSkin({ choice }: { choice: SkinChoice }) {
  const [ctx, lists] = await Promise.all([skinContext(), rankedLists()]);
  const { data } = ctx, now = Date.now();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const picked = skinPicked(choice);
  const rows = rankSkin(ctx, choice).slice(0, LIST_SIZE);
  const picks = skinQuery(choice), pickQ = picks.size ? `?${picks}` : "";
  const types = niche.typePages ?? [];
  const typeLabel = types.find(t => t.slug === choice.typeSlug)?.label.toLowerCase() ?? niche.words.many;
  const showFinish = !choice.type || FINISH_TYPES.has(choice.type);
  const pill = (label: string, next: SkinChoice, on: boolean) => <Link href={skinHref(next)} scroll={false} replace aria-current={on ? "true" : undefined} className={on ? "on" : undefined}>{label}</Link>;
  const check = (label: string, next: SkinChoice, on: boolean) => <Link className="hv2-arm" href={skinHref(next)} scroll={false} replace aria-current={on ? "true" : undefined}><i aria-hidden="true">{on ? "✓" : ""}</i>{label}</Link>;
  const toggle = (k: string) => choice.concerns.includes(k) ? choice.concerns.filter(x => x !== k) : [...choice.concerns, k];

  // Fresh from YouTube and our own reviews, one per product (owner 2026-11-15, as padel).
  const seen = new Set<string>();
  const fresh = [
    ...data.reviews.map(r => ({ id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, tag: niche.site.name.toLowerCase() })),
    ...data.external.filter(e => e.sentiment && e.sourcePlatform === "YouTube" && e.summary).map(e => ({ id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary!, quote: false, tag: platformName(e.sourcePlatform).toLowerCase() })),
  ].filter(x => byId.has(x.racketId)).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 3);
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);
  const title = picked ? `Top ${typeLabel} for ${skinWords(choice)[0] ?? "you"}` : choice.type ? `Top ${typeLabel} right now` : `Top ${niche.words.many} right now`;

  return <main className={`hv2 sk2 ${qtFontVars}`}>
    <div className="hv2-wrap">
      <section className="hv2-hero">
        <div><h1>Less guessing. <span className="hl">Better skincare.</span></h1>
          <p className="hv2-sub">{"Tell us about your skin. We read the reviews so you don't have to."}</p></div>
        <p className="hv2-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${newThisWeek(data, now).toLocaleString("en-US")} new this week`}</p>
      </section>

      <section className="hv2-qm sk2-qm" id="match" aria-label="Quick match">
        <span className="hv2-qk"><b>quick match</b>{"I'm looking for"}</span>
        <span className="hv2-lv sk2-types" role="group" aria-label="Product type">
          <span>{pill("anything", { ...choice, type: null, typeSlug: null }, !choice.type)}</span>
          {types.filter(t => ["Cleanser", "Moisturizer", "Serum", "Sunscreen", "Toner", "Treatment", "Exfoliant", "Eye cream"].includes(t.shape)).map(t =>
            <span key={t.slug}>{pill(t.one?.toLowerCase() ?? t.shape.toLowerCase(), { ...choice, type: t.shape, typeSlug: t.slug, finish: FINISH_TYPES.has(t.shape) ? choice.finish : null }, choice.typeSlug === t.slug)}</span>)}
        </span>
        <span className="hv2-qk">for</span>
        <span className="hv2-seg" role="group" aria-label="Your skin type">{SKIN_TYPES.map(s => <span key={s}>{pill(s, { ...choice, skin: choice.skin === s ? null : s }, choice.skin === s)}</span>)}</span>
        <span className="hv2-qk">skin</span>
        {check("sensitive", { ...choice, concerns: toggle("sensitive") }, choice.concerns.includes("sensitive"))}
        {check("acne-prone", { ...choice, concerns: toggle("acne") }, choice.concerns.includes("acne"))}
        {showFinish && <><span className="hv2-qk">finish</span>
          <span className="hv2-lv" role="group" aria-label="Finish">{FINISHES.map(f => <span key={f}>{pill(f, { ...choice, finish: choice.finish === f ? null : f }, choice.finish === f)}</span>)}</span></>}
        {check("fragrance-free only", { ...choice, ff: !choice.ff }, choice.ff)}
        {(picked || choice.type) && <p className="hv2-game">{"Your picks: "}<b>{[choice.type ? typeLabel : null, ...skinWords(choice)].filter(Boolean).join(" · ")}</b>
          <Link href="/" scroll={false} replace>reset ↺</Link></p>}
      </section>

      <div className="hv2-grid">
        <section className="hv2-main" aria-live="polite">
          <div className="hv2-lhead"><h2>{title}</h2>
            <span>{picked ? <>{"ranked by what people with your skin said · "}<details className="hv2-what"><summary>{"what's the %?"}</summary><span>{`${MATCH_NOTE} `}<a href="/how-we-make-these#match">how it works</a></span></details></> : "ranked by user score · pick your skin above to personalise"}</span></div>
          {rows.length === 0 && <p className="hv2-empty">Nothing matches that yet. Try another combination.</p>}
          <div className="hv2-box">
          <ol className={`hv2-list${picked ? " hv2-picked" : ""}`}>{rows.map((x, i) => {
            const r = x.r, pic = photo(r), c = ctx.counts.get(r.id)!, line = shortLine(r) ?? listLine(r);
            const fit = picked ? fitWord(x.pct) : null;
            const chips = [
              ...(i === 0 && picked && x.pct !== null && x.pct >= 75 ? [{ k: "best", t: "best match" }] : []),
              ...(!choice.type && r.shape ? [{ k: "shape", t: r.shape.toLowerCase() }] : []),
              ...(x.ff ? [{ k: "arm", t: "fragrance-free" }] : []),
            ];
            const shop = listShopLink(r);
            return <li key={r.id} className={i === 0 && picked ? "top" : undefined}><div className="hv2-row">
              <span className="hv2-rank">{i + 1}</span>
              <span className="hv2-pic">{pic ? <img src={pic} alt="" width={408} height={620} decoding="async" loading={i < 3 ? "eager" : "lazy"}/> : <span className="hv2-tile">{nameOf(r).split(" ").slice(0, 2).join(" ")}</span>}</span>
              <span className="hv2-body"><span className="hv2-nrow"><a className="hv2-name" href={`${productHref(r)}${pickQ}`}>{nameOf(r)}</a>{chips.map(ch => <span key={ch.k} className={`hv2-chip ${ch.k}`}>{ch.t}</span>)}</span>
                {line && <span className="hv2-line">{line}</span>}
                {shop && <a className="hv2-buy" href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a>}
                {fit && <span className={`hv2-fit ${x.pct! >= 75 ? "good" : x.pct! >= 55 ? "maybe" : "no"}`}><b>{fit}</b>{x.reason && <span>{x.reason}</span>}</span>}
                {picked && x.pct === null && x.m?.missing.length ? <span className="hv2-fit thin"><span>{`not enough reports yet from people with ${x.m.missing.join(" or ")}`}</span></span> : null}</span>
              <span className="hv2-sent"><span><strong>{c.n.toLocaleString("en-US")}</strong>{` ${c.n === 1 ? "review" : "reviews"}`}</span>
                {c.positive + c.mixed + c.negative > 0 && <span className="hv2-bar" aria-label={`${c.positive} positive, ${c.mixed} mixed, ${c.negative} negative`}><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>}</span>
              {picked ? <span className={`hv2-sc ${x.pct === null ? "none" : x.pct >= 80 ? "hi" : x.pct >= 60 ? "mid" : ""}`} title={MATCH_NOTE} aria-label={x.pct === null ? "No match % yet: not enough reports" : `${x.pct}% match. ${MATCH_NOTE}`}>
                  <b>{x.pct === null ? "—" : `${x.pct}%`}</b><small>{x.pct === null ? "too few reports" : "match"}</small></span>
                : <span className={`hv2-sc ${x.signal === null ? "none" : x.signal >= 85 ? "hi" : x.signal >= 75 ? "mid" : ""}`} title="User score: not a % of happy users. It blends how much people like it with how many have weighed in.">
                  <b>{x.signal ?? "—"}</b><small>user score</small></span>}
            </div></li>;
          })}</ol>
          <a className="hv2-more" href={choice.typeSlug ? skinHref({ ...choice, type: null, typeSlug: null }, `/${choice.typeSlug}`, "") : `${catalogPath}${pickQ}`}>{`see all ${choice.type ? typeLabel : `${data.listed.length} ${niche.words.many}`} →`}</a>
          </div>
        </section>

        <aside className="hv2-side">
          <section>
            <div className="hv2-sidehead"><h3>Fresh reviews</h3><a href="/reviews">all →</a></div>
            <ul className="hv2-feed">{fresh.map(f => { const r = byId.get(f.racketId)!; return <li key={f.id}><a href={productHref(r)}>
              <span className="hv2-src"><span className={`t ${f.tag}`}>{f.tag}</span>{ago(f.date, now)}</span>
              <b>{nameOf(r)}</b>
              <span className="hv2-q">{f.quote ? `“${clip(f.text)}”` : clip(f.text)}</span>
            </a></li>; })}</ul>
          </section>
          {best.length > 0 && <section>
            <h3>Best-of lists</h3>
            <ul className="hv2-best">{best.map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>{l.list.label.toLowerCase()}</a></li>)}</ul>
          </section>}
          <section className="hv2-own">
            <p className="t">Used one of these? Add your verdict.</p>
            <p>Two minutes, no account.</p>
            <a href="/add-review">+ add a review</a>
          </section>
        </aside>
      </div>
    </div>
    <V2Footer/>
  </main>;
}
