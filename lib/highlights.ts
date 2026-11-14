/** Marker highlights on review text (owner's idea, 2026-11-14): one or two short phrases per review, so a reader can scan
 *  the reviews. Prototype: each tag has phrase patterns, and a review only gets highlights for tags it actually carries,
 *  so a passing "no elbow pain" in a review tagged for something else stays plain. Praise is green, complaints amber. */

export type Segment = { text: string; tone?: "pos" | "neg" };

/** The most highlights one review gets; more than this and nothing stands out. */
export const MAX_HIGHLIGHTS = 2;
/** Longer matches are cut from the list: a highlight is a phrase, not a sentence. */
const MAX_CHARS = 60;

// Words that can sit between a subject and its verdict: "the sweet spot is quite small".
const MID = String.raw`(?:\s+(?:is|was|feels|felt|seems|are|were|really|very|quite|a bit|bit|pretty|rather|super|so|too|on the|more|a lot|much|fairly|incredibly|extremely|relatively|surprisingly))*`;

/** Phrase patterns by tag, per niche. Case-insensitive; each match is highlighted as it stands in the text. */
const PATTERNS: Record<string, Record<string, string[]>> = {
  padel: {
    "easy power": [
      String.raw`(?:easy|free|extra|noticeable|lively|lots of|plenty of|nice)\s+(?:pop|ball output|exit|depth|rebound)`,
      String.raw`power(?: output)?\s+is\s+plenty`,
      String.raw`pace comes easily`,
      String.raw`(?:useful|easy|plenty of)\s+(?:finishing\s+)?power`,
      String.raw`(?:easy|effortless|free|good|great|huge|big|plenty of|lots of|loads of|serious|explosive|massive|a lot of|tons of)\s+power`,
      String.raw`power${MID}\s+(?:easy|effortless|great|huge|excellent|amazing|impressive|insane|there)`,
      String.raw`(?:very|really|super)?\s*powerful`,
    ],
    "great on smashes": [
      String.raw`(?:explosive|heavy|powerful|strong)\s+(?:overheads|smashes|smash power|volleys)`,
      String.raw`(?:leave|leaves|come off|comes off)\s+like\s+missiles`,
      String.raw`(?:particularly\s+)?satisfying on smashes`,
      String.raw`(?:kick|flat)\s+smashes\s+(?:are|come)\s+(?:easy|satisfying|great)`,
      String.raw`(?:great|good|huge|big|easy|powerful|devastating|excellent|amazing|strong|killer|lethal|deadly)\s+(?:on\s+)?(?:smash(?:es)?|overheads?|por\s?tres|x3|x4|bandejas?|viboras?|víboras?)`,
      String.raw`(?:smash(?:es)?|overheads?|bandejas?|viboras?|víboras?)${MID}\s+(?:great|excellent|easy|amazing|huge|lethal|deadly|go out|fly|explode)`,
      String.raw`power on smashes[^.,;]*`,
      String.raw`(?:ball\s+)?(?:goes|go|went)\s+out\s+(?:by\s+)?(?:3|4|x3|x4|por\s?tres|por\s?cuatro)`,
    ],
    "good control": [
      String.raw`(?:precise|controlled|accurate)\s+(?:feel|placement|touch|attacking\s+\w+)`,
      String.raw`(?:solid and\s+)?predictable`,
      String.raw`(?:control|precision)\s+(?:and|&)\s+(?:sweet spot|touch|precision|placement)`,
      String.raw`(?:good|great|excellent|lots of|plenty of|amazing|superb|precise|fantastic|top|outstanding|incredible|nice|solid|more)\s+control`,
      String.raw`control${MID}\s+(?:good|great|excellent|amazing|superb|fantastic|outstanding|top notch|spot on)`,
      String.raw`(?:very|really|super)?\s*(?:precise|accurate|controllable)`,
      String.raw`(?:great|good|easy)\s+placement`,
    ],
    forgiving: [
      String.raw`sweet\s?spot\s+feels\s+generous`,
      String.raw`(?:generous|forgiving)[- ]feeling\s+(?:contact zone|sweet spot)`,
      String.raw`off[- ]cent(?:re|er)\s+hits\s+don't\s+punish\s+you`,
      String.raw`(?:the\s+)?friendliest\s+option`,
      String.raw`(?:very|really|super|quite|pretty|more|so)?\s*forgiving`,
      String.raw`(?:big|large|huge|generous|wide|forgiving)\s+sweet\s?spot`,
      String.raw`sweet\s?spot${MID}\s+(?:big|large|huge|generous|wide)`,
      String.raw`easy to play(?: with)?`,
    ],
    "arm-friendly": [
      String.raw`without\s+(?:tiring|hurting)\s+(?:your|my|the)\s+(?:arm|forearm|elbow)`,
      String.raw`(?:comfortable|soft|plush|cushioned|gentle)\s+(?:feel|touch|choice|response)`,
      String.raw`less\s+arm\s+load`,
      String.raw`(?:very|really|super|quite)?\s*arm[- ]friendly`,
      String.raw`(?:easy|gentle|kind|soft)\s+on\s+(?:the|my|your)\s+(?:arm|elbow|wrist|shoulder)s?`,
      String.raw`no\s+(?:more\s+)?(?:arm|elbow|wrist|shoulder)\s+(?:pain|issues|problems)`,
      String.raw`(?:great|good|nice)\s+for\s+(?:tennis\s+elbow|the arm|the elbow)`,
      String.raw`(?:absorbs|dampens|soaks up)\s+(?:vibrations?|shock)`,
    ],
    "fast at the net": [
      String.raw`(?:fast|quick|great|good|easy|manoeuvrable|maneuverable|nimble|handy)\s+(?:at|on)\s+the\s+net`,
      String.raw`(?:very|really|super|quite)?\s*(?:manoeuvrable|maneuverable|nimble|quick in (?:the )?hands?)`,
      String.raw`(?:great|good|fast|quick|easy)\s+(?:on\s+)?volleys`,
    ],
    "good spin": [
      String.raw`(?:good|great|lots of|plenty of|loads of|excellent|amazing|nice|serious|extra|more|insane|tons of)\s+(?:spin|bite|grip on the ball)`,
      String.raw`spin${MID}\s+(?:good|great|excellent|amazing|easy|insane)`,
      String.raw`(?:rough|gritty|textured)\s+(?:face|surface|finish)`,
    ],
    "great in defence": [
      String.raw`(?:easy|agile|dependable|reliable|solid)\s+(?:defen[cs]e|lobs|blocks)`,
      String.raw`(?:defen[cs]e|lobs)\s+(?:and|&)\s+[\w ]{0,20}(?:control|volleys)`,
      String.raw`(?:great|good|easy|solid|excellent|comfortable|safe|reliable)\s+(?:in|for|on)\s+(?:defen[cs]e|defending|the back|lobs)`,
      String.raw`(?:great|good|easy|solid|excellent|reliable)\s+(?:defen[cs]e|defending|lobs|lobbing)`,
      String.raw`defen[cs]e${MID}\s+(?:great|easy|solid|excellent|comfortable)`,
    ],
    "head-heavy": [
      String.raw`(?:very|quite|really|a bit|bit|too|slightly|noticeably|super|pretty)?\s*head[- ]heavy(?:\s+balance)?`,
      String.raw`(?:high|top[- ]heavy)\s+balance`,
    ],
    "small sweet spot": [
      String.raw`(?:(?:small|tiny|narrow|limited|high|restricted|reduced)(?:,|\s+and|/)?\s+)+(?:standard\s+)?sweet\s?spot`,
      String.raw`sweet\s?spot\s+is\s+not\s+huge`,
      String.raw`reduces\s+the\s+sweet\s?spot`,
      String.raw`off[- ]cent(?:re|er)\s+contact\s+is\s+obvious`,
      String.raw`(?:small|tiny|narrow|limited|unforgiving|tight|high|smaller)\s+sweet\s?spot`,
      String.raw`sweet\s?spot${MID}\s+(?:small|tiny|narrow|limited|unforgiving|tight|high|smaller|less than medium)(?:\s+and\s+(?:up\s+)?high)?`,
      String.raw`(?:punishes|punishing on)\s+(?:mishits|off-cent(?:re|er) (?:hits|shots))`,
      String.raw`off[- ]cent(?:re|er)\s+(?:shots|hits|volleys)\s+feel\s+dead`,
    ],
    "tiring in long matches": [
      String.raw`(?:longer|long|prolonged)\s+(?:exchanges|rallies|sessions|matches|play)\s+(?:tire|tires|brings?)\s+(?:the\s+arm|arm fatigue)`,
      String.raw`(?:extra|more)\s+forearm\s+effort`,
      String.raw`loads\s+the\s+arm`,
      String.raw`(?:tiring|tires|tired|heavy|fatigue|fatiguing)\s+(?:in|after|by|over|on)\s+(?:long|the third|the 3rd|3rd|third|late|later)\s*(?:matches|games|sessions|sets?)?`,
      String.raw`(?:feel|felt|feels)\s+(?:it\s+)?in\s+(?:the|my)\s+(?:arm|elbow|shoulder|wrist)`,
      String.raw`(?:arm|shoulder|wrist)\s+(?:fatigue|gets tired|tires)`,
      String.raw`too heavy`,
    ],
    "vibrates on mishits": [
      String.raw`vibrat(?:es|ion|ions|ing)[^.,;]{0,25}`,
      String.raw`(?:harsh|jarring|dead)\s+(?:on|feel(?:ing)? on)\s+(?:mishits|off-cent(?:re|er)(?: hits| shots)?)`,
      String.raw`(?:elbow|arm|shoulder|wrist)\s+(?:pain|issues|problems|hurt|hurts|ache)`,
      String.raw`hurt\s+(?:my|some|their)\s+(?:elbows?|arms?|wrists?|shoulders?)`,
    ],
    demanding: [
      String.raw`(?:muscular|technical|physical),?\s+demanding\s+game`,
      String.raw`(?:needs|requires)\s+(?:concentration|a strong arm|stronger arms|good technique)`,
      String.raw`stronger arms are better suited`,
      String.raw`(?:very|quite|really|too|a bit|pretty)?\s*demanding`,
      String.raw`(?:not|isn't|wasn't)\s+(?:for|suited to|great for|ideal for)\s+beginners`,
      String.raw`(?:takes|took|needs|need)\s+(?:some\s+|a\s+lot\s+of\s+)?(?:time|weeks|getting used to|adjust(?:ing|ment)?|technique)`,
      String.raw`(?:hard|harder|difficult|tough)\s+to\s+(?:play|control|handle|master|use)`,
      String.raw`not as easy to play[^.,;]*`,
    ],
    "durability issues": [
      String.raw`(?:cracked|cracks|crack|broke|broken|snapped|chipped|chips|peeling|peeled|delaminat\w*|dented|bubbled|bubbles)(?:\s+(?:after|within|in)\s+[^.,;]{1,20})?`,
      String.raw`(?:poor|bad|weak|questionable)\s+(?:durability|build quality|paint|finish)`,
    ],
  },
};

const compiled = new Map<string, Map<string, RegExp>>();
function patternsFor(niche: string) {
  let m = compiled.get(niche);
  if (!m) {
    m = new Map(Object.entries(PATTERNS[niche] ?? {}).map(([tag, list]) => [tag, new RegExp(list.map(p => `(?:${p})`).join("|"), "gi")]));
    compiled.set(niche, m);
  }
  return m;
}

/** Whether a niche has highlight patterns at all. */
export const hasHighlights = (niche: string) => niche in PATTERNS;

/** Splits review text into plain and highlighted segments. `tags` are the review's own tags; `toneOf` gives each tag's tone. */
export function highlightSegments(niche: string, text: string, tags: readonly string[], toneOf: (tag: string) => string | undefined): Segment[] {
  const pats = patternsFor(niche);
  if (!text || !pats.size || !tags.length) return [{ text }];
  type Hit = { start: number; end: number; tone: "pos" | "neg"; tag: string };
  const hits: Hit[] = [];
  for (const tag of tags) {
    const tone = toneOf(tag), re = pats.get(tag);
    if (!re || (tone !== "pos" && tone !== "neg")) continue;
    re.lastIndex = 0;
    for (let m; (m = re.exec(text)); ) {
      // Trim the spaces a loose optional prefix can leave, and keep matches on word boundaries.
      let start = m.index, end = m.index + m[0].length;
      while (start < end && /\s/.test(text[start])) start++;
      while (end > start && /[\s,;:]/.test(text[end - 1])) end--;
      if (end - start < 4 || end - start > MAX_CHARS) continue;
      if ((start > 0 && /\w/.test(text[start - 1])) || (end < text.length && /\w/.test(text[end]))) continue;
      hits.push({ start, end, tone, tag });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  // One highlight per tag (its first mention) and no overlaps. A review with praise and a complaint shows one of each,
  // so the good and the bad both stand out; otherwise the earliest in reading order.
  hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const picked: Hit[] = [], usedTags = new Set<string>();
  const take = (h: Hit) => {
    if (picked.length >= MAX_HIGHLIGHTS || usedTags.has(h.tag) || picked.some(p => h.start < p.end && p.start < h.end)) return;
    picked.push(h); usedTags.add(h.tag);
  };
  for (const tone of ["pos", "neg"] as const) { const h = hits.find(x => x.tone === tone); if (h) take(h); }
  for (const h of hits) take(h);
  if (!picked.length) return [{ text }];
  const out: Segment[] = [];
  let at = 0;
  for (const h of picked.sort((a, b) => a.start - b.start)) {
    if (h.start > at) out.push({ text: text.slice(at, h.start) });
    out.push({ text: text.slice(h.start, h.end), tone: h.tone });
    at = h.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}
