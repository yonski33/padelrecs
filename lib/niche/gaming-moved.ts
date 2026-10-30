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

// Keyboards left GamingRecs for their own site, KeyboardRecs, on 2026-10-30. Same idea: slugs are unchanged, and KeyboardRecs
// files each keyboard under its own category page (/rapid-trigger-keyboards/wooting-80he).
export const KEYBOARDRECS = "https://www.keyboardrecs.com";

/** Every keyboard GamingRecs had, by its category page on KeyboardRecs. */
export const movedKeyboardSlugs: Record<string, string[]> = {
  "rapid-trigger-keyboards": [
    "asus-rog-azoth-96-he", "asus-rog-azoth-96-he-lite", "asus-rog-falcata", "asus-rog-falchion-ace-75-he",
    "asus-rog-falchion-ace-hfx", "corsair-clipper-pro-mini-60", "corsair-k70-pro-tkl", "corsair-vanguard-pro-96",
    "drunkdeer-a75-pro", "drunkdeer-a75-ultra", "drunkdeer-g75", "ducky-one-x-mini-wireless", "ducky-one-x-wireless",
    "endgame-gear-kb65he", "endgame-gear-kb65he-8k", "glorious-gmmk-3-he", "glorious-gmmk-3-pro-he",
    "glorious-gmmk-3-pro-he-wireless", "hyperx-origins-2-pro-65", "keychron-k2-he", "keychron-k6-he", "keychron-k8-he",
    "keychron-q1-he", "keychron-q1-he-8k", "keychron-q3-he-8k", "keychron-q5-he-8k", "lemokey-l1-he", "lemokey-p1-he",
    "logitech-g-pro-x-tkl-rapid", "logitech-g-pro-x2-rapid", "logitech-g512-x-75", "logitech-g512-x-98",
    "logitech-g515-rapid-tkl", "pulsar-pcmk-2-he-tkl", "pulsar-pcmk-3-he-60", "pulsar-pcmk-3-he-tkl",
    "razer-huntsman-v3-he-magnetic-mini-65-8khz", "razer-huntsman-v3-he-magnetic-tenkeyless-8khz", "razer-huntsman-v3-pro",
    "razer-huntsman-v3-pro-8khz", "razer-huntsman-v3-pro-low-profile-tenkeyless-8khz", "razer-huntsman-v3-pro-mini",
    "razer-huntsman-v3-pro-mini-8khz", "razer-huntsman-v3-pro-tenkeyless", "razer-huntsman-v3-pro-tenkeyless-8khz",
    "razer-huntsman-v3-tenkeyless-8khz", "steelseries-apex-pro-gen-3", "steelseries-apex-pro-mini",
    "steelseries-apex-pro-mini-gen-3", "steelseries-apex-pro-mini-wireless", "steelseries-apex-pro-tkl-2023",
    "steelseries-apex-pro-tkl-gen-3", "steelseries-apex-pro-tkl-wireless-2023", "steelseries-apex-pro-tkl-wireless-gen-3",
    "wooting-60he", "wooting-60he-v2", "wooting-80he", "wooting-80he-plus", "wooting-two-he",
  ],
  "mechanical-keyboards": [
    "asus-rog-azoth-extreme", "asus-rog-falchion-nx", "asus-rog-strix-morph-96-wireless",
    "asus-rog-strix-scope-ii-96-rx-wireless", "corsair-k100-rgb", "corsair-k65-plus-wireless", "corsair-k65-pro-mini",
    "corsair-k70-core-tkl", "corsair-k70-core-tkl-wireless", "corsair-k70-rgb-pro", "corsair-vanguard-96",
    "corsair-vanguard-96-wireless", "ducky-one-3-pro-100", "ducky-one-3-rgb-100", "glorious-gmmk-3-pro",
    "glorious-gmmk-eternal-96", "hyperx-alloy-origins-core", "hyperx-alloy-rise-75", "hyperx-origins-2-1800",
    "hyperx-origins-2-65", "logitech-g-pro-x-60", "logitech-g-pro-x-tkl-lightspeed", "logitech-g316-x-75",
    "razer-blackwidow-v4", "razer-blackwidow-v4-75", "razer-blackwidow-v4-pro", "razer-blackwidow-v4-pro-75",
    "razer-blackwidow-v4-tenkeyless-hyperspeed", "razer-reclusa-x-mini-65", "steelseries-apex-9-mini",
    "steelseries-apex-9-tkl",
  ],
  "low-profile-keyboards": [
    "corsair-k100-air-wireless", "corsair-vanguard-air-99-wireless", "logitech-g515-lightspeed-tkl", "logitech-g515-tkl",
    "logitech-g915-x-lightspeed", "logitech-g915-x-lightspeed-tkl", "logitech-g915-x-wired",
    "razer-blackwidow-v4-low-profile-hyperspeed", "razer-blackwidow-v4-low-profile-tenkeyless-hyperspeed",
  ],
};

/** Brands GamingRecs only had for their keyboards; their brand pages move too. ASUS, Corsair, Logitech, Razer and the
 *  other gear makers keep their mice, headsets and controllers here. */
export const movedKeyboardBrandSlugs = ["drunkdeer", "ducky", "keychron", "lemokey", "wooting"];

export const movedKeyboardPages = [
  // The category, its old address and the catalogue filtered to keyboards; KeyboardRecs' home lists every category.
  { source: "/keyboards", destination: `${KEYBOARDRECS}/` },
  { source: "/types/keyboards", destination: `${KEYBOARDRECS}/` },
  { source: "/gear", destination: `${KEYBOARDRECS}/`, query: { key: "shape", value: "Keyboard" } },
  ...Object.entries(movedKeyboardSlugs).flatMap(([type, slugs]) => slugs.flatMap(slug =>
    ["/keyboards", "/gear", "/rackets"].map(base => ({ source: `${base}/${slug}`, destination: `${KEYBOARDRECS}/${type}/${slug}` })))),
  ...movedKeyboardBrandSlugs.map(slug => ({ source: `/brands/${slug}`, destination: `${KEYBOARDRECS}/brands/${slug}` })),
];
