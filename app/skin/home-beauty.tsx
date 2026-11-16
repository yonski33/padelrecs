import "./skin-product.css";
import "./home-beauty.css";
import Link from "next/link";
import { skinContext } from "./context";
import { packOf } from "./payload";
import { SkinHomeMatch, type TextureLink } from "./home-match-skin";
import { MATCH_NOTE } from "./titles";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { displayName } from "../../lib/brand-name";
import { rankedLists, listHref } from "../rankings/lists";
import { platformName } from "../../lib/source-label";
import { niche, productHref } from "../../lib/niche";
import { newThisWeek } from "../../lib/new-this-week";
import { FEW_VOICES } from "../../lib/attr-score";
import { V2Footer } from "../v2-footer";
import { skinHref, type SkinChoice } from "../../lib/skin-choice";

/** The SkinRecs home in the owner's beauty design (Claude Design "SkinRecs home", 2026-11-16): quick match as one sentence
 *  ("My skin is … and I want to …"), an optional fine-tune, the ranked list with category pills, then textures, rankings, how
 *  we score and questions. Picks live in the URL; every number is from the catalog and lib/attr-score.ts. */
const DAY = 86_400_000;
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
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const total = data.reviews.length + data.external.length;
  const types = niche.typePages ?? [];
  const counts: Record<string, number> = { "": data.listed.length };
  for (const r of data.listed) if (r.shape) counts[r.shape] = (counts[r.shape] ?? 0) + 1;

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
  const textures = ([
    { name: "Light", line: "Gels and fluids that sink in fast. Often picked by oily and combination skin.", n: tex.light, tex: "light", cls: "light" },
    { name: "In between", line: "Lotions and soft creams. The everyday middle ground most skin types get on with.", n: tex.mid, tex: null, cls: "mid" },
    { name: "Rich", line: "Thicker creams with more cushion. Often picked by dry skin, or for winter.", n: tex.rich, tex: "rich", cls: "rich" },
    ...(balms && nBalm ? [{ name: "Balm", line: "Ointments and repair balms that seal everything in. For very dry or cracked patches.", n: nBalm, href: `/${balms.slug}`, cls: "balm" }] : []),
  ] satisfies TextureLink[] as TextureLink[]).filter(t => t.n > 0);

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

  return <main className={`bh ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bh-wrap">
      <section className="bh-hero">
        <div><h1>Less guessing.<br/><em>Better skincare.</em></h1>
          <p>{"Tell us about your skin. We'll handle the homework."}</p></div>
        <span className="bh-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews · ${newThisWeek(data, now).toLocaleString("en-US")} new this week`}</span>
      </section>

      {/* The picks, the list and the texture links work in the browser (app/skin/home-match-skin.tsx). */}
      <SkinHomeMatch pack={packOf(ctx)} choice={choice} counts={counts} textures={textures}>
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
      </SkinHomeMatch>

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
