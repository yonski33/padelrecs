"use client";
import { useEffect, useState } from "react";

// Quick votes (2026-11-14 pivot): one tap, then optional level and style, then the payoff (how others voted, players
// like you, what fans also loved). The profile is remembered on this device so later votes carry it without asking.

export type Verdict = "love" | "ok" | "no";
export type Stats = { love: number; ok: number; no: number; total: number; level?: { name: string; love: number; total: number } };
export type Profile = { level?: string; style?: string; side?: string };
export const VERDICT_LABELS: [Verdict, string][] = [["love", "Love it"], ["ok", "It's OK"], ["no", "Not for me"]];
const PROFILE_KEY = "rv-profile";

export function loadProfile(): Profile {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") as Profile; } catch { return {}; }
}
export function saveProfile(p: Profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* private mode: the profile just isn't remembered */ }
}
export async function sendVote(racketId: string, verdict: Verdict, profile: Profile) {
  const r = await fetch("/api/racket-votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ racketId, verdict, ...profile }) });
  const body = await r.json() as { stats?: Stats; error?: string };
  if (!r.ok || !body.stats) throw new Error(body.error || "Could not save your vote.");
  return body.stats;
}
export const pct = (n: number, of: number) => of ? Math.round(100 * n / of) : 0;

export function ChoiceRow({ label, options, value, onPick }: { label: string; options: string[]; value?: string; onPick: (v: string) => void }) {
  return <div className="qv-choice"><span>{label}</span><div>{options.map(o =>
    <button type="button" key={o} aria-pressed={value === o} onClick={() => onPick(o)}>{o}</button>)}</div></div>;
}

export default function QuickVote({ racketId, name, plural, people, levels, styles, addHref, rateHref }: {
  racketId: string; name: string; plural: string; people: { one: string; many: string }; levels: string[]; styles: string[]; addHref: string; rateHref: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null), [mine, setMine] = useState<Verdict | null>(null);
  const [profile, setProfile] = useState<Profile>({}), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [also, setAlso] = useState<{ id: string; name: string; href: string; fans: number }[]>([]);

  useEffect(() => {
    const p = loadProfile(); setProfile(p);
    fetch(`/api/racket-votes?racket=${encodeURIComponent(racketId)}${p.level ? `&level=${encodeURIComponent(p.level)}` : ""}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then((b: { stats?: Stats; mine?: Verdict | null } | null) => { if (b?.stats) setStats(b.stats); if (b?.mine) setMine(b.mine); })
      .catch(() => {});
  }, [racketId]);

  async function vote(v: Verdict, p = profile) {
    setBusy(true); setError("");
    try {
      setStats(await sendVote(racketId, v, p)); setMine(v);
      if (v === "love") fetch(`/api/racket-votes?loved=${encodeURIComponent(racketId)}`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null).then((b: { picks?: typeof also } | null) => setAlso(b?.picks ?? [])).catch(() => {});
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your vote."); }
    finally { setBusy(false); }
  }
  function setField(field: keyof Profile, value: string) {
    const p = { ...profile, [field]: value }; setProfile(p); saveProfile(p);
    if (mine) void vote(mine, p);
  }

  const lovePct = stats ? pct(stats.love, stats.total) : 0;
  return <section className="qv" aria-labelledby="qv-title">
    <div className="qv-head">
      <h2 id="qv-title">{mine ? "Your vote" : "Own this one? How's it going?"}</h2>
      {stats && stats.total > 0 && <p className="qv-count">{`${stats.total.toLocaleString("en-US")} ${stats.total === 1 ? people.one : people.many} voted · ${lovePct}% love it`}</p>}
    </div>
    <div className="qv-buttons" role="group" aria-label={`Your verdict on the ${name}`}>
      {VERDICT_LABELS.map(([v, label]) => <button type="button" key={v} className={`qv-${v}`} aria-pressed={mine === v} disabled={busy} onClick={() => vote(v)}>{label}</button>)}
    </div>
    {!mine && <p className="qv-note">One tap, no account. Votes are counted apart from written reviews.</p>}
    {error && <p className="qv-error" role="alert">{error}</p>}
    {mine && <div className="qv-after">
      {!profile.level && <ChoiceRow label={`Your level, so your vote helps ${people.many} like you`} options={levels} value={profile.level} onPick={v => setField("level", v)}/>}
      {profile.level && !profile.style && <ChoiceRow label="Your style (optional)" options={styles} value={profile.style} onPick={v => setField("style", v)}/>}
      {stats && stats.total > 0 && <div className="qv-split" aria-label={`${stats.love} love it, ${stats.ok} OK, ${stats.no} not for them`}>
        <i className="qv-bar-love" style={{ flex: stats.love }}/><i className="qv-bar-ok" style={{ flex: stats.ok }}/><i className="qv-bar-no" style={{ flex: stats.no }}/>
      </div>}
      {stats?.level && stats.level.total > 0 && <p className="qv-like-you">{stats.level.total < 5
        ? `${stats.level.total} ${stats.level.name.toLowerCase()} ${stats.level.total === 1 ? `${people.one} has` : `${people.many} have`} voted so far. More votes make this clearer.`
        : `${pct(stats.level.love, stats.level.total)}% of ${stats.level.name.toLowerCase()} ${people.many} love it (${stats.level.total} votes).`}</p>}
      {also.length > 0 && <div className="qv-also"><h3>{`${people.many[0].toUpperCase()}${people.many.slice(1)} who love it also love`}</h3><ul>{also.map(a =>
        <li key={a.id}><a href={a.href}>{a.name}</a><small>{`${a.fans} fans in common`}</small></li>)}</ul></div>}
      <p className="qv-next"><a href={rateHref}>{`Rate other ${plural} you've played`} <span aria-hidden="true">→</span></a><a href={addHref}>Add a sentence about why <span aria-hidden="true">→</span></a></p>
    </div>}
  </section>;
}
