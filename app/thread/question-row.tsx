// One question row (PadelRecs "Latest questions" and /questions, owner OK 2026-11-21), in the community feed's post look
// (#605): avatar, QUESTION chip, author, level/side tag, time, the racket chip, the question, and the top answer as
// "Name: first line"; on the right "N answers · Read ›" or "No answers yet · Answer first ›" (the racket page opens the
// reply box: #reply-<id>, feed-v7b.tsx). No hooks and no server imports, so the home and the client list share it.
import { th } from "../../lib/thread/look";
import { avatarOf } from "../../lib/thread/avatar";
import { commenterName } from "../../lib/thread/display-name";
import type { Question } from "../../lib/thread/questions";
import { Ago } from "./live/ago";
import { ago } from "./ui";

export function QuestionRow({ q, now }: { q: Question; now: number }) {
  const who = commenterName(q.alias), a = avatarOf(who);
  const go = q.answers > 0 ? th(`${q.racket.href}#cm-${q.id}`) : th(`${q.racket.href}#reply-${q.id}`);
  return <article className="th7-cm thq-row">
    <span className="th7-av" style={{ background: a.bg }} aria-hidden="true">{a.init}</span>
    <div className="th7-cm-body">
      <div className="th7-cm-head"><span className="th-flair question">Question</span><strong>{who}</strong>
        {q.info && <span className="th-rv-info">{q.info}</span>}<span><Ago at={q.at} initial={ago(q.at, now)}/></span></div>
      <a className="thq-racket" href={th(q.racket.href)}>{q.racket.pic && <img src={q.racket.pic} alt="" loading="lazy"/>}{q.racket.name}</a>
      <p className="th7-cm-text">{q.body}</p>
      {q.top && <p className="thq-top"><b>{`${commenterName(q.top.alias)}:`}</b>{` ${q.top.line}`}</p>}
    </div>
    <a className={`thq-go${q.answers ? "" : " none"}`} href={go}>
      {q.answers > 0 ? `${q.answers} ${q.answers === 1 ? "answer" : "answers"} · Read ›` : "No answers yet · Answer first ›"}</a>
  </article>;
}
