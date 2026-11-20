"use client";
// StackRecs catalogue: Build and Grow tabs, category chips, a search box and sort, all in the browser on the rows the server
// sent (lib/niche/README.md "Filters and picks are client-side"). The tab and category live in the address (?side=, ?cat=)
// through app/instant-view.ts.
import { useEffect, useMemo, useState } from "react";
import { useInstantView } from "../../../instant-view";
import { Row, type ThreadRow } from "../../ui";
import { CATEGORIES, type Side } from "../../../../lib/stack/catalog";

type View = { side: Side; cat: string | null };
const read = (q: URLSearchParams): View => {
  const side: Side = q.get("side") === "grow" ? "grow" : "build";
  const cat = (CATEGORIES[side] as readonly string[]).find(c => c === q.get("cat")) ?? null;
  return { side, cat };
};
const href = (v: View) => { const q = new URLSearchParams(); if (v.side !== "build") q.set("side", v.side); if (v.cat) q.set("cat", v.cat);
  const s = q.toString(); return s ? `/tools?${s}` : "/tools"; };
const TAB: Record<Side, [string, string]> = { build: ["Build", "Coding agents and app builders"], grow: ["Grow", "SEO, content and AI visibility tools"] };

export function StackCatalog({ rows }: { rows: (ThreadRow & { side: Side })[] }) {
  const [v, set] = useInstantView<View>({ side: "build", cat: null }, read, href, "replace");
  const [q, setQ] = useState(""), [sort, setSort] = useState<"score" | "reviews" | "name">("score");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const x = read(new URLSearchParams(location.search)); if (href(x) !== "/tools") set(x); const q = new URLSearchParams(location.search).get("q"); if (q) setQ(q); }, []);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const side = rows.filter(r => r.side === v.side);
  const list = useMemo(() => side.filter(r => (!v.cat || r.shape === v.cat) && words.every(w => `${r.name} ${r.brand}`.toLowerCase().includes(w)))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "reviews" ? b.n - a.n || a.name.localeCompare(b.name)
      : (b.score ?? -1) - (a.score ?? -1) || b.n - a.n || a.name.localeCompare(b.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [rows, v, q, sort]);
  return <main className="th-main"><div className="th-col" style={{ maxWidth: "none" }}>
    <section className="th-card th-hero">
      <h1 className="th-h1">All tools</h1>
      <div className="th-tabs" role="group" aria-label="Build or grow">{(["build", "grow"] as const).map(s =>
        <button key={s} type="button" aria-pressed={v.side === s} onClick={() => set({ side: s, cat: null })}>
          {TAB[s][0]}<span>{rows.filter(r => r.side === s).length}</span></button>)}</div>
      <p className="th-lead">{TAB[v.side][1]}</p>
      <div className="th-rv-chips" role="group" aria-label="Category">{[null, ...CATEGORIES[v.side]].map(c => { const n = c ? side.filter(r => r.shape === c).length : side.length;
        return <button key={c ?? "all"} type="button" className="th-chipf" aria-pressed={v.cat === c}
          onClick={() => set({ side: v.side, cat: c })}>{c ?? "All"}{n > 0 && <span>{n}</span>}</button>; })}</div>
      <label className="vh" htmlFor="th-cq">Search by name or maker</label>
      <input id="th-cq" className="th-input" style={{ fontSize: 15, padding: "8px 12px" }} value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or maker"/>
    </section>
    <section className="th-card th-list">
      <div className="th-active">
        <span className="res">{`${list.length} ${list.length === 1 ? "tool" : "tools"}`}</span>
        <span className="th-seg th-push" role="group" aria-label="Sort"><span className="lbl">Sort</span>
          {([["score", "By score"], ["reviews", "Most reviewed"], ["name", "A to Z"]] as const).map(([k, l]) =>
            <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</span>
      </div>
      {list.map(r => <Row key={r.id} r={r} badgeLabel="score"/>)}
      {list.length === 0 && <p className="th-empty">No tools match. <button type="button" onClick={() => { setQ(""); set({ side: v.side, cat: null }); }}>Show all</button></p>}
    </section>
  </div></main>;
}
