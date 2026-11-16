// The positive / mixed / negative bar (app/visual.tsx re-exports it). A module of its own with no server imports, so a
// browser-rendered row (app/light-row-view.tsx) uses the same markup.
export function SentimentBar({ positive, mixed, negative, legend = false, className = "" }: { positive: number; mixed: number; negative: number; legend?: boolean | "counts"; className?: string }) {
  const total = positive + mixed + negative;
  if (!total) return null;
  // Counts, never shares (owner 2026-11-15: no "% positive" anywhere; a share reads like a second score).
  const label = `${positive} positive, ${mixed} mixed, ${negative} negative`;
  return <span className={`sbar ${className}`}>
    <span className="sbar-track" role="img" aria-label={label}>
      {positive > 0 && <i className="s-positive" style={{ width: `${positive / total * 100}%` }}/>}
      {mixed > 0 && <i className="s-mixed" style={{ width: `${mixed / total * 100}%` }}/>}
      {negative > 0 && <i className="s-negative" style={{ width: `${negative / total * 100}%` }}/>}
    </span>
    {legend ? <span className="sbar-legend sbar-counts" aria-hidden="true">
      <span className="s-positive"><b>{positive.toLocaleString("en-US")}</b> positive</span>
      <span className="s-mixed"><b>{mixed.toLocaleString("en-US")}</b> mixed</span>
      <span className="s-negative"><b>{negative.toLocaleString("en-US")}</b> negative</span></span> : null}
  </span>;
}
