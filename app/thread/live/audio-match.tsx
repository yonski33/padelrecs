"use client";
// AudioRecs' quick match in the v3 pages (V3-ROLLOUT-BRIEF): the picks (use, sound, noise cancelling), kept in this browser
// and shared by every page, and the match % for the rows on the page (lib/audio-match.ts on the inputs the page sent, so a
// tap never asks the server: tests/instant-views.test.ts). It works like padel's quick match: it re-orders by "% your
// match" and hides nothing. No score.
import { useEffect, useMemo, useState } from "react";
import { NO_AUDIO_PICKS, audioPickedAny, audioMatch, rankAudio, audioVerdict, STRONG_WORDS, USES, SOUNDS, type AudioPicks, type AudioWire } from "../../../lib/audio-match";
import { tone } from "../ui";
import { th } from "../../../lib/thread/look";
import type { ListMatch } from "./padel-list";

const KEY = "audiorecs-qm", EVENT = "thread-audio-picks";
const read = (): AudioPicks => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return { use: v.use ?? null, sound: v.sound ?? null, anc: !!v.anc }; } catch { return NO_AUDIO_PICKS; } };

/** The visitor's picks, the same on every page and tab. Starts empty so the server's HTML and the first render agree. */
export function useAudioPicks() {
  const [picks, setPicks] = useState<AudioPicks>(NO_AUDIO_PICKS);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks(read());
    const on = () => setPicks(read());
    addEventListener(EVENT, on); addEventListener("storage", on);
    return () => { removeEventListener(EVENT, on); removeEventListener("storage", on); };
  }, []);
  const set = (next: Partial<AudioPicks>) => {
    const v = { ...read(), ...next };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: the picks still apply on this page */ }
    setPicks(v); dispatchEvent(new Event(EVENT));
  };
  return [picks, set] as const;
}

/** The list's match: the picks and each row's % (null where too few reviews back it). */
export function useAudioListMatch(wire: AudioWire[] | undefined): ListMatch | undefined {
  const [picks, set] = useAudioPicks();
  const mine = audioPickedAny(picks);
  const pcts = useMemo(() => wire && mine ? new Map(wire.map(w => [w.id, audioMatch(w, picks).pct])) : null, [wire, mine, picks]);
  return wire ? { mine, pcts, picks, set } : undefined;
}

const FIT_HEAD = { good: "Yes, a strong fit.", maybe: "Maybe. Try them on first.", no: "Probably not this pair.", thin: "Not enough reviews to say yet." } as const;
/** "Is it right for me?" on an AudioRecs product page, in the v3 FitCard's markup (live/racket-v7b.tsx): Mostly for and I like,
 *  then this pair's match %, what listeners praise or the catch, and, under 80%, up to 2 better fits of the same kind.
 *  `wire`: this product's kind only, so "Better for you" stays like for like. */
export function AudioFitCard({ id, wire, links }: { id: string; wire: AudioWire[]; links: Record<string, { name: string; href: string }> }) {
  const [stored, set] = useAudioPicks();
  // The page asks use and sound only (its mock), so the home's noise cancelling box doesn't hold this pair down unseen.
  const picks = useMemo(() => ({ ...stored, anc: false }), [stored]);
  const res = useMemo(() => {
    const w = wire.find(x => x.id === id);
    if (!w || !audioPickedAny(picks)) return null;
    const m = audioMatch(w, picks);
    const better = m.pct != null && m.pct < 80 ? rankAudio(wire, picks, x => x.id !== id && !!links[x.id])
      .filter(x => x.m.pct != null && x.m.pct >= m.pct! + 10 && !x.m.hard).slice(0, m.pct < 60 ? 2 : 1) : [];
    return { m, better };
  }, [wire, picks, id, links]);
  const why = res ? res.m.reasons.length ? `${res.m.reasons[0][0].toUpperCase()}${res.m.reasons[0].slice(1)}.`
    : res.m.strong.length ? `Listeners praise its ${res.m.strong.map(k => STRONG_WORDS[k] ?? k).join(" and ")}.` : null : null;
  return <section className="th-card th7-card th7-fit">
    <div className="th7-hd"><h2 className="th-h2">Is it right for me?</h2><span className="th-sub">Pick how you listen and what you like, for a quick fit from listener feedback.</span></div>
    <div className="th-fit">
      <div className="th-picks" role="group" aria-label="Mostly for"><span className="lbl">Mostly for</span>
        {USES.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.use === v} onClick={() => set({ use: picks.use === v ? null : v })}>{l}</button>)}</div>
      <div className="th-picks" role="group" aria-label="I like"><span className="lbl">I like</span>
        {SOUNDS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.sound === v} onClick={() => set({ sound: picks.sound === v ? null : v })}>{l}</button>)}</div>
    </div>
    {res && <div aria-live="polite"><div className="th7-match">
      {res.m.pct != null && <span className="th7-match-pct"><span className={`th-badge ${tone(res.m.pct)}`}>{`${res.m.pct}%`}</span><small>your match</small></span>}
      <span className="th7-match-body"><b>{FIT_HEAD[audioVerdict(res.m.pct)]}</b>
        {why && <span>{why}</span>}
        {res.better.length > 0 && <span className="th-fit-better">{"Better for you: "}{res.better.map((b, i) => <span key={b.w.id}>{i > 0 && " or "}<a href={th(links[b.w.id].href)}>{links[b.w.id].name}</a>{` (${b.m.pct}%)`}</span>)}.</span>}
      </span>
    </div></div>}
  </section>;
}
