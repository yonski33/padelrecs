"use client";
// The quick-match picks and list on the PadelRecs home (batch D, owner 2026-11-15: "the quick match and filters feel
// instant"). The server renders it for the address's picks (so every combination is still a real, shareable page); a chip tap
// re-ranks the same payload in the browser with the same functions (lib/home-rank.ts) and updates the address, with no round
// trip. Links stay real links: a new tab, or no JavaScript, still gets the server's page.
import { useEffect, useState, type ReactNode } from "react";
import { useInstantView, instantClick } from "./instant-view";
import { rankHome } from "../lib/home-rank";
import { choiceHref, homeHref, isDefault, DEFAULT_CHOICE, matchTitle, matchSeoTitle, readChoice, levelPeople, levelLabel, LEVELS, STYLES, STYLE_WORD, type QuickChoice } from "../lib/quick-match";
import { ARM_BAR } from "../lib/fit-verdict";
import { WEIGHTS, FEELS, CORES, SHAPE_LABEL, FINE_ROWS, FINE_SHAPES, FINE_SWEET, weightWord, fineEmpty, fineWords } from "../lib/fine-tune";
import { niche, catalogPath, v2copy } from "../lib/niche";
import { fitConfigFor } from "../lib/fit-config";
import type { HomePayload, HomeSeed } from "./home-payload";
import { sameChoice } from "../lib/rank-seed";
import { forgetSavedPicks } from "../lib/saved-picks";
/** What "reset ↺" goes back to: the default picks, whose address is "/" (tests/quick-reset.test.ts). */
export const RESET_CHOICE: QuickChoice = DEFAULT_CHOICE;

const MATCH_NOTE = "How well it fits your picks, from player reports. Not a % of happy players.";
const BAD = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
/** A site's own home mock (niche.v2home; PickleballRecs): every row has the match box, "check price" is a button. */
const M = niche.v2home;
/** The fine-tune's rows on this site (lib/fine-tune.ts): [label, URL key, options as [value, label]]. */
const FINE_GROUPS = FINE_ROWS.map(k => k === "shape" ? ["Shape", "shape", FINE_SHAPES.map(v => [v, SHAPE_LABEL[v]] as const)] as const
  : k === "weight" ? ["Weight", "weight", WEIGHTS.map(v => [v, weightWord(v)] as const)] as const
  : k === "feel" ? ["Feel on impact", "feel", FEELS.map(v => [v, v] as const)] as const : ["Core thickness", "core", CORES.map(v => [v, v] as const)] as const);
const FIT_WORD = { good: "Strong fit", maybe: "Worth a look", no: "Probably not" } as const;
/** A type-picker site's words and picks (lib/fit-config.ts quick: DiscGolfRecs); unset on padel, whose row is unchanged. */
const CFG = fitConfigFor(niche), QUICK = CFG?.quick;
const SCORE_WORD = v2copy.score ?? "player score";
/** The style picks under their site words ("understable" …) on a type-picker site. */
const styleWord = (s: QuickChoice["style"]) => QUICK && s !== "any" ? (CFG!.styleLabels[s] ?? STYLE_WORD[s]).toLowerCase() : STYLE_WORD[s];
/** The finder plus the level gate (lib/niche fit.levelGate), as the server ranks with it. */
const SETUP = { ...niche.finder!, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };

const hrefOf = homeHref;
const titleOf = (c: QuickChoice) => isDefault(c) ? niche.seo.homeTitle : `${matchSeoTitle(c, `${v2copy.sport ? `${v2copy.sport} ` : ""}${niche.words.many}`)} | ${niche.site.name}`;
function fromLocation(): { choice: QuickChoice; older: boolean } {
  const q = Object.fromEntries(new URLSearchParams(location.search));
  return { choice: readChoice(q), older: q.older === "1" };
}

/** The picks, then the list beside `children` (the server-rendered sidebar). */
export function HomeMatch({ seed, listed, children }: { seed: HomeSeed; listed: number; children: ReactNode }) {
  // Back and forward step through the picks (app/instant-view.ts).
  const [{ choice, older }, set] = useInstantView({ choice: seed.choice, older: seed.older }, fromLocation, v => hrefOf(v.choice, v.older));
  // The page carries only its own rows (owner 2026-11-16: homes were 340–950 KB); the whole payload, for re-ranking on a tap,
  // loads from one cached address once the page is up. Until it arrives the list keeps the page's rows.
  const [payload, setPayload] = useState<HomePayload | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/home-payload").then(r => r.ok ? r.json() : null).then((p: HomePayload | null) => { if (live && p?.items?.length) setPayload(p); }, () => {});
    return () => { live = false; };
  }, []);
  const own = !payload || (sameChoice(choice, seed.choice) && older === seed.older);
  const go = (next: QuickChoice, nextOlder = older) => instantClick(() => { set({ choice: next, older: nextOlder }); document.title = titleOf(next); });
  // Reset (owner 2026-11-16): the default picks (no level, no fine-tune, newest models), the plain address, no saved picks.
  // It used to set level "intermediate", so on ?level=intermediate it changed nothing.
  const reset = instantClick(() => { forgetSavedPicks(); set({ choice: RESET_CHOICE, older: false }); document.title = titleOf(RESET_CHOICE); });
  const { rows, olderN } = own ? seed : rankHome(payload.items, SETUP, BAD, choice, older);
  const cards = own ? seed.cards : payload.cards;
  const byId = own ? null : new Map(payload.items.map(x => [x.id, x]));
  const signalOf = (id: string) => byId ? byId.get(id)?.signal ?? null : seed.signal[id] ?? null;
  const armOf = (id: string) => byId ? byId.get(id)?.arm ?? 0 : seed.arm[id] ?? 0;
  const picked = !isDefault(choice);
  const head = matchTitle(choice, niche.words.many);
  const pill = (label: string, next: QuickChoice, on: boolean) => <a href={`${hrefOf(next, older)}#match`} onClick={go(next)} aria-current={on ? "true" : undefined} className={on ? "on" : undefined}>{label}</a>;
  // Rows carry the picks to the racket page, so its fit check answers for this visitor (RACKET-FIT-PAGE.md).
  const picks = picked ? choiceHref(choice, "").replace(/^\/\??/, "?") : "";
  return <>
    <section className="hv2-qm" id="match" aria-label="Quick match">
      {QUICK ? <>
        <span className="hv2-qk"><b>quick match</b>{QUICK.want}</span>
        <span className="hv2-seg" role="group" aria-label={`${niche.words.One} type`}>{[undefined, ...QUICK.types.map(t => t.key)].map(k => <span key={k ?? "any"}>{pill(k ?? "any", { ...choice, kind: k }, choice.kind === k)}</span>)}</span>
      </> : <>
      <span className="hv2-qk"><b>quick match</b>I want</span>
      <span className="hv2-seg" role="group" aria-label="What you want most">{STYLES.map(s => <span key={s}>{pill(STYLE_WORD[s], { ...choice, style: s }, choice.style === s && (!M || picked))}</span>)}</span>
      </>}
      <span className="hv2-qk">and I&apos;m</span>
      <span className="hv2-lv" role="group" aria-label="Your level">{LEVELS.map(l => <span key={l}>{pill(levelLabel(l), { ...choice, level: l }, choice.level === l)}</span>)}</span>
      <a className="hv2-arm" href={`${hrefOf({ ...choice, arm: !choice.arm }, older)}#match`} onClick={go({ ...choice, arm: !choice.arm })} aria-current={choice.arm ? "true" : undefined}><i aria-hidden="true">{choice.arm ? "✓" : ""}</i>{QUICK?.arm ?? "sore elbow / wrist"}</a>
      {/* Not sure yet? fine-tune (owner 2026-11-15): optional shape / weight / feel / sweet-spot picks, in the URL like the rest. */}
      {(M ? !!choice.level : picked) && <details className={`hv2-fine${M ? " m" : ""}`} open={QUICK ? choice.style !== "any" : !fineEmpty(choice.fine)}>
        <summary><span className="c">Not sure yet? <b>{(() => { const n = FINE_GROUPS.filter(([, k]) => choice.fine?.[k]).length; return M && n ? `fine-tune (${n}) ▾` : "fine-tune ▾"; })()}</b></span><span className="o">{M ? <>Not sure yet? <b>fewer filters ▴</b></> : "fewer filters ▴"}</span>
          {M && <em className="hv2-fhint">{(() => { const n = FINE_GROUPS.filter(([, k]) => choice.fine?.[k]).length; return n ? `match % includes ${n} extra filter${n > 1 ? "s" : ""}` : `${FINE_GROUPS.map(([l]) => l.split(" ")[0].toLowerCase()).join(", ").replace(/, ([^,]*)$/, " & $1")}, all optional`; })()}</em>}</summary>
        <div className="hv2-fine-rows">
          {QUICK ? <div className="hv2-fine-row"><span className="hv2-fk">{QUICK.stabilityLabel}</span><span className="hv2-lv" role="group" aria-label={QUICK.stabilityLabel}>
            {(["control", "balance", "power"] as const).map(v => <span key={v}>{pill(styleWord(v), { ...choice, style: choice.style === v ? "any" : v }, choice.style === v)}</span>)}
            <span>{pill("any", { ...choice, style: "any" }, choice.style === "any")}</span></span></div> : <>
          {FINE_GROUPS.map(([label, key, opts]) => {
            const cur = choice.fine?.[key];
            const with_ = (v: string | undefined) => ({ ...choice, fine: { ...choice.fine, [key]: v } });
            return <div key={key} className="hv2-fine-row"><span className="hv2-fk">{label}</span><span className="hv2-lv" role="group" aria-label={label}>
              {opts.map(([v, l]) => <span key={v}>{pill(l, with_(cur === v ? undefined : v), cur === v)}</span>)}
              {key !== "feel" && <span>{pill("any", with_(undefined), !cur)}</span>}</span></div>; })}
          {FINE_SWEET && <a className="hv2-arm" href={`${hrefOf({ ...choice, fine: { ...choice.fine, sweet: !choice.fine?.sweet || undefined } }, older)}#match`} onClick={go({ ...choice, fine: { ...choice.fine, sweet: !choice.fine?.sweet || undefined } })} aria-current={choice.fine?.sweet ? "true" : undefined}><i aria-hidden="true">{choice.fine?.sweet ? "✓" : ""}</i>bigger sweet spot</a>}
          </>}
        </div>
      </details>}
      {picked && !M && <p className="hv2-game">{QUICK ? "Your throw: " : "Your game: "}<b>{(QUICK ? [QUICK.types.find(t => t.key === choice.kind)?.many ?? null, choice.level ?? null, choice.style !== "any" ? styleWord(choice.style) : null, choice.arm ? QUICK.arm : null]
          : [choice.level ? levelLabel(choice.level)[0].toUpperCase() + levelLabel(choice.level).slice(1) : null, STYLE_WORD[choice.style][0].toUpperCase() + STYLE_WORD[choice.style].slice(1), choice.arm ? "sore arm" : null, ...fineWords(choice.fine)]).filter(Boolean).join(" · ")}</b>
        <a href="/" onClick={reset}>reset ↺</a></p>}
    </section>

    <div className="hv2-grid">
    <section className="hv2-main" aria-live="polite">
      <div className="hv2-lhead"><h2>{picked ? head.title : `Top ${niche.words.many} right now`}</h2>
        <span>{M ? (picked ? [choice.level ? `ranked for ${levelPeople(choice.level)}` : "pick a level to sharpen this", choice.arm ? "arm-friendly first" : null].filter(Boolean).join(" · ") : M.listSub)
          : picked ? <>{`${choice.level ? `ranked for ${levelPeople(choice.level)}` : "ranked for your picks"}${choice.arm ? ` · ${QUICK?.armChip ?? "arm-friendly"} first` : ""} · `}<details className="hv2-what"><summary>{"what's the %?"}</summary><span>{`${MATCH_NOTE} `}<a href="/how-we-make-these#match">how it works</a></span></details></> : `ranked by ${SCORE_WORD} · pick above to personalise`}</span></div>
      {rows.length === 0 && <p className="hv2-empty">Nothing matches that yet. Try another combination.</p>}
      <div className="hv2-box">
      <ol className={`hv2-list${picked ? " hv2-picked" : ""}`}>{rows.map(({ id, fit, pct, arm }, i) => {
        const r = cards[id], sig = signalOf(id);
        // The fit check's verdict for the picks (lib/fit-verdict.ts), with one short real reason; none without picks or on thin data.
        const fitWord = fit && fit.kind !== "thin" ? FIT_WORD[fit.kind] : null;
        const chips = [
          ...(i === 0 && picked && fit?.kind === "good" ? [{ k: "best", t: "best match" }] : []),
          ...(r.shape ? [{ k: "shape", t: r.shape }] : []),
          ...(choice.arm && (QUICK ? armOf(id) >= 70 && r.armOk !== false : arm >= ARM_BAR) ? [{ k: "arm", t: QUICK?.armChip ?? "arm-friendly" }] : []),
        ];
        // The row is one link (the name's, stretched over the row) with "check price" as a quiet text link under the
        // summary line (owner 2026-11-15: low-key, close to the text). Reviews over the sentiment bar, then the score box.
        if (M) return <li key={id} className={i === 0 && picked ? "top" : undefined}><div className="hv2-row m">
          <span className="hv2-rank">{i + 1}</span>
          <span className="hv2-pic">{r.pic ? <img src={r.pic} alt="" width={408} height={620} decoding="async" loading={i < 3 ? "eager" : "lazy"}/> : <span className="hv2-tile">{r.name.split(" ").slice(0, 2).join(" ")}</span>}</span>
          <span className="hv2-body"><span className="hv2-nrow"><b className="hv2-rk" aria-hidden="true">{`#${i + 1}`}</b><a className="hv2-name" href={`${r.href}${picks}`}>{r.name}</a>{chips.map(c => <span key={c.k} className={`hv2-chip ${c.k}`}>{c.t}</span>)}</span>
            {r.line && <span className="hv2-line">{r.line}</span>}</span>
          <span className="hv2-sent"><span>{`${r.n.toLocaleString("en-US")} ${r.n === 1 ? "review" : "reviews"}`}</span>
            {r.judged > 0 && <span className="hv2-bar" aria-label={`${r.pos} positive, ${r.mix} mixed, ${r.neg} negative`}><i className="p" style={{ flex: r.pos }}/><i className="m" style={{ flex: r.mix }}/><i className="n" style={{ flex: r.neg }}/></span>}</span>
          {/* Padel's quiet "check price ↗" text link and its score badge (owner 2026-11-16): the Player score until a pick, then the match %. */}
          <span className="hv2-btnc">{r.shop && <a className="hv2-buy" href={r.shop.url} target="_blank" rel={r.shop.rel}>check price ↗</a>}</span>
          {picked ? <span className={`hv2-sc ${pct === null ? "none" : pct >= 80 ? "hi" : pct >= 60 ? "mid" : ""}`} title={MATCH_NOTE}
            aria-label={pct === null ? "No match % yet: not enough reports" : `${pct}% match. ${MATCH_NOTE}`}>
            <b>{pct !== null ? `${pct}%` : "—"}</b><small>{pct === null ? "too few reports" : "match"}</small></span>
            : <span className={`hv2-sc ${sig === null ? "none" : sig >= 85 ? "hi" : sig >= 75 ? "mid" : ""}`} title={`${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}: not a % of happy ${niche.people.many}.`}>
            <b>{sig ?? "—"}</b><small>{SCORE_WORD}</small></span>}
        </div></li>;
        return <li key={id} className={i === 0 && picked ? "top" : undefined}><div className="hv2-row">
          <span className="hv2-rank">{i + 1}</span>
          <span className="hv2-pic">{r.pic ? <img src={r.pic} alt="" width={408} height={620} decoding="async" loading={i < 3 ? "eager" : "lazy"}/> : QUICK ? <span className={`hv2-disc t${i % 6}`} aria-hidden="true"/> : <span className="hv2-tile">{r.name.split(" ").slice(0, 2).join(" ")}</span>}</span>
          <span className="hv2-body"><span className="hv2-nrow"><a className="hv2-name" href={`${r.href}${picks}`}>{r.name}</a>{chips.map(c => <span key={c.k} className={`hv2-chip ${c.k}`}>{c.t}</span>)}</span>
            {r.line && <span className="hv2-line">{r.line}</span>}
            {/* Flight numbers (type-picker sites): labelled once over the first row, and each box names its number. */}
            {r.flight && <span className="hv2-flight">{i === 0 && QUICK?.flightLabel && <a className="hv2-flight-k" href="/guide#flight">{QUICK.flightLabel}</a>}
              {r.flight.map((n, j) => <i key={j} title={["speed", "glide", "turn", "fade"][j]}>{n}</i>)}</span>}
            {r.shop && <a className="hv2-buy" href={r.shop.url} target="_blank" rel={r.shop.rel}>check price ↗</a>}
            {/* The verdict word sits on the % box (owner 2026-11-15); here only its one short reason. */}
            {fitWord && fit!.short && <span className={`hv2-fit ${fit!.kind}`}><span>{fit!.short}</span></span>}</span>
          <span className="hv2-sent"><span><strong>{r.n.toLocaleString("en-US")}</strong>{` ${r.n === 1 ? "review" : "reviews"}`}</span>
            {r.judged > 0 && <span className="hv2-bar" aria-label={`${r.pos} positive, ${r.mix} mixed, ${r.neg} negative`}><i className="p" style={{ flex: r.pos }}/><i className="m" style={{ flex: r.mix }}/><i className="n" style={{ flex: r.neg }}/></span>}</span>
          {picked ? <span className={`hv2-sc ${pct === null ? "none" : pct >= 80 ? "hi" : pct >= 60 ? "mid" : ""}`} title={MATCH_NOTE} aria-label={pct === null ? "No match % yet: not enough reports" : `${pct}% match. ${MATCH_NOTE}`}>
              {fitWord && <i className={`hv2-verdict ${fit!.kind}`}>{fitWord}</i>}<b>{pct === null ? "—" : `${pct}%`}</b>{pct === null && <small>too few reports</small>}</span>
            : <span className={`hv2-sc ${sig === null ? "none" : sig >= 85 ? "hi" : sig >= 75 ? "mid" : ""}`} title={`${SCORE_WORD[0].toUpperCase()}${SCORE_WORD.slice(1)}: not a % of happy ${niche.people.many}. It blends how much ${niche.people.many} like it with how many have weighed in.`}>
              <b>{sig ?? "—"}</b><small>{SCORE_WORD}</small></span>}
        </div></li>;
      })}</ol>
      {(olderN > 0 || older) && <a className="hv2-older" href={`${hrefOf(choice, !older)}#match`} onClick={go(choice, !older)}>{older ? "hide older models ▴" : "show older models ▾"}</a>}
      <a className="hv2-more" href={catalogPath}>{`see all ${listed} ${niche.words.many} →`}</a>
      </div>
    </section>
    {children}
    </div>
  </>;
}
