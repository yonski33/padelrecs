"use client";
// /questions (PadelRecs, owner OK 2026-11-21): every question with All · Unanswered and Newest activity · Most answers, here in
// the browser (instant), 20 at a time with Show more.
import { useMemo, useState } from "react";
import { sortQuestions, type Question } from "../../../lib/thread/questions";
import { QuestionRow } from "../question-row";

const STEP = 20;
export function QuestionList({ qs, now }: { qs: Question[]; now: number }) {
  const [only, setOnly] = useState<"all" | "open">("all"), [by, setBy] = useState<"new" | "answers">("new"), [shown, setShown] = useState(STEP);
  const list = useMemo(() => sortQuestions(only === "open" ? qs.filter(q => q.answers === 0) : qs, by), [qs, only, by]);
  return <>
    <div className="th-feed-bar">
      <div className="th7-chipset" role="group" aria-label="Show">{([["all", "All"], ["open", "Unanswered"]] as const).map(([k, l]) =>
        <button key={k} type="button" aria-pressed={only === k} onClick={() => { setOnly(k); setShown(STEP); }}>{l}</button>)}</div>
      <div className="th-seg" role="group" aria-label="Sort"><span className="lbl">Sort</span>{([["new", "Newest activity"], ["answers", "Most answers"]] as const).map(([k, l]) =>
        <button key={k} type="button" aria-pressed={by === k} onClick={() => setBy(k)}>{l}</button>)}</div>
    </div>
    <div className="thq-list">{list.slice(0, shown).map(q => <QuestionRow key={q.id} q={q} now={now}/>)}
      {list.length === 0 && <p className="th-empty">{only === "open" ? "Every question has an answer right now." : "No questions yet. Ask the first one."}</p>}</div>
    {list.length > shown && <button type="button" className="th-btn th-center" onClick={() => setShown(s => s + STEP)}>Show more questions</button>}
  </>;
}
