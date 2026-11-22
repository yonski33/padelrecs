// Thread racket page (Metalbone CTRL Thread v7). proxy.ts serves it for /rackets/<slug>. One quiet buy link with
// a commission note (owner 2026-11-19), the live Player score, the poll, how it plays, similar rackets, the reviews and the line.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { racketData } from "../../racket-data";
import { playersWord } from "../../../../lib/thread/web-sources";
import { AudioFitCard } from "../../live/audio-match";
import { audioGroupsFor } from "../../../../lib/thread/traits";
import { AUDIO_PILL_LABELS, SIMRACING_PILL_WORDS, SIMRACING_PILL_LABELS, TENNIS_PILL_WORDS, TENNIS_PILL_LABELS, PICKLEBALL_PILL_WORDS, PICKLEBALL_PILL_LABELS, DISCGOLF_PILL_LABELS } from "../../../../lib/thread/vote-pill";
import { FitCard } from "../../live/racket-v7b";
import type { AudioWire } from "../../../../lib/audio-match";
import { threadRows, hasDb, skinOf, audioOf } from "../../data";
import { Badge, SBar, Photo, cap, plural, tone, type ThreadRow } from "../../ui";
import { FitCheck, Poll, Reviews } from "../../live/racket";
import { TraitVotes } from "../../live/trait-votes";
import { traitSeed } from "../../../../lib/thread/trait-seed";
import { racketStories } from "../../stories-data";
import { MemberMark } from "../../live/member-mark";
import { traitGroupsForType } from "../../../../lib/thread/traits";
import { oneShape } from "../../../../lib/thread/shape";
import { Comments } from "../../live/comments";
import { th } from "../../../../lib/thread/look";
import { amazonButton } from "../../../../lib/amazon-offer";
import { amazonPhoto } from "../../../../lib/amazon-photos";
import { websiteButton } from "../../../../lib/product-links";
import { withoutYear, shortModel } from "../../../../lib/brand-name";
import { niche, hasYears } from "../../../../lib/niche";
import { tennisYearKnown, tennisReplacedBy, tennisStyle } from "../../../../lib/thread/tennis-notes";
import { v3Site } from "../../../../lib/thread/sites";
import { alsoLoved } from "../../../../db/product-votes";
import { database } from "../../../../db/data";
import { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { JsonLd, crumbs } from "../../seo";
import { catalogLabel, catalogPath, productHref } from "../../../../lib/niche";
import { SkinFitCheck } from "../../live/skin-match";
import { W } from "../../../../lib/thread/words";
import { Flight } from "../../ui";
import { flightOf } from "../../../../lib/discgolf-profile";
import { stabilityOfFlight } from "../../../../lib/niche/discgolf-guide";
import { SITE_FIT } from "../../../../lib/fit-config";
import { levelRange } from "../../../../lib/fit-verdict";
import specNotes from "../../../../db/shop/spec-notes.json";
import { RacketV7b } from "../../racket-v7b";
import { writtenTldr } from "../../../../lib/thread/written-tldr";
import { pageContent, marked } from "../../../../lib/racket-page";
import { summary } from "../../../../lib/product-summary";
import { tagSays, tagTone } from "../../../../lib/tags";
import { votePill } from "../../../../lib/thread/vote-pill";
import { TRAIT_GROUPS } from "../../../../lib/thread/traits";
import { traitCounts, traitGroup } from "../../data";
import { whoPlays, weekLine } from "../../../../lib/thread/community";
import { pickSimilar } from "../../../../lib/thread/similar-pick";
import { communityFor } from "../../community-data";
import { comparePairs } from "../../../../lib/compare-pairs";

export const revalidate = 86400;
// Every listed racket's page is built with the site, as the live racket pages are (app/v/racket); none without a database (CI).
export async function generateStaticParams() {
  if (!hasDb()) return [];
  return (await threadRows()).all.map(r => ({ slug: r.slug }));
}

type P = { params: Promise<{ slug: string }> };
// The live racket page's title, description, canonical and share image (app/rackets/[slug]/page.tsx).
export const generateMetadata = ({ params }: P): Promise<Metadata> => liveMetadata({ params, searchParams: Promise.resolve({}) });

const SKIN = niche.id === "skin", DG = niche.id === "discgolf", AUDIO = niche.id === "audio", SR = niche.id === "simracing", TN = niche.id === "tennis", PB = niche.id === "pickleball";
/** The v3 sites show no score (owner 2026-11-22 sweep): an AudioRecs product with no audio-match data still gets this page, so
 *  its score badges hide here too. */
const V3 = v3Site(niche.id);
/** AudioRecs' TL;DR words for its quick tags ("Listeners often praise the noise cancelling."). */
const AUDIO_SAYS: Record<string, string> = { "great noise cancelling": "praise the noise cancelling", comfortable: "find them comfortable",
  detailed: "call the sound detailed", "great bass": "praise the bass", "great value": "call them good value", "long battery life": "praise the battery life",
  "wide soundstage": "praise the wide soundstage", "great mic": "praise the mic", "build quality issues": "report build problems",
  uncomfortable: "find them uncomfortable", overpriced: "find them overpriced", "harsh treble": "find the treble harsh",
  "connection issues": "report connection drops", muddy: "find the sound muddy" };
/** AudioRecs' sound tag: where 3+ listeners put the tuning (warm … bright). */
const tuningWord = (t: [number, number] | undefined) => !t || t[1] < 3 ? null : t[0] <= 38 ? "Warm sound" : t[0] >= 62 ? "Bright sound" : "Balanced sound";
/** SkinRecs' SPF spec row: the SPF the product's name gives ("SPF 50+" → "50+"); no PA rating is stored anywhere yet. */
const SPF_OF = (name: string) => name.match(/\bSPF\s*(\d{2,3}\+?)/i)?.[1] ?? null;
// The level words: the same formatter as the catalogue card (lib/fit-verdict.ts levelRange), capitalised.
const LEVEL_WORD = (ls: string[]) => { const w = levelRange(ls); return w ? cap(w) : null; };
const STYLE_WORD = { control: "Control", power: "Power", balance: "All-round" } as const;
/** The breadcrumb's play-style link (owner mock 2026-11-19b): its ranking; all-round has none, so the overall one. */
const LIST = `${niche.id}-${niche.words.many}`; // "padel-rackets", "pickleball-paddles": the site's ranking slugs
const STYLE_HREF = { control: `/rankings/best-control-${LIST}`, power: `/rankings/best-power-${LIST}`, balance: `/rankings/best-${LIST}` } as const;
const Mini = ({ x, small }: { x: ThreadRow; small?: boolean }) => <a className={`th-mini${small ? " sm" : ""}`} href={th(x.href)}>
  <span>{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</span>
  <span><strong>{x.name}</strong>{(x.line || x.best) && <small>{x.line ?? `Best for ${x.best}`}</small>}</span>
  {!V3 && <Badge n={x.score} size="sm"/>}
</a>;

async function lovedToo(id: string, rows: Map<string, ThreadRow>) {
  if (!hasDb()) return [];
  try { return (await alsoLoved(await database(), [id], [], "", 4)).flatMap(p => rows.get(p.racketId) ?? []); }
  catch (error) { console.error("[thread] also loved failed", error); return []; }
}

/** DiscGolfRecs' plastic chips over the reviews: the plastics its reviews name, most reviewed first, once 2 or more are named. */
const plastics = (cards: { version?: string | null }[]) => {
  const n = new Map<string, number>();
  for (const c of cards) if (c.version) n.set(c.version, (n.get(c.version) ?? 0) + 1);
  const out = [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
  return out.length >= 2 ? out : undefined;
};

export default async function ThreadRacket({ params }: P) {
  const d = await racketData((await params).slug);
  if (!d) notFound();
  const { r, row, brand, cards, lead, bullets, traits, style: engineStyle, sim, simSpecs, simSelf, line, latest, judged } = d;
  // TennisRecs: the audit's style fixes (votes and the maker agree, owner OK 2026-11-22) win over the engine's axis.
  const style = (TN ? tennisStyle(r.slug) : null) ?? engineStyle;
  // TennisRecs: an older generation its maker has replaced is tagged first, like sim racing's discontinued gear.
  const replaced = TN ? tennisReplacedBy(r.slug) : null;
  const [{ rows, ctx }, tales] = await Promise.all([threadRows(), racketStories(r.id)]);
  // SkinRecs: its own tags, "People say" and fit check from the skin engine (app/thread/live/skin-match.tsx); the fit check
  // gets the ranking inputs of this product's type only.
  const sk = SKIN ? skinOf(ctx) : null;
  const skinSame = sk ? sk.data.listed.filter(x => x.shape === r.shape && (x.id === r.id || rows.get(x.id)?.current)) : [];
  const skinWire = sk ? (await import("../../../skin/payload")).wireOf(sk, skinSame) : [];
  const skinLinks = Object.fromEntries(skinSame.flatMap(x => { const t = rows.get(x.id); return t ? [[x.id, { name: t.name, href: t.href }]] : []; }));
  const skinAttrs = sk?.attrs.get(r.id), tex = skinAttrs?.scores.texture, fin = skinAttrs?.scores.finish;
  const skinTex = tex && tex.n >= 3 ? (tex.score >= 62 ? "Rich" : tex.score <= 38 ? "Light" : null) : null;
  const skinFin = fin && fin.n >= 3 ? (fin.score >= 62 ? "Dewy" : fin.score <= 38 ? "Matte" : null) : null;
  const skinType = (SKIN || DG || AUDIO || SR) && r.shape ? (niche.typePages ?? []).find(t => t.shape === r.shape) ?? null : null;
  // DiscGolfRecs (its disc mock): the flight numbers as pills, the stability they give, and the engine's stability in its words.
  const flight = DG ? flightOf(r.weight) : null, stab = flight ? stabilityOfFlight(flight) : null;
  const dgStyle = DG && style ? SITE_FIT.styleLabels[style] : null;
  const also = (await lovedToo(r.id, rows)).filter(x => x.id !== r.id && x.current);
  // A site without model years (TennisRecs) keeps the name whole: its generation is part of it ("Head Speed MP 2022").
  const name = row?.name ?? r.name, bare = hasYears ? withoutYear(name) : name;
  // The live racket page's buy link, the same logic (app/rackets/[slug]/page.tsx): the Amazon lookup, the saved listing when
  // the two disagree, else the product's own site. So "Check price" shows here exactly where it shows on the live page.
  const live = await amazonButton({ name: r.name, brand: brand?.name }), saved = amazonPhoto(r);
  const amazon = live && saved && live.asin !== (r as { amazonAsin?: string | null }).amazonAsin ? { url: saved.url } : live;
  const site = websiteButton(r);
  const shop = amazon ? { url: amazon.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
  const specs = (SR ? niche.specs.map(s => [s.label, r[s.column]]) : DG ? [...niche.specs.map(s => [s.label, r[s.column]]), ["Stability", stab ? cap(stab) : null]]
    // "Year" only where products carry real model years (niche.productYears): SkinRecs and PickleballRecs store one
    // placeholder year for every product, so it showed "2026" on old products (skin audit 2026-11-20). SkinRecs labels
    // the skin types as the brand's claim (the pill above is what reviewers say) and adds the SPF its name gives (sunscreens and the SPF eye cream).
    : [...(hasYears ? [["Year", String(r.year)]] : []), ...niche.specs.map(s => [SKIN && s.column === "surface" ? "Skin types (brand)" : s.label, r[s.column]]),
      ...(SKIN && SPF_OF(r.name) ? [["SPF", SPF_OF(r.name)]] : []),
      // Sourced extra facts, e.g. a paddle's tournament status (db/shop/spec-notes.json, owner audit 2026-11-20).
      ...(((specNotes as unknown as Record<string, Record<string, [string, string][]>>)[niche.id] ?? {})[r.slug] ?? [])] as [string, string | null][]).filter((x): x is [string, string] => !!x[1]);
  // SimRacingRecs (its product mock): the gear type, its drive or kind ("Direct drive"), the level.
  // A product its maker no longer sells (Notes "Discontinued: …", SimRacingRecs, owner 2026-11-21): a tag first, "Used only".
  const gone = SR && /^Discontinued\b/i.test(r.surface ?? "");
  const tags = (SR ? [gone ? "Discontinued" : null, r.shape, r.balance, LEVEL_WORD(row?.levels ?? [])] : DG ? [r.shape, stab ? cap(stab) : null, LEVEL_WORD(row?.levels ?? [])] : SKIN ? [r.shape, skinAttrs?.facts.fragrance_free === "free" ? "Fragrance free" : null, skinTex ? `${skinTex} texture` : null, row?.best ? `Reviewers say: ${row.best}` : null]
    : [replaced ? "Discontinued" : null, style ? STYLE_WORD[style] : null, oneShape(r.shape), row?.feel ? `${row.feel} feel` : null, LEVEL_WORD(row?.levels ?? [])]).filter((x): x is string => !!x);
  const playersSay = SR ? ([row?.levels.length && ["Best for", LEVEL_WORD(row.levels)!],
    traits.slice().sort((a, b) => b.dots - a.dots)[0] && ["Strongest at", traits.slice().sort((a, b) => b.dots - a.dots)[0].label]].filter((x): x is [string, string] => !!x))
    : DG ? ([row?.levels.length && ["Best for", LEVEL_WORD(row.levels)!], dgStyle && ["Stability", dgStyle], row?.arm && ["Slower arm", "Yes, say players"],
    traits.slice().sort((a, b) => b.dots - a.dots)[0] && ["Strongest at", traits.slice().sort((a, b) => b.dots - a.dots)[0].label]].filter((x): x is [string, string] => !!x))
    : SKIN ? ([row?.best && ["Best for", cap(row.best)], skinTex && ["Texture", skinTex], skinFin && ["Finish", skinFin]].filter((x): x is [string, string] => !!x)) : [style && ["Plays like", STYLE_WORD[style]], row?.levels.length && ["Best for", LEVEL_WORD(row.levels)!], row?.arm && ["Arm friendly", "Yes, say players"],
    traits.slice().sort((a, b) => b.dots - a.dots)[0] && ["Strongest at", traits.slice().sort((a, b) => b.dots - a.dots)[0].label]].filter((x): x is [string, string] => !!x);
  const day = latest ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  const buy = shop && <div className="th-buy"><a href={shop.url} target="_blank" rel={shop.rel}>{gone ? "Used only ↗" : "Check price ↗"}</a>{/* One note on every site (owner 2026-11-20: no "we"). */}<small>Commission link. It never changes the score.</small></div>;
  const specsBox = specs.length > 0 && <section className="th-card th-specs th-only-m">{specs.map(([k, v]) => <span key={k} className="th-kv"><span>{k}</span><strong>{v}</strong></span>)}</section>;
  // The live page's structured data: its breadcrumbs (the catalogue, the brand, the racket).
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath }, ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };
  const crumbsEl = <div className="th-crumbs"><a href={th(catalogPath)}>{catalogLabel}</a>{SKIN || DG || AUDIO || SR ? skinType && <><span>/</span><a href={th(`/${skinType.slug}`)}>{AUDIO ? audioOf(ctx)?.wire.get(r.id)?.kind ?? skinType.label : skinType.label}</a></> : style && <><span>/</span><a href={th(STYLE_HREF[style])}>{STYLE_WORD[style]}</a></>}{brand && <><span>/</span><a href={`/brands/${brand.slug}`}>{brand.name}</a></>}</div>;
  const lineEl = line.length >= 2 && brand ? <section className="th-card th-sec">
          <div className="th-head-row"><h2 className="th-h2">{`More from ${brand.name}`}</h2><a className="th-link-b" href={`/brands/${brand.slug}`}>{`All ${brand.name} ${niche.words.many} →`}</a></div>
          <div className="th-also">{line.map(x => <Mini key={x.id} x={x} small/>)}</div>
        </section> : null;
  // PadelRecs: the v7b page (app/thread/racket-v7b.tsx). Six specs, each once (Weight, Shape, Balance, Feel, Face, Released),
  // then any sourced extra facts; no "updated" date anywhere (owner 2026-11-20: a community page).
  // AudioRecs (V3-ROLLOUT-BRIEF): the same page with its own fit card (lib/audio-match.ts), its kind's vote groups, tags
  // (noise cancelling first, the kind, the connection, the tuning), specs, pills and TL;DR words. No score.
  const au = AUDIO ? audioOf(ctx) : null, aw = au?.wire.get(r.id) ?? null;
  // SimRacingRecs (v3 rollout 2026-11-21): the same page with its own spec rows (Category, Type, Torque / brake force,
  // Platforms, Released), its gear type's vote groups and pills, a level-and-budget fit card and racer words. No score.
  // PickleballRecs (wave 2, 2026-11-21): the same, with its groups (Spin, Game type). No score.
  // TennisRecs (v3 wave 2, 2026-11-21): padel's page with its own spec rows (head size, weight, balance, pattern, stiffness).
  // DiscGolfRecs (V3-ROLLOUT-BRIEF wave 2): the same v3 page with its specs, stability and flight numbers as tags, its plastic
  // chips over the feed and "Slower arm" in the fit card. No score.
  if (niche.id === "padel" || (au && aw) || SR || TN || PB || DG) {
    // "Released": the year in the name ("Head Radical MP 2023"), else the year field, except on TennisRecs and SimRacingRecs,
    // whose year field is a placeholder (2026 on every product, owner report 2026-11-22): there the row is left out.
    const released = r.name.match(/\b(20\d\d)\b/)?.[1] ?? (SR || (TN && !tennisYearKnown(r.slug)) ? null : r.year ? String(r.year) : null);
    const v7Specs = (DG ? specs : SR || TN || PB ? [...niche.specs.map(s => [s.label, r[s.column]]), ["Released", released]] : aw ? [["Type", r.balance], ["Connection", r.weight], ["Driver", r.core], ["Noise cancelling", aw.anc ? "Yes" : aw.wireless ? "No" : null], ["Notes", r.surface]] : [["Weight", r.weight], ["Shape", r.shape], ["Balance", r.balance], ["Feel", row?.feel ?? null], ["Face", r.surface], ["Released", r.year ? String(r.year) : null],
      ...(((specNotes as unknown as Record<string, Record<string, [string, string][]>>)[niche.id] ?? {})[r.slug] ?? [])] as [string, string | null][]).filter((x): x is [string, string] => !!x[1]);
    // TL;DR with no counts (owner 2026-11-21): the written one as is; else the page's own lines without "N players mention
    // it", else the most-mentioned tags as "Players often say…". Claims still need 5+ reviews behind them (as before).
    const plain = (t: string) => marked(t).map(x => x.text).join("").trim();
    const pc = writtenTldr(r.reviewSummary) ? null : pageContent(r.slug), sum = pc || writtenTldr(r.reviewSummary) || !ctx ? null : summary(ctx.data, r.id);
    const says = (t: string) => AUDIO && AUDIO_SAYS[t] ? `${W.People} often ${AUDIO_SAYS[t]}.` : `${W.People} often ${tagSays(t)}.`;
    // AudioRecs: the tags every review carries, all time (its 12-month window leaves most pages under the 5-review rule).
    const audioTags = au && !pc && !writtenTldr(r.reviewSummary) && ctx ? (() => {
      const n = new Map<string, number>();
      for (const x of [...ctx.data.reviews.filter(v => v.racketId === r.id), ...ctx.data.external.filter(e => e.racketId === r.id)]) for (const t of new Set(x.tags ?? [])) n.set(t, (n.get(t) ?? 0) + 1);
      const top = (tone: "pos" | "neg") => [...n].filter(([t, c]) => c >= 5 && tagTone(t) === tone).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
      return [...top("pos").slice(0, 2).map(t => ({ tone: "pos" as const, text: says(t) })), ...top("neg").slice(0, 1).map(t => ({ tone: "catch" as const, text: says(t) }))];
    })() : null;
    const v7Bullets = audioTags ? audioTags : writtenTldr(r.reviewSummary) ? bullets : pc
      ? [...pc.yes.slice(0, 2).map(i => ({ tone: "pos" as const, text: plain(i.t) })), ...pc.no.slice(0, 1).map(i => ({ tone: "catch" as const, text: plain(i.t) }))]
      : sum ? [...sum.loved.filter(t => (sum.tagCounts.get(t) ?? 0) >= 5).slice(0, 2).map(t => ({ tone: "pos" as const, text: says(t) })),
        ...sum.complaints.filter(t => (sum.tagCounts.get(t) ?? 0) >= 5).slice(0, 1).map(t => ({ tone: "catch" as const, text: says(t) }))] : bullets;
    const model = shortModel(bare, brand?.name);
    // The top card's pill: the strongest "How does it play?" answer, from the groups as the page shows them (lib/thread/vote-pill.ts).
    const tc = hasDb() ? await traitCounts() : null;
    const pill = tc ? votePill(Object.fromEntries((SR ? traitGroupsForType(niche.id, r.shape, r.id) : TRAIT_GROUPS).map(g => [g.key, traitGroup(tc, r.id, g.key)])), W.people, ...(DG ? [DISCGOLF_PILL_LABELS, DISCGOLF_PILL_LABELS] as const : aw ? [AUDIO_PILL_LABELS, AUDIO_PILL_LABELS] as const : SR ? [SIMRACING_PILL_WORDS, SIMRACING_PILL_LABELS] as const : TN ? [TENNIS_PILL_WORDS, TENNIS_PILL_LABELS] as const : PB ? [PICKLEBALL_PILL_WORDS, PICKLEBALL_PILL_LABELS] as const : [])) : null;
    // The community sidebar (owner OK 2026-11-21): this week's counts, the newest question, who plays it (votes only), and
    // the rackets it is compared with (its compare pages' partners, then the engine's similar rackets).
    const groupOf = (k: string) => tc ? traitGroup(tc, r.id, k) : null;
    const who = aw ? null : whoPlays({ level: groupOf("level"), plays_like: groupOf("plays_like"), side: groupOf("side") });
    const cm = await communityFor(r.id);
    const partners = (ctx ? comparePairs(ctx.data).partners.get(r.id) ?? [] : []).map(x => rows.get(x.id)).filter((x): x is NonNullable<typeof x> => !!x && x.current !== false);
    const compared = [...partners, ...sim].filter((x, i, a) => x.id !== r.id && a.findIndex(y => y.id === x.id) === i).slice(0, 3)
      .map(x => ({ row: x, href: `/compare?ids=${encodeURIComponent(r.slug)},${encodeURIComponent(x.slug)}` }));
    return <Shell active="rackets">
      <JsonLd data={ld}/>
      <RacketV7b id={r.id} title={r.year && bare !== name ? `${bare} (${r.year})` : name} model={model} crumbs={crumbsEl} tags={aw ? audioTagsOf(aw, r.weight) : DG && flight ? [...tags, `${flight.speed} | ${flight.glide} | ${flight.turn} | ${flight.fade}`] : tags} lime={aw ? aw.anc : !!style} row={row} judged={judged} {...(aw && au ? audioPageProps(r.id, aw, au, rows, ctx) : SR ? srPageProps(r.id, r.shape) : DG ? dgPageProps(r.id, cards) : {})}
        lead={aw && lead ? lead.replace(/(?<![\w-])([Oo])wner(s?)\b/g, (_, o: string, x: string) => `${o === "O" ? "L" : "l"}istener${x}`) : DG && lead ? playersWord(lead, W.person) : SR && lead ? lead.replace(/(?<![\w-])([Oo])wner(s?)\b/g, (_, o: string, x: string) => `${o === "O" ? "R" : "r"}acer${x}`) : TN && lead ? lead.replace(/(?<![\w-])([Oo])wner(s?)\b/g, (_, o: string, x: string) => `${o === "O" ? "P" : "p"}layer${x}`) : lead} bullets={v7Bullets} specs={v7Specs} shop={shop} cards={cards} also={also} brand={brand ? { name: brand.name, slug: brand.slug } : null}
        sim={simSelf ? pickSimilar(simSelf, simSpecs, new Set(compared.map(c => c.row.id))).flatMap(id => rows.get(id) ?? []) : aw || SR || DG ? sim.filter(x => !compared.some(c => c.row.id === x.id)) : []} pill={pill} week={weekLine(cm.opinions, cm.posts)} latest={cm.latest} who={who} compared={compared} stories={tales}/>
    </Shell>;
  }
  return <Shell active="rackets">
    <JsonLd data={ld}/>
    <main className="th-main">
      <div className="th-col">
        {crumbsEl}
        <article className="th-card th-post"><div className="th-post-in">
          <div className="th-by"><span className="th-dot" aria-hidden="true"/><strong>{niche.site.name}</strong>{day && <><span>·</span><span>{`updated ${day}`}</span></>}{(judged > 0 || cards.length > 0) && <><span>·</span><span>{[judged > 0 ? `${plural(judged, W.opinions.replace(/s$/, ""), W.opinions)} analysed` : "", cards.length > 0 ? `${plural(cards.length, "review")} to read` : ""].filter(Boolean).join(" · ")}</span></>}</div>
          <h1 className="th-h1">{r.year && bare !== name ? `${bare} (${r.year})` : name}</h1>
          <div className="th-tags">
            {tags.map((t, i) => <span key={t} className={`th-pill${i === 0 && style ? " lime" : ""}`}>{t}</span>)}
            {flight && <Flight f={[flight.speed, flight.glide, flight.turn, flight.fade]}/>}
            {!V3 && <span className="th-inline-score">{row?.score != null ? <><span className={`th-badge xs ${tone(row.score)}`}>{row.score}</span>{W.score}</> : "New, not enough votes yet"}</span>}
          </div>
          <div className="th-hero-grid">
            <Photo src={row?.pic ?? null} className="th-bigphoto"/>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              {(lead || bullets.length > 0) && <div className="th-tldr"><div className="th-tldr-h">TL;DR</div>
                {lead && <p>{lead}</p>}
                {bullets.length > 0 && <ul>{bullets.map(b => <li key={b.text}><span className={`th-sdot ${b.tone === "mix" ? "catch" : b.tone}`}/><span>{b.text}</span></li>)}</ul>}
              </div>}
              {SKIN ? <SkinFitCheck id={r.id} wire={skinWire} links={skinLinks}/> : <FitCheck id={r.id}/>}
            </div>
          </div>
          <Poll id={r.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }}/>
        </div></article>

        <TraitVotes id={r.id} seed={traitSeed(niche.id, r.id)} {...(SKIN ? { of: judged } : {})} {...(SR ? { groups: traitGroupsForType(niche.id, r.shape, r.id) } : {})}/>
        {/* "What reviews say" (trait dots) is off the page (owner 2026-11-19, not in the mockup); racketData still builds `traits`. */}
        {sim.length > 0 && <section className="th-card th-sec th-sec-sim"><h2 className="th-h3">{`Similar ${niche.words.many}`}</h2><div className="th-sim">{sim.map(x => <Mini key={x.id} x={x}/>)}</div></section>}
        {specsBox}
        {buy && <div className="th-card th-only-m" style={{ padding: "10px 16px" }}>{buy}</div>}
        <Reviews id={r.id} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []} {...(DG ? { chips: plastics(cards) } : {})}/>
        {tales.length > 0 && <section className="th-card th-sec"><h2 className="th-h2">Stories mentioning this racket</h2>
          <ul className="th-stories sm">{tales.map(s => <li key={s.id}><a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a>
            <span className="th-story-by"><strong>{s.author.name}</strong><MemberMark/></span></li>)}</ul></section>}
        <Comments page={`racket:${r.id}`} nicknames={niche.form.quickVote?.nicknames ?? []}/>
        {also.length >= 2 && <section className="th-card th-sec"><h2 className="th-h2">{`${W.lovers} who loved this also loved`}</h2><div className="th-also">{also.map(x => <Mini key={x.id} x={x} small/>)}</div></section>}
        {lineEl}
      </div>
      <aside className="th-side">
        <section className="th-card th-sbox"><div className="th-sbox-head">{`About this ${niche.words.one}`}</div><div className="th-sbox-body pad">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!V3 && (row?.score != null ? <span className={`th-badge ${tone(row.score)}`} style={{ fontSize: 28 }}>{row.score}</span> : <span className="th-badge new">New</span>)}
            {/* "player score" with the bar under it, no count (owner 2026-11-19). Without a score, the line says why it's "New". */}
            <span style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5, color: "var(--body)" }}>
              <span>{row?.score != null && !V3 ? W.score : judged > 0 ? `${plural(judged, W.opinions.replace(/s$/, ""), W.opinions)} so far` : "No votes yet"}</span>
              {judged > 0 && <SBar lg pos={row!.pos} mix={row!.mix} neg={row!.neg}/>}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {playersSay.length > 0 && <><span className="th-cap">{`${W.People} say`}</span>{playersSay.map(([k, v]) => <a key={k} className="th-kv" href="#play"><span>{k}</span><strong>{v}</strong></a>)}</>}
            {specs.length > 0 && <><span className="th-cap" style={{ paddingTop: 10 }}>Specs</span>{specs.map(([k, v]) => <span key={k} className="th-kv"><span>{k}</span><strong>{v}</strong></span>)}</>}
          </div>
          {cards.length > 0 && <a className="th-link-b" href="#reviews">{`Read ${plural(cards.length, "review")}`}</a>}
          {buy}
        </div></section>
      </aside>
    </main>
    {buy && <div className="th-only-m" style={{ justifyContent: "center", padding: "0 16px 24px", marginTop: -48 }}>{buy}</div>}
  </Shell>;
}

/** AudioRecs' tags: noise cancelling first (lime), the kind, the connection and the tuning listeners hear. */
/** SimRacingRecs' product page parts: the fit card in its words (level and budget, I race on console) and the gear type's groups. */
/** DiscGolfRecs' fit card words ("Slower arm") and its plastic chips over the feed. */
function dgPageProps(id: string, cards: { version?: string | null }[]) {
  return { fit: <FitCard id={id} title="Is this disc right for me?" sub="Pick your level and the flight you want, for a quick fit from community feedback." arm="Slower arm"/>,
    whoTitle: "Who throws it", ...(plastics(cards) ? { plastics: plastics(cards) } : {}) };
}
function srPageProps(id: string, shape: string | null) {
  return { fit: <FitCard id={id} title="Is this product right for me?" sub="Pick your level and budget, for a quick fit from community feedback." arm="I race on console"/>,
    groups: traitGroupsForType(niche.id, shape, id), whoTitle: "Who races with it" };
}
function audioTagsOf(aw: AudioWire, connection: string | null) {
  return [aw.anc ? "Noise cancelling" : null, aw.kind, connection, tuningWord(aw.s.tuning)].filter((x): x is string => !!x);
}
/** AudioRecs' fit card (its kind's match inputs, for like-for-like "Better for you") and its kind's nine vote groups. */
function audioPageProps(id: string, aw: AudioWire, au: NonNullable<ReturnType<typeof audioOf>>, rows: Map<string, ThreadRow>, ctx: Parameters<typeof audioOf>[0]) {
  const same = ctx.data.listed.filter(x => x.id === id || (rows.get(x.id)?.current && au.wire.get(x.id)?.kind === aw.kind));
  const links = Object.fromEntries(same.flatMap(x => { const t = rows.get(x.id); return t ? [[x.id, { name: t.name, href: t.href }]] : []; }));
  return { fit: <AudioFitCard id={id} wire={same.flatMap(x => au.wire.get(x.id) ?? [])} links={links}/>, groups: audioGroupsFor(aw) };
}
