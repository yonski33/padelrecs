import "./skin-product.css";
import "./home-beauty.css";
import Link from "next/link";
import { skinContext } from "./context";
import { rankSkin } from "./rank";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
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
import { FEW_VOICES } from "../../lib/attr-score";
import { V2Footer } from "../v2-footer";
import { SKIN_TYPES, GOALS, TEXTURES, BUDGETS, skinHref, skinPicked, skinQuery, type SkinChoice } from "../../lib/skin-choice";

/** The SkinRecs home in the owner's beauty design (Claude Design "SkinRecs home", 2026-11-16): quick match as one sentence
 *  ("My skin is … and I want to …"), an optional fine-tune, the ranked list with category pills, then textures, rankings, how
 *  we score and questions. Picks live in the URL; every number is from the catalog and lib/attr-score.ts. */
const LIST_SIZE = 8, DAY = 86_400_000;
const MATCH_NOTE = "How well it fits the skin and goal you picked, from what people with your skin type said. Not a quality score: the user score is separate.";
const GOAL_LABEL: Record<(typeof GOALS)[number], string> = { hydrate: "hydrate", calm: "calm", clear: "clear skin", daily: "just everyday" };
const CATS = ["moisturizers", "serums", "cleansers", "sunscreens", "toners", "treatments"];
const TINTS = ["oklch(0.9 0.06 20)", "oklch(0.93 0.05 155)", "oklch(0.94 0.045 45)", "oklch(0.92 0.14 98)"];
const clip = (t: string, n = 110) => t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`;
function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
const nowMs = () => Date.now();

export default async function HomeBeauty({ choice }: { choice: SkinChoice }) {
  const [ctx, lists] = await Promise.all([skinContext(), rankedLists()]);
  const { data } = ctx, now = nowMs();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brand(r.brandId));
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const picked = skinPicked(choice);
  const types = niche.typePages ?? [];
  const typeOf = (slug: string) => types.find(t => t.slug === slug);
  const rows = rankSkin(ctx, choice).slice(0, LIST_SIZE);
  const allOfType = choice.type ? data.listed.filter(r => r.shape === choice.type).length : data.listed.length;
  const pickQ = skinQuery({ ...choice, type: null, typeSlug: null }).size ? `?${skinQuery({ ...choice, type: null, typeSlug: null })}` : "";
  const catWord = choice.typeSlug ? typeOf(choice.typeSlug)!.label.toLowerCase() : "skincare";
  const pill = (label: string, next: SkinChoice, on: boolean, cls = "bp-pick") => <Link href={skinHref(next)} scroll={false} replace
    aria-current={on ? "true" : undefined} className={`${cls}${on ? " on" : ""}`}>{label}</Link>;
  const sens = choice.concerns.includes("sensitive");
  const nExtra = [choice.tex, choice.budget, choice.ff].filter(Boolean).length;
  const canRefine = !!(choice.skin && choice.goal) || nExtra > 0;

  // Fresh: our own reviews and YouTube, one per product (as before).
  const seen = new Set<string>();
  const fresh = [
    ...data.reviews.map(r => ({ id: r.id, racketId: r.racketId, date: r.createdAt, text: r.reviewText, quote: true, tag: niche.site.name.toLowerCase(), who: r.playerLevel ? `${r.playerLevel} skin` : null })),
    ...data.external.filter(e => e.sentiment && e.sourcePlatform === "YouTube" && e.summary).map(e => ({ id: e.id, racketId: e.racketId, date: e.sourceDate || e.createdAt, text: e.summary!, quote: false, tag: platformName(e.sourcePlatform).toLowerCase(), who: e.sourceName })),
  ].filter(x => byId.has(x.racketId)).sort((a, b) => b.date.localeCompare(a.date)).filter(x => !seen.has(x.racketId) && !!seen.add(x.racketId)).slice(0, 3);
  const best = lists.lists.filter(l => l.entries.length > 0).filter((l, i, a) => a.findIndex(x => x.list.slug === l.list.slug) === i);
  const channels = new Set(data.external.filter(e => e.sourcePlatform === "YouTube").map(e => e.sourceName)).size;

  // Textures, counted from what reviewers say (the texture score: 0 light … 100 rich), plus the balm aisle.
  const tex = { light: 0, mid: 0, rich: 0 };
  for (const r of data.listed) { const t = ctx.attrs.get(r.id)?.scores.texture; if (!t || t.n < 3) continue; tex[t.score < 35 ? "light" : t.score > 65 ? "rich" : "mid"]++; }
  const balms = types.find(t => t.shape === "Balm & ointment"), nBalm = balms ? data.listed.filter(r => r.shape === balms.shape).length : 0;
  const base = { ...choice, tex: null } as SkinChoice;
  const textures = [
    { name: "Light", line: "Gels and fluids that sink in fast. Often picked by oily and combination skin.", n: tex.light, href: skinHref({ ...base, tex: "light" }), cls: "light" },
    { name: "In between", line: "Lotions and soft creams. The everyday middle ground most skin types get on with.", n: tex.mid, href: skinHref(base), cls: "mid" },
    { name: "Rich", line: "Thicker creams with more cushion. Often picked by dry skin, or for winter.", n: tex.rich, href: skinHref({ ...base, tex: "rich" }), cls: "rich" },
    ...(balms && nBalm ? [{ name: "Balm", line: "Ointments and repair balms that seal everything in. For very dry or cracked patches.", n: nBalm, href: `/${balms.slug}`, cls: "balm" }] : []),
  ].filter(t => t.n > 0);

  // Questions, answered from our own numbers where we have them.
  const gentle = data.listed.filter(r => r.shape === "Moisturizer").map(r => ({ r, s: ctx.attrs.get(r.id)?.scores.suits_sensitive ?? ctx.attrs.get(r.id)?.scores.gentle }))
    .filter(x => x.s && x.s.n >= FEW_VOICES).sort((a, b) => b.s!.score - a.s!.score).slice(0, 2);
  const sensList = best.find(l => /sensitive/i.test(l.list.label));
  const faqs = [
    ...(gentle.length === 2 ? [{ q: "Best moisturizer for sensitive skin?", a: `People with sensitive skin rate ${nameOf(gentle[0].r)} and ${nameOf(gentle[1].r)} the gentlest so far. Fragrance-free and short ingredient lists come up again and again.`,
      link: sensList ? { href: listHref(sensList.list.slug), t: "See the sensitive-skin list →" } : { href: skinHref({ ...choice, concerns: ["sensitive"] }), t: "Rank for sensitive skin →" } }] : []),
    { q: "Light or rich texture?", a: "Lighter textures tend to suit oily and combination skin, richer ones dry skin. Each product page shows how reviewers describe its texture, and you can fine-tune the list above by texture.", link: { href: "#textures", t: "Textures →" } },
    { q: "What does the match % mean?", a: MATCH_NOTE, link: { href: "/how-we-make-these#match", t: "How we score →" } },
    { q: "Where do the reviews come from?", a: `Reviews left here, ${channels ? `${channels} YouTube channels, ` : ""}skincare blogs and forums. We count the verdicts by skin type and write one honest line per product.`, link: { href: "/how-we-make-these", t: "How we make these →" } },
    { q: "Is anything sponsored?", a: "No. Some “check price” links earn us a small commission, but they never change the order or the score.", link: { href: "/affiliate-disclosure", t: "Affiliate note →" } },
  ];

  const title = picked ? `Top ${catWord} for ${choice.skin ? `your ${choice.skin} skin` : "you"}` : `Top ${catWord} right now`;
  const subtitle = !picked ? "ranked by user score · pick above for your match %"
    : [choice.goal && choice.goal !== "daily" ? `ranked to ${GOAL_LABEL[choice.goal]}` : !choice.goal ? "pick a goal to sharpen this" : null, sens ? "gentle first" : null].filter(Boolean).join(" · ") || "ranked by your match";

  return <main className={`bh ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bh-wrap">
      <section className="bh-hero">
        <h1>Skincare, reviewed by <em>real skin</em></h1>
        <span className="bh-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${newThisWeek(data, now).toLocaleString("en-US")} new this week`}</span>
      </section>

      <section className="bh-qm" id="match" aria-label="Quick match">
        <span className="bh-qk"><span className="bp-tag sm">✦ quick match</span>My skin is</span>
        <span className="bp-picks" role="group" aria-label="Your skin type">{SKIN_TYPES.map(s => <span key={s}>{pill(s, { ...choice, skin: choice.skin === s ? null : s }, choice.skin === s)}</span>)}</span>
        <span className="bh-qk">and I want to</span>
        <span className="bp-picks" role="group" aria-label="What you want it to do">{GOALS.map(g => <span key={g}>{pill(GOAL_LABEL[g], { ...choice, goal: choice.goal === g ? null : g }, choice.goal === g)}</span>)}</span>
        <Link className="bp-sens" href={skinHref({ ...choice, concerns: sens ? choice.concerns.filter(k => k !== "sensitive") : [...choice.concerns, "sensitive"] })} scroll={false} replace aria-current={sens ? "true" : undefined}>
          <i aria-hidden="true">{sens ? "✓" : ""}</i>reacts easily</Link>
        {picked && <Link className="bh-reset" href={choice.typeSlug ? `/?type=${choice.typeSlug}#match` : "/#match"} scroll={false} replace>reset ↺</Link>}
        {canRefine && <details className="bh-more" open={nExtra > 0 || undefined}>
          <summary><span>Want it sharper?</span><b className={nExtra ? "on" : undefined}>{nExtra ? `fine-tune (${nExtra})` : "fine-tune"}<i aria-hidden="true"/></b>
            <small>{nExtra ? `match % includes ${nExtra} extra filter${nExtra > 1 ? "s" : ""}` : "texture, budget & fragrance · all optional"}</small></summary>
          <div className="bh-extras">
            <div><span>Texture</span><span className="bp-picks">{TEXTURES.map(t => <span key={t}>{pill(t, { ...choice, tex: choice.tex === t ? null : t }, choice.tex === t, "bp-pick sm")}</span>)}</span></div>
            <div><span>Budget</span><span className="bp-picks">{BUDGETS.map(b => <span key={b}>{pill(b, { ...choice, budget: choice.budget === b ? null : b }, choice.budget === b, "bp-pick sm")}</span>)}</span></div>
            <div><span>Fragrance</span><span className="bp-picks"><span>{pill("fragrance-free only", { ...choice, ff: !choice.ff }, choice.ff, "bp-pick sm")}</span></span></div>
          </div>
        </details>}
      </section>

      <div className="bh-grid">
        <section className="bh-main" aria-live="polite">
          <div className="bh-lhead"><h2>{title}</h2><span>{subtitle}</span></div>
          <div className="bp-picks bh-cats" role="group" aria-label="Product type">
            <span>{pill("everything", { ...choice, type: null, typeSlug: null }, !choice.type)}</span>
            {CATS.map(typeOf).filter(t => !!t).map(t => <span key={t.slug}>{pill(t.label.toLowerCase(), { ...choice, type: t.shape, typeSlug: t.slug }, choice.typeSlug === t.slug)}</span>)}
          </div>
          <div className="bh-box">
            {rows.length === 0 && <p className="bh-empty">Nothing matches that yet. Try fewer filters.</p>}
            <ol className="bh-list">{rows.map((x, i) => {
              const r = x.r, pic = photo(r), c = ctx.counts.get(r.id)!, line = shortLine(r) ?? listLine(r), shop = listShopLink(r);
              const top = i === 0 && picked && x.pct !== null && x.pct >= 75;
              const texture = ctx.attrs.get(r.id)?.scores.texture;
              const chips = [
                ...(top ? [{ k: "best", t: "best match" }] : []),
                ...(!choice.type && r.shape ? [{ k: "", t: r.shape.toLowerCase() }] : texture && texture.n >= 3 ? [{ k: "", t: texture.score < 35 ? "light" : texture.score > 65 ? "rich" : "in between" }] : []),
                ...(sens && x.ff ? [{ k: "gentle", t: "fragrance-free" }] : []),
              ];
              const pctCls = !picked || x.pct === null ? "none" : x.pct >= 80 ? "hi" : x.pct >= 60 ? "mid" : "";
              return <li key={r.id} className={top ? "top" : undefined}>
                <span className="bh-rank">{i + 1}</span>
                <span className="bh-pic">{pic && <img src={pic} alt="" width={112} height={140} decoding="async" loading={i < 3 ? "eager" : "lazy"}/>}</span>
                <span className="bh-body">
                  <span className="bh-brand">{brand(r.brandId)}</span>
                  <span className="bh-nrow"><a className="bh-name" href={`${productHref(r)}${pickQ}`}>{nameOf(r).replace(new RegExp(`^${(brand(r.brandId) ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "")}</a>
                    {chips.map(ch => <span key={ch.t} className={`bh-chip ${ch.k}`}>{ch.t}</span>)}</span>
                  {line && <span className="bh-line">{line}</span>}
                  {picked && x.pct === null && x.m?.missing.length ? <span className="bh-thin">{`not enough reports yet from people with ${x.m.missing.join(" or ")}`}</span> : null}
                </span>
                <span className="bh-sent"><span>{`${c.n.toLocaleString("en-US")} ${c.n === 1 ? "review" : "reviews"}`}</span>
                  {c.positive + c.mixed + c.negative > 0 && <span className="bp-mood" aria-label={`${c.positive} positive, ${c.mixed} mixed, ${c.negative} negative`}><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>}</span>
                {shop ? <a className="bh-buy" href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a> : <span/>}
                <span className={`bh-pct ${pctCls}`} title={MATCH_NOTE}><b>{picked && x.pct !== null ? `${x.pct}%` : "—"}</b><small>{picked && x.pct === null ? "too few reports" : "match"}</small></span>
              </li>;
            })}</ol>
            <a className="bh-all" href={choice.typeSlug ? `/${choice.typeSlug}${pickQ}` : `${catalogPath}${pickQ}`}>{`see all ${allOfType} ${catWord === "skincare" ? niche.words.many : catWord} →`}</a>
          </div>
        </section>

        <aside className="bh-side">
          <section>
            <div className="bh-sidehead"><h3>Fresh reviews</h3><a href="/reviews">all →</a></div>
            <ul className="bh-feed">{fresh.map(f => { const r = byId.get(f.racketId)!; return <li key={f.id}><a href={productHref(r)}>
              <span className="bh-src"><span className={`t ${f.tag}`}>{f.tag}</span>{[ago(f.date, now), f.who].filter(Boolean).join(" · ")}</span>
              <b>{nameOf(r)}</b>
              <span className="bh-q">{f.quote ? `“${clip(f.text)}”` : clip(f.text)}</span>
            </a></li>; })}</ul>
          </section>
          {best.length > 0 && <section>
            <h3>Best-of lists</h3>
            <ul className="bh-best">{best.slice(0, 8).map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>{l.list.label.replace(/^best\s+/i, "").toLowerCase()}</a></li>)}</ul>
          </section>}
          <section className="bh-own">
            <p className="t">Used something? Tell us how your skin took it.</p>
            <p>Two minutes, no account.</p>
            <a className="bp-btn" href="/add-review">+ add a review</a>
          </section>
        </aside>
      </div>

      {textures.length > 1 && <section className="bh-sec" id="textures">
        <h2>Which texture suits you?</h2>
        <div className="bh-tex">{textures.map(t => <a key={t.name} href={t.href}>
          <span className={`bh-drop ${t.cls}`} aria-hidden="true"><i/></span>
          <span><b>{t.name}</b><span>{t.line}</span><small>{`see ${t.n} →`}</small></span>
        </a>)}</div>
        <a className="bh-guide" href="/guide">Ingredients, actives &amp; layering explained → skin guide</a>
      </section>}

      {best.length > 0 && <section className="bh-sec">
        <div className="bh-lhead"><h2>Explore the rankings</h2><Link href="/rankings">all rankings →</Link></div>
        <div className="bh-tiles">{best.slice(0, 6).map((l, i) => <a key={l.list.slug} href={listHref(l.list.slug)}>
          <span><b>{l.list.label}<span> →</span></b><small>{`${l.entries.length} products`}</small></span>
          <span className="bh-bars" aria-hidden="true"><i/><i/><i style={{ background: TINTS[i % TINTS.length] }}/></span>
        </a>)}</div>
      </section>}

      <section className="bh-how">
        <span className="bp-tag sm">how we score</span>
        {[`${total.toLocaleString("en-US")} reviews${channels ? ` + ${channels} YouTube channels` : ""} + forums`, "we count every verdict, by skin type", "one honest line"].map((t, i) =>
          <span key={t} className="bh-step"><i>{i + 1}</i>{t}</span>)}
        <b>No sponsored picks.</b>
        <a href="/how-we-make-these">how it works →</a>
      </section>

      <section className="bh-sec bh-faq">
        <h2>Questions</h2>
        <div className="bp-card">{faqs.map(f => <details key={f.q}><summary><span>{f.q}</span><i aria-hidden="true"/></summary>
          <p>{`${f.a} `}<a href={f.link.href}>{f.link.t}</a></p></details>)}</div>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
