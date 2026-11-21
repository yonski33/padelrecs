import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { firstLine, homeQuestions, questionsOf, QUESTIONS_MIN, sortQuestions, type QComment } from "../lib/thread/questions";
import { threadPath } from "../lib/thread/look";

const R = new Map([["a", { id: "a", name: "Head Extreme Motion (2026)", href: "/rackets/a", pic: null }], ["b", { id: "b", name: "Kuikma Hybrid Pro (2026)", href: "/rackets/b", pic: null }]]);
const c = (id: string, page: string, body: string, at: string, parentId: string | null = null, score = 0): QComment => ({ id, page: `racket:${page}`, parentId, alias: id.toUpperCase(), body, at, score });

test("questions: top-level posts that read as questions, with racket, answers and the top answer", () => {
  const list = [c("q1", "a", "Is it too harsh for a touchy elbow?", "2026-11-01"), c("r1", "a", "Fine with an overgrip. Demo it first.", "2026-11-03", "q1", 2),
    c("r2", "a", "It is firm.", "2026-11-02", "q1", 5), c("t1", "a", "Two overgrips helped me.", "2026-11-04"),
    c("q2", "b", "How heavy is it?", "2026-11-05"), c("q3", "zzz", "Anyone tried it?", "2026-11-06")];
  const qs = questionsOf(list, R);
  assert.deepEqual(qs.map(q => q.id), ["q1", "q2"]); // no plain post, no racket we don't list
  assert.equal(qs[0].answers, 2);
  assert.deepEqual(qs[0].top, { alias: "R2", line: "It is firm." });
  assert.equal(qs[0].activity, "2026-11-03"); // a new answer bumps it
  assert.equal(firstLine("Fine with an overgrip. Demo it first."), "Fine with an overgrip.");
});

test("home order: up to 2 unanswered pinned, then newest activity; /questions sorts", () => {
  const q = (id: string, activity: string, answers: number) => ({ id, racket: R.get("a")!, alias: id, body: "?", at: activity, activity, answers, top: null });
  const qs = [q("a", "2026-11-10", 3), q("b", "2026-11-09", 0), q("c", "2026-11-08", 0), q("d", "2026-11-07", 0), q("e", "2026-11-11", 1)];
  assert.deepEqual(homeQuestions(qs).map(x => x.id), ["b", "c", "e", "a", "d"]);
  assert.deepEqual(sortQuestions(qs, "answers").map(x => x.id), ["a", "e", "b", "c", "d"]);
  assert.equal(QUESTIONS_MIN, 3);
});

test("/questions is a padel Thread page; the home places the section after the latest reviews", () => {
  assert.equal(threadPath("/questions", undefined, "padel"), "/thread/questions");
  assert.notEqual(threadPath("/questions", undefined, "pickleball"), "/thread/questions");
  const home = readFileSync("app/thread/page.tsx", "utf8");
  assert.ok(home.indexOf("<LatestQuestions") > home.indexOf('<Feed key="fd"'));
  const files = ["app/thread/latest-questions.tsx", "app/thread/question-row.tsx", "app/thread/live/ask-question.tsx", "app/thread/live/question-list.tsx", "app/thread/questions/page.tsx"]
    .map(f => readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")).join("\n");
  for (const t of ["Latest questions from the community", "Anyone can ask, players answer", "See all questions →", "Ask a question about any racket…",
    "No answers yet · Answer first ›", "Questions from the community", "Unanswered", "Most answers"]) assert.ok(files.includes(t), t);
  assert.doesNotMatch(files, /—|\bowners?\b|\bverdict\b/i);
});
