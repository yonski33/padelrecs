import "./score-tags.css";
import { newLine } from "../lib/score-view";

/** In place of a score under 10 reviews (lib/score-view.ts). */
export const NewPill = ({ n }: { n: number }) => <span className="sv-new" title="Too few reviews for a score yet">{newLine(n)}</span>;
/** Beside a score resting on 10–19 reviews. */
export const EarlyTag = () => <small className="sv-early" title="An early score: fewer than 20 reviews so far">early</small>;
