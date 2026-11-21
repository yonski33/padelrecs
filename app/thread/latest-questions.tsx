// PadelRecs home "Latest questions from the community" (owner OK 2026-11-21), right after Latest player reviews: the ask box,
// then up to 5 questions (2 unanswered pinned first, then newest activity) and "See all questions →". Hidden under 3
// questions site-wide. Its own server component, loading its own data, so the home only places it.
import { th } from "../../lib/thread/look";
import { homeQuestions, QUESTIONS_MIN } from "../../lib/thread/questions";
import { threadQuestions } from "./questions-data";
import { threadRows } from "./data";
import { niche } from "../../lib/niche";
import { questionWords } from "../../lib/thread/sites";
import { W } from "../../lib/thread/words";
import { QuestionRow } from "./question-row";
import { AskQuestion, type AskRacket } from "./live/ask-question";

/** The ask box's racket list: each model's current row (the catalogue's rule). */
export async function askRackets(): Promise<AskRacket[]> {
  const { all } = await threadRows();
  return all.filter(r => r.current !== false).map(r => ({ id: r.id, name: r.name, href: r.href, pic: r.pic })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function LatestQuestions() {
  const qs = await threadQuestions();
  if (qs.length < QUESTIONS_MIN) return null;
  const [rackets, now] = [await askRackets(), Date.now()];
  return <section className="th-card thq-sec" aria-labelledby="thq-h">
    <div className="thq-head"><h2 id="thq-h" className="th-h2">Latest questions from the community</h2>
      <p className="th-sub">{`Anyone can ask, ${W.people} answer`}</p></div>
    <AskQuestion rackets={rackets} words={questionWords(niche.id)}/>
    <div className="thq-list">{homeQuestions(qs).map(q => <QuestionRow key={q.id} q={q} now={now}/>)}</div>
    <a className="thq-all" href={th("/questions")}>See all questions →</a>
  </section>;
}
