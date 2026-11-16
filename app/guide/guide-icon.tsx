/** Icons for guide options (`icon` in a niche's guide config) and the home row. Add a niche's own here; an unknown name
 *  draws nothing. Padel's: the racket head per shape. */
const FILL = { fill: "oklch(0.95 0.06 130)", stroke: "currentColor", strokeWidth: 2.5 };
const PB = { style: { fill: "var(--site-acc, oklch(0.95 0.06 130))" }, stroke: "currentColor", strokeWidth: 2.5 };
const ICONS: Record<string, React.ReactNode> = {
  round: <circle cx="24" cy="28" r="20" {...FILL}/>,
  teardrop: <path d="M24 6c11 0 18 9 17 21-1 13-8 23-17 23S8 40 7 27C6 15 13 6 24 6z" {...FILL}/>,
  hybrid: <ellipse cx="24" cy="28" rx="19" ry="22" {...FILL}/>,
  diamond: <path d="M24 4l20 24-20 24L4 28z" {...FILL} strokeLinejoin="round"/>,
  // Pickleball (owner's mock): a paddle face in the site accent over a short ink handle, per shape.
  standard: <><rect x="5" y="3" width="38" height="40" rx="12" {...PB}/><rect x="19" y="43" width="10" height="12" rx="3" fill="currentColor"/></>,
  elongated: <><rect x="9" y="1" width="30" height="46" rx="10" {...PB}/><rect x="19" y="47" width="10" height="8" rx="3" fill="currentColor"/></>,
  "hybrid-paddle": <><rect x="7" y="2" width="34" height="43" rx="12" {...PB}/><rect x="19" y="45" width="10" height="10" rx="3" fill="currentColor"/></>,
};

export function GuideIcon({ name }: { name?: string }) {
  const icon = name ? ICONS[name] : undefined;
  return icon ? <svg className="gd-icon" viewBox="0 0 48 56" width="48" height="56" aria-hidden="true">{icon}</svg> : null;
}
