"use client";
// Level and Side next to the name on the Thread review and comment boxes (owner 2026-11-19): two compact one-tap choices, both
// optional, tap again to clear. Remembered on this device with the name, in the profile the quick vote already keeps
// (app/quick-vote.ts "rv-profile"), so a vote, a review and a comment all carry the same answers.
import { LEVEL_PICKS, SIDE_PICKS } from "../../../lib/thread/display-name";
import { loadProfile, saveProfile } from "../../quick-vote";

export type LevelSideValue = { level: string; side: string };
export const NO_LEVEL_SIDE: LevelSideValue = { level: "", side: "" };
const known = (v: string | undefined, of: readonly string[]) => v && of.includes(v) ? v : "";
/** This device's last answers ("" when none, or one the boxes don't offer, such as "Competitive"). */
export function savedLevelSide(): LevelSideValue {
  const p = loadProfile();
  return { level: known(p.level, LEVEL_PICKS), side: known(p.side, SIDE_PICKS) };
}
/** Kept with the name when a post goes out; a cleared choice is cleared here too. The style answer stays as it was. */
export function saveLevelSide(v: LevelSideValue) {
  const p = loadProfile();
  saveProfile({ ...p, level: v.level || undefined, side: v.side || undefined });
}

export function LevelSide({ value, set, small, label = true }: { value: LevelSideValue; set: (v: LevelSideValue) => void; small?: boolean; label?: boolean }) {
  const group = (key: "level" | "side", title: string, opts: readonly string[]) =>
    <span className="th-ls-group" role="group" aria-label={title}>
      {label && <span className="th-ls-lbl">{title}</span>}
      {opts.map(o => <button key={o} type="button" className={`th-pick ${small ? "xs" : "sm"}`} aria-pressed={value[key] === o}
        onClick={() => set({ ...value, [key]: value[key] === o ? "" : o })}>{o}</button>)}
    </span>;
  return <span className={`th-ls${small ? " small" : ""}`}>{group("level", "Level", LEVEL_PICKS)}{group("side", "Side", SIDE_PICKS)}</span>;
}
