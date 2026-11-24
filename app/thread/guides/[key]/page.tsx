// Thread guides (Racket, Beginner tips, Shape, Side, Elbow): title, TL;DR, numbered steps, the racket picks from the live
// rankings, and the sidebar with On this page and More guides. proxy.ts serves /guide and /guides/<x>.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows, hasDb, skinOf, audioOf } from "../../data";
import { threadRankings } from "../../rankings-data";
import { homePayload } from "../../../home-payload";
import { rankHome } from "../../../../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../../../../lib/rank-seed";
import { GUIDES, GUIDE_LINK_LABELS, GUIDE_UI } from "../../../../lib/thread/copy";
import { GUIDE_KEYS, GUIDE_PATHS, ELBOW_SLUG, guideListPicks, type GuideKey } from "../../../../lib/thread/look";
import { Row, SideBox, LinkList, NarrowLinks, type ThreadRow } from "../../ui";
import { th } from "../../../../lib/thread/look";
import { Comments } from "../../live/comments";
import { generateMetadata as liveGuideMetadata } from "../../../guide/page";
import { JsonLd, crumbs, liveOr } from "../../seo";
import type { QuickChoice } from "../../../../lib/quick-match";
import { niche } from "../../../../lib/niche";
import { GuideV3 } from "../../guide-v3";

export const revalidate = 21600;
export const dynamicParams = false;
export function generateStaticParams() { return GUIDE_KEYS.map(key => ({ key })); }
type P = { params: Promise<{ key: string }> };
const PICKLEBALL = niche.id === "pickleball";
const SKIN = niche.id === "skin", DG = niche.id === "discgolf", AUDIO = niche.id === "audio", SR = niche.id === "simracing", TN = niche.id === "tennis", LT = niche.id === "laptop";
const SHAPES = PICKLEBALL ? ["standard", "hybrid", "elongated"] : ["round", "teardrop", "diamond"];
const BEST = LT ? "best-laptops" : SKIN ? "best-face-moisturizers" : DG ? "best-disc-golf-discs" : AUDIO ? "best-headphones" : SR ? "best-sim-racing-gear" : `best-${niche.id}-${niche.words.many}`; // "best-padel-rackets", "best-pickleball-paddles"
const GUIDE_NAME = `${niche.words.One} guide`;
const guideOf = (key: string) => GUIDES.find(g => g.key === key);

// The racket guide keeps the live /guide metadata (app/guide/page.tsx); the four new guides have their own, canonical to their address.
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const g = guideOf((await params).key);
  if (!g) return {};
  if (g.key === "racket") return liveOr(liveGuideMetadata);
  const url = GUIDE_PATHS[g.key];
  return { title: { absolute: `${g.seoTitle} | ${niche.site.name}` }, description: g.description, alternates: { canonical: url }, openGraph: { title: g.seoTitle, description: g.description, url, type: "article" } };
}

/** Which rackets each guide lists: one per shape, or a ranking's top, or each side's (control for the right, power for the left). */
async function picksFor(key: GuideKey): Promise<{ title?: string; rows: ThreadRow[] }[]> {
  if (niche.id === "skin") return skinPicksFor(key);
  if (AUDIO) return audioPicksFor(key);
  const [{ all, rows }, lists] = await Promise.all([threadRows(), threadRankings()]);
  // PickleballRecs: a paddle stored with several shapes ("Hybrid, Widebody, or Elongated") counts for each, as in the
  // catalogue, but shows once, current models only. Padel keeps its rule.
  const isShape = (r: ThreadRow, shape: string) => PICKLEBALL ? !!r.shape && new RegExp(`\\b${shape}\\b`, "i").test(r.shape) : r.shape?.toLowerCase() === shape;
  if (SR) {
    // SimRacingRecs: each gear type's live ranking by exact slug, and the best scored wheelbase of each drive type.
    const top = (slug: string, n: number) => (lists.find(l => l.slug === slug)?.ids ?? []).slice(0, n).map(id => rows.get(id)).filter((x): x is ThreadRow => !!x);
    if (key === "racket") return [{ rows: ["best-sim-racing-wheelbases", "best-sim-racing-pedals", "best-sim-racing-cockpits", "best-sim-racing-wheels"].flatMap(s => top(s, 1)) }];
    if (key === "shape") return [{ rows: (["direct", "belt", "gear"] as const).flatMap(d => all.filter(r => r.shape === "Wheelbase" && r.current !== false && r.score != null && r.n >= 10
      && new RegExp(`\\b${d}`, "i").test(r.drive ?? "")).sort((a, b) => b.score! - a.score!).slice(0, 1)) }];
    if (key === "side") return [{ rows: top("best-sim-racing-pedals", 4) }];
    if (key === "elbow") return [{ rows: top("best-sim-racing-cockpits", 4) }];
  }
  if (DG) {
    // DiscGolfRecs: each disc type's live ranking by exact slug (the choose and types guides), and the home's quick match for
    // the throws and a slower arm, as the Thread-only rankings rank them (app/thread/rankings-data.ts).
    const top = (slug: string, n: number) => (lists.find(l => l.slug === slug)?.ids ?? []).slice(0, n).map(id => rows.get(id)).filter((x): x is ThreadRow => !!x);
    const types = ["best-disc-golf-putters", "best-disc-golf-midrange-discs", "best-disc-golf-fairway-drivers", "best-disc-golf-distance-drivers"];
    if (key === "racket" || key === "shape") return [{ rows: types.flatMap(s => top(s, 1)) }];
    const match = async (c: QuickChoice, n: number) => !hasDb() ? [] : (await homePayload().then(p => rankHome(p.items, RANK_SETUP, NEGATIVE_TAGS, c, false, n).rows))
      .map(x => rows.get(x.id)).filter((x): x is ThreadRow => !!x);
    if (key === "side") return [{ title: "Backhand", rows: top(BEST, 2) }, { title: "Forehand", rows: await match({ style: "power", arm: false }, 2) }];
    if (key === "elbow") return [{ rows: top("best-disc-golf-discs-for-slow-arms", 4) }];
  }
  if (LT) {
    // LaptopRecs: its live lists by exact slug (one favourite per category for the choose and types guides).
    const top = (slug: string, n: number) => (lists.find(l => l.slug === slug)?.ids ?? []).slice(0, n).map(id => rows.get(id)).filter((x): x is ThreadRow => !!x);
    const cats = ["best-ultrabooks", "best-gaming-laptops", "best-business-laptops", "best-macbooks"];
    if (key === "racket" || key === "shape") return [{ rows: cats.flatMap(s => top(s, 1)) }];
    if (key === "side") return [{ title: "Mac", rows: top("best-macbooks", 2) }, { title: "Windows", rows: top("best-ultrabooks", 2) }, { title: "Chromebook", rows: top("best-chromebooks", 2) }];
    if (key === "elbow") return [{ rows: top("best-battery-life-laptops", 4) }];
    return [{ rows: top(BEST, 4) }];
  }
  if (TN) {
    // TennisRecs: its live lists by exact slug, and the best of each head size band (its shape column) for the head size guide.
    const top = (slug: string, n: number) => (lists.find(l => l.slug === slug)?.ids ?? []).slice(0, n).map(id => rows.get(id)).filter((x): x is ThreadRow => !!x);
    const band = (r: ThreadRow) => { const n = Number(r.shape?.match(/(\d{2,3})\s*sq/)?.[1] ?? NaN); return !Number.isFinite(n) ? null : n >= 104 ? "big" : n >= 100 ? "mid" : "small"; };
    if (key === "racket") return [{ rows: ["best-power-tennis-rackets", "best-control-tennis-rackets", "best-spin-tennis-rackets", "best-arm-friendly-tennis-rackets"].flatMap(x => top(x, 1)) }];
    if (key === "shape") return [{ rows: (["small", "mid", "big"] as const).flatMap(b => all.filter(r => r.score != null && r.n >= 10 && r.current !== false && band(r) === b).sort((x, y) => y.score! - x.score!).slice(0, 2)) }];
    if (key === "side") return [{ title: "Spin first", rows: top("best-spin-tennis-rackets", 2) }, { title: "Control first", rows: top("best-control-tennis-rackets", 2) }];
    if (key === "elbow") return [{ rows: top("best-arm-friendly-tennis-rackets", 4) }];
  }
  const seen = new Set<string>();
  const bestOfShape = (shape: string, n: number) => all.filter(r => r.score != null && r.n >= 10 && isShape(r, shape) && (!PICKLEBALL || (r.current !== false && !seen.has(r.id))))
    .sort((a, b) => b.score! - a.score!).slice(0, n).map(r => (seen.add(r.id), r));
  if (key === "racket") return [{ rows: SHAPES.flatMap(s => bestOfShape(s, 1)) }];
  if (key === "shape") return [{ rows: SHAPES.flatMap(s => bestOfShape(s, 2)) }];
  // The beginners' ranking may be hidden (under 10 qualify): the engine's beginner picks directly, as the home ranks them.
  if (key === "beginner") return [{ rows: !hasDb() ? [] : (await homePayload().then(p => rankHome(p.items, RANK_SETUP, NEGATIVE_TAGS, { style: "any", level: "beginner", arm: false }, false, 4).rows)).map(x => rows.get(x.id)).filter((x): x is ThreadRow => !!x) }];
  if (PICKLEBALL) {
    // By exact slug, as guideListPicks does. No doubles or singles split until Game type votes exist (owner 2026-11-19).
    const top = (slug: string, n: number) => (lists.find(l => l.slug === slug)?.ids ?? []).slice(0, n).map(id => rows.get(id)).filter((x): x is ThreadRow => !!x);
    if (key === "elbow") return [{ rows: top(`${BEST}-for-tennis-elbow`, 4) }];
    return [{ rows: top(BEST, 4) }];
  }
  return guideListPicks(key, slug => lists.find(l => l.slug === slug)?.ids, id => rows.get(id)) ?? [];
}

export default async function ThreadGuide({ params }: P) {
  const { key } = await params;
  const g = guideOf(key);
  if (!g) notFound();
  const picks = await picksFor(g.key);
  const others = GUIDE_KEYS.filter(k => k !== g.key).map(k => ({ label: GUIDE_LINK_LABELS[k], href: GUIDE_PATHS[k] }));
  // "Full ranking" goes to a list that is on show (a Thread-only list can be hidden while it has under 10 rackets).
  const shown = new Set((await threadRankings()).map(l => l.slug));
  const wanted = SKIN ? (g.key === "beginner" || g.key === "elbow" ? "best-skincare-for-sensitive-skin" : BEST)
    : DG ? (g.key === "beginner" ? `${BEST}-for-beginners` : g.key === "elbow" ? `${BEST}-for-slow-arms` : BEST)
    : SR ? (g.key === "beginner" ? `${BEST}-for-beginners` : g.key === "side" ? "best-sim-racing-pedals" : g.key === "elbow" ? "best-sim-racing-cockpits"
      : g.key === "shape" ? "best-sim-racing-wheelbases" : BEST)
    : TN ? (g.key === "beginner" ? `${BEST}-for-beginners` : g.key === "elbow" ? "best-arm-friendly-tennis-rackets" : g.key === "side" ? "best-spin-tennis-rackets" : BEST)
    : LT ? (g.key === "elbow" ? "best-battery-life-laptops" : g.key === "side" ? "best-macbooks" : BEST)
    : AUDIO ? (g.key === "shape" ? "best-open-back-headphones" : g.key === "elbow" ? "best-noise-cancelling-headphones" : "best-headphones-overall")
    : g.key === "beginner" ? `${BEST}-for-beginners` : g.key === "elbow" ? (PICKLEBALL ? `${BEST}-for-tennis-elbow` : ELBOW_SLUG) : BEST;
  const fullRanking = `/rankings/${shown.has(wanted) ? wanted : BEST}`;
  const lime = Number((g.extra as { highlightFirstSteps?: number } | undefined)?.highlightFirstSteps ?? g.steps.length);
  const picksTitle = g.picksTitle.replace(/\bvote for\b/, "rate highest");
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: "Home", path: "/" }, ...(g.key === "racket" ? [] : [{ name: GUIDE_NAME, path: GUIDE_PATHS.racket }]), { name: g.key === "racket" ? GUIDE_NAME : g.title, path: GUIDE_PATHS[g.key] }])] };
  // PadelRecs Guide v3 (owner design 2026-11-21): the same copy, picks and comments in the v3 layout; no score on the rows.
  // TennisRecs too (v3 wave 2); its elbow list is "arm-friendly".
  if (niche.id === "padel" || TN) {
    const lists = await threadRankings();
    const want = [/beginners/i, /control/i, /power/i, TN ? /arm-friendly|tennis elbow/i : /tennis elbow/i];
    const related = want.map(rx => lists.find(l => rx.test(l.label))).filter((l): l is NonNullable<typeof l> => !!l).map(l => ({ label: l.label, href: l.href }));
    return <Shell active="guides"><JsonLd data={ld}/>
      <GuideV3 g={g} picks={picks} picksTitle={picksTitle} fullRanking={fullRanking} related={related}
        crumbs={<div className="th-crumbs"><a href={th("/guides")}>{GUIDE_UI.crumbRoot}</a><span>/</span><span>{g.title}</span></div>}/>
    </Shell>;
  }
  return <Shell active="guides">
    <JsonLd data={ld}/>
    <main className="th-main">
      <div className="th-col">
        <div className="th-crumbs"><a href={th(GUIDE_PATHS.racket)}>{GUIDE_UI.crumbRoot}</a><span>/</span><span>{g.crumb}</span></div>
        <article className="th-card th-hero">
          <h1 className="th-h1">{g.title}</h1>
          <div className="th-tldr"><div className="th-tldr-h">{GUIDE_UI.tldrLabel}</div>
            {g.tldrLead && <p>{g.tldrLead}</p>}
            {g.tldr.length > 0 && <ul>{g.tldr.map(t => <li key={t}><span className="th-sdot pos"/><span>{t}</span></li>)}</ul>}
          </div>
        </article>
        <section className="th-card th-steps">
          <h2 className="th-h2" style={{ padding: "0 0 6px" }}>{g.stepsTitle}</h2>
          {g.steps.map((s, i) => <div key={s.title} id={`tip-${i + 1}`} className="th-step">
            <span className="th-num" style={i < lime ? undefined : { background: "#fff" }}>{i + 1}</span>
            <div><h3>{s.title}</h3><p>{s.body}</p></div>
          </div>)}
        </section>
        {picks.some(p => p.rows.length) && <section className="th-card th-list">
          <div className="th-head-row" style={{ marginBottom: 6 }}><h2 className="th-h2">{picksTitle}</h2><a className="th-link-b" href={th(fullRanking)}>{GUIDE_UI.fullRanking}</a></div>
          {picks.map((p, i) => p.rows.length > 0 && <div key={i}>{p.title && <h3 className="th-sub-h">{p.title}</h3>}{p.rows.map(r => <Row key={r.id} r={r}/>)}</div>)}
        </section>}
        <Comments page={`guide:${g.key}`} title={g.commentsTitle} prompt={g.composerPrompt} placeholder={g.composerPlaceholder} nicknames={niche.form.quickVote?.nicknames ?? []}/>
        <NarrowLinks title={GUIDE_UI.moreGuides} links={others}/>
      </div>
      <aside className="th-side">
        {g.onThisPage.length > 0 && <section className="th-card th-sbox"><div className="th-sbox-head">{GUIDE_UI.onThisPage}</div><div className="th-sbox-body">
          {g.onThisPage.map((t, i) => <a key={t} className="th-slink" href={`#tip-${i + 1}`}><span>{`${i + 1}. ${t}`}</span><span aria-hidden="true">↓</span></a>)}
        </div></section>}
        <SideBox title={GUIDE_UI.moreGuides}><LinkList links={others}/></SideBox>
      </aside>
    </main>
  </Shell>;
}

/** SkinRecs' guide picks: the best-scored current product of each type the guide is about, or a list's top (the sensitive
 *  skin ranking), or the skin engine's own match for a texture (app/skin/rank.ts rankSkin). */
async function skinPicksFor(key: GuideKey): Promise<{ title?: string; rows: ThreadRow[] }[]> {
  const [{ all, ctx }, lists] = await Promise.all([threadRows(), threadRankings()]);
  const ok = (r: ThreadRow) => r.score != null && r.current !== false && r.n >= 10;
  const bestOf = (shape: string, n = 1) => all.filter(r => ok(r) && r.shape === shape).sort((a, b) => b.score! - a.score! || b.n - a.n).slice(0, n);
  const list = (slug: string, n: number) => (lists.find(l => l.slug === slug)?.ids ?? []).slice(0, n).flatMap(id => all.find(r => r.id === id) ?? []);
  // Morning (protection) and night (repair), the routine guide's two lists.
  if (key === "side") return [{ title: "Morning", rows: bestOf("Sunscreen", 2) }, { title: "Night", rows: bestOf("Treatment", 2) }];
  if (key === "beginner" || key === "elbow") return [{ rows: list("best-skincare-for-sensitive-skin", 4) }];
  // The skin engine's own moisturizer picks (app/skin/rank.ts rankSkin): per skin type (choosing), or per texture.
  const sk = skinOf(ctx);
  if (!sk) return [];
  const [{ rankSkin }, { readSkinChoice }] = await Promise.all([import("../../../skin/rank"), import("../../../../lib/skin-choice")]);
  const byId = new Map(all.map(r => [r.id, r]));
  const pick = (q: Record<string, string>, n: number) => rankSkin(sk, readSkinChoice({ ...q, type: "moisturizers" }, niche.typePages ?? [])).filter(x => x.pct !== null)
    .flatMap(x => { const r = byId.get(x.r.id); return r && ok(r) ? [r] : []; }).slice(0, n);
  if (key === "racket") return [{ title: "Dry skin", rows: pick({ skin: "dry" }, 1) }, { title: "Oily skin", rows: pick({ skin: "oily" }, 1) }, { title: "Combination skin", rows: pick({ skin: "combination" }, 1) }];
  return [{ title: "Light", rows: pick({ tex: "light" }, 2) }, { title: "Rich", rows: pick({ tex: "rich" }, 2) }];
}

/** AudioRecs' guide picks (its guide mocks): the best listener score of each kind (choose, open or closed-back, earbuds or
 *  over-ear), the pairs listeners rank highest for value (listening tips: no beginner data exists), and the top of the live
 *  noise cancelling ranking. Current models with 10+ reviews. */
async function audioPicksFor(key: GuideKey): Promise<{ title?: string; rows: ThreadRow[] }[]> {
  const [{ all, rows, ctx }, lists] = await Promise.all([threadRows(), threadRankings()]);
  const au = audioOf(ctx);
  const ok = all.filter(r => r.score != null && r.current && r.n >= 10).sort((a, b) => b.score! - a.score! || b.n - a.n);
  const kind = (k: string, n: number) => ok.filter(r => r.audio?.kind === k).slice(0, n);
  if (key === "racket") return [{ rows: [...kind("Over-ear", 1), ...kind("Open-back", 1), ...kind("Earbuds", 1)] }];
  if (key === "shape") return [{ rows: [...kind("Open-back", 2), ...kind("Over-ear", 1)] }];
  if (key === "side") return [{ title: "For long sessions", rows: kind("Over-ear", 1) }, { title: "For pockets and the gym", rows: kind("Earbuds", 2) }];
  if (key === "elbow") return [{ rows: (lists.find(l => l.slug === "best-noise-cancelling-headphones")?.ids ?? []).slice(0, 3).map(id => rows.get(id)).filter((x): x is ThreadRow => !!x) }];
  // Value: the attribute score from "great value" and "overpriced" tags (lib/audio-profile.ts), the top 40% (65+) only,
  // best listener score first.
  const value = (r: ThreadRow) => au?.wire.get(r.id)?.s.value?.[0] ?? 0;
  return [{ rows: ok.filter(r => value(r) >= 65).slice(0, 3) }]; // ok is by listener score
}
