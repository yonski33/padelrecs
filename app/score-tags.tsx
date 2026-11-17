import "./score-tags.css";
import { newLine } from "../lib/score-view";

/** In place of a score under 10 reviews (lib/score-view.ts). */
export const NewPill = ({ n }: { n: number }) => <span className="sv-new" title="Too few reviews for a score yet">{newLine(n)}</span>;
