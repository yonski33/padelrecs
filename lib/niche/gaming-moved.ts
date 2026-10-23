// Monitors left GamingRecs for their own site, MonitorRecs, on 2026-10-23. Their pages answer with a 301 to the same
// monitor there (lib/niche/gaming.ts movedAway), so links, bookmarks and rankings carry over. Slugs are unchanged.
export const MONITORRECS = "https://www.monitorrecs.com";

/** Every monitor product page GamingRecs had at /gear/<slug>. */
export const movedMonitorSlugs = [
  "acer-nitro-xv273u-f5", "acer-predator-x27u-f5", "acer-predator-x27u-x1", "acer-predator-x32-x", "acer-predator-x34-x5", "acer-predator-x49-x",
  "alienware-aw2524hf", "alienware-aw2525hm", "alienware-aw2725df", "alienware-aw2725q", "alienware-aw2726dl", "alienware-aw2726dm",
  "alienware-aw3225qf", "alienware-aw3226q", "alienware-aw3425dw", "alienware-aw3426dw", "alienware-aw3926qw",
  "aoc-25g51z", "aoc-agon-ag276qzd2", "aoc-agon-pro-ag276qsg2", "aoc-agp277qk", "aoc-cu34g4z", "aoc-q27g3xmn", "aoc-q27g4xn",
  "asus-rog-strix-oled-xg27acdng", "asus-rog-strix-oled-xg27aqdmg", "asus-rog-strix-oled-xg27ucdmg", "asus-rog-strix-oled-xg32ucds",
  "asus-rog-strix-xg259qns", "asus-rog-strix-xg27aqngv", "asus-rog-swift-oled-pg27aqdm", "asus-rog-swift-oled-pg27aqdp",
  "asus-rog-swift-oled-pg27aqwp-w", "asus-rog-swift-oled-pg27ucdm", "asus-rog-swift-oled-pg32ucdm", "asus-rog-swift-oled-pg32ucdm3",
  "asus-rog-swift-oled-pg34wcdm", "asus-rog-swift-pro-pg248qp",
  "benq-mobiuz-ex270qm", "benq-mobiuz-ex271qz", "benq-mobiuz-ex271uz", "benq-mobiuz-ex321ux", "benq-mobiuz-ex321uz",
  "gigabyte-aorus-fo27q2", "gigabyte-aorus-fo27q3", "gigabyte-aorus-fo27q5p", "gigabyte-aorus-fo32u2", "gigabyte-aorus-fo32u2p",
  "gigabyte-mo27q28g", "gigabyte-mo34wqc2",
  "lg-ultragear-27g850a-b", "lg-ultragear-27gr95qe-b", "lg-ultragear-27gs75q-b", "lg-ultragear-27gs95qe-b", "lg-ultragear-27gx790a-b",
  "lg-ultragear-27gx790b-b", "lg-ultragear-32gs95ue-b", "lg-ultragear-32gx870a-b", "lg-ultragear-34gs95qe-b", "lg-ultragear-39gx950b-b",
  "lg-ultragear-45gs96qb-b", "lg-ultragear-45gx950b-b",
  "msi-mag-271qpx-qd-oled-e2", "msi-mag-274qrf-qd-e2", "msi-mag-341cqp-qd-oled-x28", "msi-mag-oled-271qpx32", "msi-mpg-271qr-qd-oled-x50",
  "msi-mpg-272urx-qd-oled", "msi-mpg-321urx-qd-oled", "msi-mpg-322ur-qd-oled-x24", "msi-mpg-322urx-qd-oled", "msi-mpg-341cqpx-qd-oled",
  "msi-mpg-491cqp-qd-oled",
  "samsung-odyssey-g6-g60f", "samsung-odyssey-g7-g70f", "samsung-odyssey-neo-g9-57", "samsung-odyssey-oled-g5-g50sf",
  "samsung-odyssey-oled-g6-g60sf", "samsung-odyssey-oled-g8-g80sh-27", "samsung-odyssey-oled-g8-g80sh-32", "samsung-odyssey-oled-g8-g81sf",
  "samsung-odyssey-oled-g8-g85sd", "samsung-odyssey-oled-g9-g95sd",
  "zowie-xl2540x", "zowie-xl2546x", "zowie-xl2566x", "zowie-xl2586x", "zowie-xq2566x",
];

/** Brands GamingRecs only had for their monitors; their brand pages move too. ASUS and Zowie keep mice and keyboards here. */
export const movedMonitorBrandSlugs = ["acer", "alienware", "aoc", "benq", "gigabyte", "lg", "msi", "samsung"];

export const movedMonitorPages = [
  { source: "/monitors", destination: `${MONITORRECS}/gaming-monitors` },
  { source: "/types/monitors", destination: `${MONITORRECS}/gaming-monitors` },
  // The catalogue filtered to monitors; the query string carries over, and the category page ignores "shape".
  { source: "/gear", destination: `${MONITORRECS}/gaming-monitors`, query: { key: "shape", value: "Monitor" } },
  ...movedMonitorSlugs.flatMap(slug => [
    { source: `/gear/${slug}`, destination: `${MONITORRECS}/monitors/${slug}` },
    { source: `/rackets/${slug}`, destination: `${MONITORRECS}/monitors/${slug}` },
  ]),
  ...movedMonitorBrandSlugs.map(slug => ({ source: `/brands/${slug}`, destination: `${MONITORRECS}/brands/${slug}` })),
];
