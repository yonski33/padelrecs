// Traits tab (Thread, PadelRecs only; drizzle/0027): fix "How does it play?" for one racket when votes are abused. Pick a
// racket, then per group: the review-based counts (the prefill file, or the owner's override), the real votes, and the
// recent votes with time and voter key. Edit the review counts, remove a vote or every vote by one voter, reset a group,
// freeze a group or the whole racket. Every change is logged. Plain forms, no JavaScript needed.
import { count, desc, gte } from "drizzle-orm";
import { database } from "../../db/data";
import { traitVotes } from "../../db/schema";
import { traitCounts } from "../../db/thread-votes";
import { traitOverridesFor, recentTraitVotes, traitAdminHistory, overriddenRackets, ALL_GROUPS } from "../../db/trait-admin";
import { traitSeed } from "../../lib/thread/trait-seed";
import { TRAIT_GROUPS } from "../../lib/thread/traits";
import { niche, productHref } from "../../lib/niche";

type Racket = { id: string; slug: string; name: string; shape: string | null };
const MESSAGES: Record<string, string> = {
  set_counts: "Review counts saved for that group.", clear_counts: "Review counts are back to the prefill file.", freeze: "Voting frozen.", unfreeze: "Voting open again.",
  remove_vote: "Vote removed.", remove_voter: "That voter's votes were removed.", reset: "Group reset: its votes are gone and its review counts are back to the file.",
  invalid: "Could not read that request. Counts must be whole numbers.", failed: "Saving failed. Try again.",
};
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const short = (key: string) => `${key.slice(0, 10)}…`;
const label = (trait: string, choice: string) => TRAIT_GROUPS.find(g => g.key === trait)?.options.find(([k]) => k === choice)?.[1] ?? choice;
const title = (trait: string | null) => trait === ALL_GROUPS ? `Whole ${niche.words.one}` : trait ? TRAIT_GROUPS.find(g => g.key === trait)?.title ?? trait : "All groups";

function Hidden({ v }: { v: Record<string, string> }) { return <>{Object.entries(v).map(([k, x]) => <input key={k} type="hidden" name={k} value={x}/>)}</>; }
function Act({ v, children, ghost = true }: { v: Record<string, string>; children: string; ghost?: boolean }) {
  return <form method="post" action="/api/funtimes/traits" style={{ display: "inline" }}><Hidden v={v}/><button className={ghost ? "button ghost" : "button"}>{children}</button></form>;
}

export async function TraitsAdmin({ racket: id, q, result, rackets }: { racket?: string; q?: string; result?: string; rackets: Racket[] }) {
  const db = await database(), byId = new Map(rackets.map(r => [r.id, r]));
  const notice = result && MESSAGES[result] && <p role="status" className={["invalid", "failed"].includes(result) ? "form-error" : "admin-notice"}>{MESSAGES[result]}</p>;
  const search = <form method="get" action="/funtimes" className="admin-filters" style={{ gap: 8 }}><input type="hidden" name="tab" value="traits"/>
    <input name="q" defaultValue={q ?? ""} placeholder={`Search a ${niche.words.one} by name`} aria-label={`Search a ${niche.words.one}`} style={{ minWidth: 260 }}/><button className="button">Search</button></form>;
  const r = id ? byId.get(id) : undefined;
  if (!r) {
    const term = (q ?? "").trim().toLowerCase(), hits = term ? rackets.filter(x => x.name.toLowerCase().includes(term) || x.slug.includes(term)).slice(0, 40) : [];
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const busy = await db.select({ id: traitVotes.racketId, n: count() }).from(traitVotes).where(gte(traitVotes.updatedAt, since)).groupBy(traitVotes.racketId).orderBy(desc(count())).limit(15);
    const changed = await overriddenRackets(db);
    const list = (ids: { id: string; note?: string }[]) => <ul>{ids.map(x => { const rr = byId.get(x.id); return rr && <li key={x.id}><a href={`/funtimes?tab=traits&racket=${encodeURIComponent(x.id)}`}>{rr.name}</a>{x.note ? <span className="muted">{` · ${x.note}`}</span> : null}</li>; })}</ul>;
    return <>{notice}{search}
      {term && <section><h2>{`Matches for “${q}”`}</h2>{hits.length ? list(hits.map(h => ({ id: h.id }))) : <p className="admin-empty">{`No ${niche.words.one} matches.`}</p>}</section>}
      <section><h2>Most votes in the last 7 days</h2>{busy.length ? list(busy.map(b => ({ id: b.id, note: `${Number(b.n)} votes` }))) : <p className="admin-empty">No votes this week.</p>}</section>
      <section><h2>{`${niche.words.Many} with a fix or a freeze`}</h2>{changed.length ? list(changed.map(c => ({ id: c }))) : <p className="admin-empty">None yet.</p>}</section>
    </>;
  }
  const [votes, ov, recent, history] = await Promise.all([traitCounts(db, r.id), traitOverridesFor(db, r.id), recentTraitVotes(db, r.id), traitAdminHistory(db, r.id)]);
  const seed = traitSeed(niche.id, r.id), base = { racket: r.id }, allFrozen = ov.frozen.includes(ALL_GROUPS);
  const perVoter = new Map<string, number>(), perNet = new Map<string, number>();
  for (const v of recent) { perVoter.set(v.voter, (perVoter.get(v.voter) ?? 0) + 1); perNet.set(v.network, (perNet.get(v.network) ?? 0) + 1); }
  return <>{notice}{search}
    <h2><a href={productHref(r)}>{r.name}</a></h2>
    <p className="muted">{`Review counts come from db/thread/padel-traits.json (${seed?.sources ?? 0} sources) unless an override is saved. An option shows on the page at 5+ reviews and votes together.`}</p>
    <p>{allFrozen ? <><strong>{`Voting is frozen on this ${niche.words.one}. `}</strong><Act v={{ ...base, action: "unfreeze", trait: ALL_GROUPS }}>Open voting</Act></> : <Act v={{ ...base, action: "freeze", trait: ALL_GROUPS }}>Freeze voting on this racket</Act>}</p>
    <div className="admin-queue">{TRAIT_GROUPS.map(g => {
      const file = seed?.groups[g.key] ?? {}, over = ov.counts[g.key], v = votes[g.key] ?? {}, frozen = ov.frozen.includes(g.key);
      const nVotes = Object.values(v).reduce((a, b) => a + b, 0);
      return <article className="review" key={g.key}>
        <div className="review-top"><strong>{g.title}</strong>{over && <span className="admin-status">override</span>}{(frozen || allFrozen) && <span className="admin-status">frozen</span>}</div>
        <form method="post" action="/api/funtimes/traits"><Hidden v={{ ...base, action: "set_counts", trait: g.key }}/>
          <table><thead><tr><th>Option</th><th>File</th><th>Shown review count</th><th>Votes</th></tr></thead><tbody>{g.options.map(([k, l]) =>
            <tr key={k}><td>{l}</td><td>{file[k] ?? 0}</td><td><input name={`c_${k}`} type="number" min={0} max={100000} step={1} defaultValue={(over ?? file)[k] ?? 0} style={{ width: 90 }} aria-label={`${l} review count`}/></td><td>{v[k] ?? 0}</td></tr>)}</tbody></table>
          <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}><button className="button">Save review counts</button></div>
        </form>
        <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {over && <Act v={{ ...base, action: "clear_counts", trait: g.key }}>Back to file counts</Act>}
          {frozen ? <Act v={{ ...base, action: "unfreeze", trait: g.key }}>Open voting</Act> : <Act v={{ ...base, action: "freeze", trait: g.key }}>Freeze voting</Act>}
          <Act v={{ ...base, action: "reset", trait: g.key }}>{`Reset group (removes ${nVotes} ${nVotes === 1 ? "vote" : "votes"}${over ? ", clears the override" : ""})`}</Act>
        </div>
      </article>; })}</div>
    <section><h2>Recent votes</h2>
      {recent.length ? <table><thead><tr><th>Time (UTC)</th><th>Group</th><th>Choice</th><th>Voter key</th><th>Network key</th><th></th></tr></thead><tbody>{recent.map(x =>
        <tr key={`${x.voter}|${x.trait}`}><td>{when(x.at)}</td><td>{title(x.trait)}</td><td>{label(x.trait, x.choice)}</td>
          <td title={x.voter}><code>{short(x.voter)}</code>{(perVoter.get(x.voter) ?? 0) > 1 ? <span className="muted">{` · ${perVoter.get(x.voter)} here`}</span> : null}</td>
          <td title={x.network}><code>{short(x.network)}</code>{(perNet.get(x.network) ?? 0) > 9 ? <span className="muted">{` · ${perNet.get(x.network)} here`}</span> : null}</td>
          <td style={{ whiteSpace: "nowrap" }}><Act v={{ ...base, action: "remove_vote", trait: x.trait, voter: x.voter }}>Remove</Act>{" "}
            <Act v={{ ...base, action: "remove_voter", voter: x.voter, everywhere: "0" }}>All by voter here</Act>{" "}
            <Act v={{ ...base, action: "remove_voter", voter: x.voter, everywhere: "1" }}>Everywhere</Act></td></tr>)}</tbody></table>
        : <p className="admin-empty">{`No votes on this ${niche.words.one} yet.`}</p>}
    </section>
    <section><h2>Change log</h2>
      {history.length ? <ul>{history.map(h => { const d = h.detail as { votes?: unknown[]; to?: unknown; voter?: string } | null;
        return <li key={h.id}>{`${when(h.createdAt)} · ${h.action.replaceAll("_", " ")} · ${title(h.trait)}`}{d?.votes ? ` · ${d.votes.length} votes removed` : ""}{d?.to ? ` · set to ${JSON.stringify(d.to)}` : ""}{d?.voter ? ` · voter ${short(d.voter)}` : ""}</li>; })}</ul>
        : <p className="admin-empty">No changes yet.</p>}
    </section>
  </>;
}
