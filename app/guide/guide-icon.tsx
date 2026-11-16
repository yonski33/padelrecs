/** Icons for guide options (`icon` in a niche's guide config) and the home row. Add a niche's own here; an unknown name
 *  draws nothing. Padel's: the racket head per shape. */
const FILL = { fill: "oklch(0.95 0.06 130)", stroke: "currentColor", strokeWidth: 2.5 };
const PB = { style: { fill: "var(--site-wash-line, oklch(0.95 0.06 130))" }, stroke: "currentColor", strokeWidth: 2.5 };
const ICONS: Record<string, React.ReactNode> = {
  round: <circle cx="24" cy="28" r="20" {...FILL}/>,
  teardrop: <path d="M24 6c11 0 18 9 17 21-1 13-8 23-17 23S8 40 7 27C6 15 13 6 24 6z" {...FILL}/>,
  hybrid: <ellipse cx="24" cy="28" rx="19" ry="22" {...FILL}/>,
  diamond: <path d="M24 4l20 24-20 24L4 28z" {...FILL} strokeLinejoin="round"/>,
  // Pickleball paddle faces per shape, in the site's own wash.
  elongated: <rect x="12" y="2" width="24" height="52" rx="8" {...PB}/>,
  standard: <rect x="8" y="7" width="32" height="44" rx="10" {...PB}/>,
  wide: <rect x="4" y="11" width="40" height="40" rx="11" {...PB}/>,
};

export function GuideIcon({ name }: { name?: string }) {
  const icon = name ? ICONS[name] : undefined;
  return icon ? <svg className="gd-icon" viewBox="0 0 48 56" width="48" height="56" aria-hidden="true">{icon}</svg> : null;
}
