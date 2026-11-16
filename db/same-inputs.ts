// Derived data worked out again only when its inputs change (2026-11-16, disc golf speed fix): the catalogue and the match
// context are kept per server instance (db/keep.ts), so the same copy means the same data, and the signals, rankings and
// home payload built from them can be reused instead of redone on every page. After an admin write the kept copies are
// new objects, so these rebuild on their own.

/** `build`, rerun only when one of its inputs is a different object from last time. */
export function sameInputs<A extends readonly unknown[], R>(build: (...inputs: A) => R): (...inputs: A) => R {
  let last: { inputs: A; value: R } | null = null;
  return (...inputs: A) => {
    if (last && last.inputs.length === inputs.length && last.inputs.every((x, i) => x === inputs[i])) return last.value;
    const value = build(...inputs);
    last = { inputs, value };
    return value;
  };
}
