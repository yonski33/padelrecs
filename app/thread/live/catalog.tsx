"use client";
// The Thread catalogue (Rackets Thread): search, the filter column (Shape, Level, Feel, Brand, Arm friendly; counts of 5+),
// active chips, Clear all, sort and Load more, all in the browser on the rows the server sent.
import { useEffect, useMemo, useState } from "react";
import { Row, cap, type ThreadRow } from "../ui";
import { usePicks, usePayload, complete, pctsFor } from "./picks";

type Key = "shape" | "level" | "feel" | "brand" | "arm";
type Filters = Partial<Record<Key, string[]>>;
const STEP = 20;

export function Catalog({ rows, brands }: { rows: ThreadRow[]; brands: string[] }) {
  const [q, setQ] = useState(""), [f, setF] = useState<Filters>({}), [sort, setSort] = useState<"score" | "reviews" | "new" | "match">("score");
  const [open, setOpen] = useState(false), [panel, setPanel] = useState(false), [n, setN] = useState(STEP);
  const [picks] = usePicks(); const on = complete(picks), payload = usePayload(on);
  const pcts = useMemo(() => on && payload ? pctsFor(payload, picks) : null, [on, payload, picks]);
  // The header search sends ?q=: read it once from the address (no useSearchParams: tests/instant-views.test.ts).
  useEffect(() => { const v = new URLSearchParams(location.search).get("q"); if (v) setQ(v); }, []);
  const shapes = useMemo(() => [...new Set(rows.map(r => r.shape).filter((x): x is string => !!x))].sort((a, b) => rows.filter(r => r.shape === b).length - rows.filter(r => r.shape === a).length).slice(0, 5), [rows]);
  const GROUPS: [Key, string, string[]][] = [["shape", "Shape", shapes], ["level", "Level", ["Beginner", "Intermediate", "Advanced"]], ["feel", "Feel", ["Soft", "Medium", "Hard"]], ["brand", "Brand", brands], ["arm", "Comfort", ["Arm friendly"]]];
  const test = (r: ThreadRow, k: Key, v: string) => k === "shape" ? r.shape === v : k === "level" ? r.levels.includes(v.toLowerCase() as ThreadRow["levels"][number]) : k === "feel" ? r.feel === v : k === "brand" ? r.brand === v : r.arm;
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const pass = (r: ThreadRow, skip?: Key) => words.every(w => r.name.toLowerCase().includes(w)) && GROUPS.every(([k]) => k === skip || !f[k]?.length || f[k]!.some(v => test(r, k, v)));
  const toggle = (k: Key, v: string) => { setN(STEP); setF(x => { const cur = x[k] ?? []; return { ...x, [k]: cur.includes(v) ? cur.filter(y => y !== v) : [...cur, v] }; }); };
  const any = words.length > 0 || Object.values(f).some(v => v?.length);
  const clear = () => { setF({}); setQ(""); setN(STEP); };
  const by = sort === "match" && !pcts ? "score" : sort;
  const list = useMemo(() => rows.filter(r => pass(r)).sort((a, b) => by === "reviews" ? b.n - a.n : by === "new" ? b.year - a.year || (b.score ?? -1) - (a.score ?? -1)
    : by === "match" ? (pcts!.get(b.id) ?? -1) - (pcts!.get(a.id) ?? -1) : (b.score ?? -1) - (a.score ?? -1) || b.n - a.n),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [rows, f, q, by, pcts]);
  const SORTS = [["score", "By player score"], ["reviews", "Most reviewed"], ["new", "Newest models"], ...(pcts ? [["match", "By your match"]] : [])] as [typeof sort, string][];
  const groups = <>{GROUPS.map(([k, label, vals]) => <div key={k} className="th-fgroup"><span>{label}</span>
    <div className="th-fopts">{vals.map(v => { const c = rows.filter(r => pass(r, k) && test(r, k, v)).length, sel = !!f[k]?.includes(v);
      return (c > 0 || sel) && <button key={v} type="button" className="th-fopt" aria-pressed={sel} onClick={() => toggle(k, v)}>{v}{c >= 5 && <span>{c}</span>}</button>; })}</div></div>)}</>;
  return <main className="th-main">
    <aside className="th-filters"><section className="th-card th-fpanel">
      <span className="th-head-row" style={{ alignItems: "center" }}><span className="th-stitle">Filters</span>{any && <button type="button" className="th-clear" onClick={clear}>Clear all</button>}</span>
      {groups}
    </section></aside>
    <div className="th-col">
      <section className="th-card th-hero">
        <h1 className="th-h1">All padel rackets</h1>
        <p className="th-lead">Every racket players have reviewed. Filter by how it plays, then see what people say.</p>
        <label className="vh" htmlFor="th-cq">Search by name or brand</label>
        <input id="th-cq" className="th-input" style={{ fontSize: 15, padding: "8px 12px" }} value={q} onChange={e => { setQ(e.target.value); setN(STEP); }} placeholder="Search by name or brand"/>
        <button type="button" className="th-btn th-fbtn" style={{ alignSelf: "flex-start" }} aria-expanded={panel} onClick={() => setPanel(p => !p)}>
          {`Filters${Object.values(f).flat().length ? ` (${Object.values(f).flat().length})` : ""}`}<small aria-hidden="true">{panel ? "▲" : "▼"}</small></button>
        {panel && <div className="th-fpanel th-fbtn" style={{ padding: 0, flexDirection: "column" }}>{groups}</div>}
      </section>
      <section className="th-card th-list">
        <div className="th-active">
          <span className="res">{`${list.length.toLocaleString("en-US")} ${list.length === 1 ? "racket" : "rackets"}`}</span>
          {(Object.entries(f) as [Key, string[]][]).flatMap(([k, vs]) => vs.map(v => <button key={k + v} type="button" className="th-achip" onClick={() => toggle(k, v)} aria-label={`Remove ${v}`}>{cap(v)}<span aria-hidden="true">×</span></button>))}
          {any && <button type="button" className="th-clear" onClick={clear}>Clear all</button>}
          <span className="th-sort th-push"><span className="lbl">Sort</span>
            <span className="th-dd right"><button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>{SORTS.find(([k]) => k === by)?.[1]}<small aria-hidden="true">{open ? "▲" : "▼"}</small></button>
              {open && <div className="th-dd-menu" role="menu">{SORTS.map(([k, l]) => <button key={k} type="button" role="menuitemradio" aria-checked={by === k} onClick={() => { setSort(k); setOpen(false); }}>{l}<span aria-hidden="true">{by === k ? "✓" : ""}</span></button>)}</div>}
            </span></span>
        </div>
        {list.slice(0, n).map(r => <Row key={r.id} r={r} {...(pcts ? { badge: pcts.get(r.id) ?? null, badgeLabel: "your match", pct: true } : {})}/>)}
        {list.length === 0 && <p className="th-empty">No rackets match these filters. <button type="button" onClick={clear}>Clear all</button></p>}
        {list.length > n && <button type="button" className="th-btn th-center" style={{ margin: "6px 0 10px" }} onClick={() => setN(x => x + STEP * 2)}>Load more</button>}
      </section>
    </div>
  </main>;
}
