import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAttribution } from "../lib/voice";
import page from "../db/racket-page/padel.json";
import card from "../db/fit-card/padel.json";
import lines from "../db/lines/padel.json";
import short from "../db/short/padel.json";

test("voice check: who-said-it wording is caught, plain statements and audiences are not", () => {
  for (const t of ["Players say it needs a strong arm.", "A few players got elbow pain.", "One player calls it great.", "14 players mention it.",
    "Players with sore elbows say ==it suits them==.", "Players see it as a racket for advanced players.", "Testers call it the most powerful Vertex.", "Six still say it lacks power.", "Five say it feels top-heavy."])
    assert.ok(hasAttribution(t), t);
  for (const t of ["For attacking players who finish points overhead.", "Easy racket with a big sweet spot.", "Splits opinion: some find it stiff, others crisp.",
    "Comfortable even with tennis elbow.", "A racket for experienced players, not beginners."])
    assert.ok(!hasAttribution(t), t);
});

// Owner 2026-11-16: advice reads as the expert's statement; who said it lives in the Reviews and the evidence lines.
test("padel advice copy says things plainly (no 'players say' inside the advice)", () => {
  const bad: string[] = [];
  for (const [slug, e] of Object.entries(page as Record<string, { tagline: string; bottom: string; yes: { t: string }[]; no: { t: string }[] }>)) {
    for (const t of [e.tagline, e.bottom, ...e.yes.map(x => x.t), ...e.no.map(x => x.t)]) if (hasAttribution(t)) bad.push(`${slug}: ${t}`);
  }
  type Line = { t: string; alt?: { t: string } };
  for (const [slug, e] of Object.entries(card as Record<string, { strengths?: Line[]; catches?: Line[] }>)) {
    // A racket with page content shows only the card's try-instead line; one without shows its lines in the match box.
    const shown = !(slug in (page as object));
    for (const l of [...(e.strengths ?? []), ...(e.catches ?? [])]) {
      if (shown && hasAttribution(l.t)) bad.push(`${slug} (card): ${l.t}`);
      if (l.alt && hasAttribution(l.alt.t)) bad.push(`${slug} (try instead): ${l.alt.t}`);
    }
  }
  for (const [slug, t] of [...Object.entries(lines as Record<string, string>), ...Object.entries(short as Record<string, string>)]) if (hasAttribution(t)) bad.push(`${slug} (one-liner): ${t}`);
  assert.deepEqual(bad, []);
});
