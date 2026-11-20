// Accounts tab (Thread, PadelRecs only; optional player accounts, drizzle/0028): every reserved name with its email, post
// counts and status. Rename (the new name shows on all its posts), block (the name stays reserved, posting stops) or unblock,
// and delete (frees the name, removes the email and sign-in; the posts stay without the mark unless "remove posts" is ticked).
// Plain forms, no JavaScript.
import { adminAccounts } from "../../db/accounts";
import { database } from "../../db/data";
import { niche } from "../../lib/niche";

const MESSAGES: Record<string, string> = { renamed: "Account renamed. The new name shows on its posts.", blocked: "Account blocked: it can't post, and its name stays reserved.",
  unblocked: "Account unblocked.", deleted: "Account deleted. Its name is free again.", "deleted-keep-auth": "Account deleted, but its sign-in could not be removed: delete the user in Supabase Auth.",
  taken: "Another account has that name.", invalid: "Could not save that. A name needs 2 to 24 characters, no links, no staff-like names.", confirm: "Tick the box to confirm the delete.",
  stale: "That account wasn't found. Reload to see the list.", admin: "That is the owner's sign-in: it can't be deleted here.", failed: "Saving failed. Try again.", missing: "The accounts table isn't there yet (migration 0028 not run)." };
const BAD = ["taken", "invalid", "confirm", "stale", "admin", "failed", "missing", "deleted-keep-auth"];

type Data = Awaited<ReturnType<typeof adminAccounts>>;
export async function AccountsAdmin({ result, q = "" }: { result?: string; q?: string }) {
  let data: Data | null = null;
  try { data = await adminAccounts(await database(), q); } catch { data = null; }
  return <AccountsList data={data} result={result} q={q}/>;
}
/** The tab's markup for a list (null: the table isn't there yet). */
export function AccountsList({ data, result, q = "" }: { data: Data | null; result?: string; q?: string }) {
  const Hidden = ({ v }: { v: Record<string, string> }) => <>{Object.entries(v).map(([k, x]) => <input key={k} type="hidden" name={k} value={x}/>)}</>;
  const shown = result ?? (data ? undefined : "missing");
  return <>
    {shown && MESSAGES[shown] && <p role="status" className={BAD.includes(shown) ? "form-error" : "admin-notice"}>{MESSAGES[shown]}</p>}
    <p className="muted">{`${niche.people.Many} who signed in with an email link and reserved a name${data ? ` (${data.total} in all)` : ""}. Guests can't post with these names.`}</p>
    <form method="get" action="/funtimes" className="admin-filters admin-find" style={{ gap: 8, alignItems: "center" }}><input type="hidden" name="tab" value="accounts"/>
      <input name="q" defaultValue={q} placeholder="Name" aria-label="Find an account"/><button className="button">Find</button>{q && <a href="/funtimes?tab=accounts">Clear</a>}</form>
    <div className="admin-queue">{(data?.rows ?? []).map(a => <article className="review" key={a.id}>
      <div className="review-top"><strong>{a.name}</strong><span className="admin-status">{a.status}</span><span className="muted">{`since ${new Date(a.createdAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}`}</span></div>
      <p className="muted">{[a.email ?? "email hidden", a.level, a.side && (niche.id === "skin" ? a.side : `${a.side} side`), `${a.reviews} ${a.reviews === 1 ? "review" : "reviews"}`, `${a.comments} ${a.comments === 1 ? "comment" : "comments"}`].filter(Boolean).join(" · ")}</p>
      <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
        <details><summary className="button ghost">Rename</summary>
          <form method="post" action="/api/funtimes/accounts" style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}><Hidden v={{ action: "rename", id: a.id, q }}/>
            <input name="name" defaultValue={a.name} minLength={2} maxLength={24} required aria-label="New name"/><button className="button">Save name</button></form></details>
        <form method="post" action="/api/funtimes/accounts"><Hidden v={{ action: a.status === "blocked" ? "unblock" : "block", id: a.id, q }}/>
          <button className="button ghost">{a.status === "blocked" ? "Unblock" : "Block"}</button></form>
        <details><summary className="button ghost">Delete</summary>
          <form method="post" action="/api/funtimes/accounts" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}><Hidden v={{ action: "delete", id: a.id, q }}/>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="posts" value="remove"/>Also delete its reviews and comments</label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="confirm" value="yes" required/>Yes, delete this account and its sign-in</label>
            <button className="danger-button">Delete account</button></form></details>
      </div>
    </article>)}
      {data && !data.rows.length && <p className="admin-empty">{q ? "No accounts match." : "No accounts yet."}</p>}</div>
  </>;
}
