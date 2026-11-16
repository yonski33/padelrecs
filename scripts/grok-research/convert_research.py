# Research pilot output (validated) -> merged into db/racket-page/padel.json + db/fit-card/padel.json, marked source "research".
# Usage: python3 scripts/grok-research/convert_research.py "<grok folder>/research/padel-research-01.out.json"
# Sources are web URLs (src), never player report ids; the page shows "Based on published reviews and specs" for these rackets.
# Skin: python3 scripts/grok-research/convert_research.py <out.json> skin  -> db/racket-page/skin.json only (no tagline, no fit card).
import json,sys
R='.'; out=json.load(open(sys.argv[1])); SITE=sys.argv[2] if len(sys.argv)>2 else 'padel'
urls=lambda xs: list(dict.fromkeys(x['url'] if isinstance(x,dict) else x for x in xs))
if SITE=='skin':
  P=json.load(open(f'{R}/db/racket-page/skin.json'))
  SK=('dry','oily','combination','normal','sensitive','acne','hydrate','calm','clear','matte','dewy','light','rich')
  def item(it):
    o={'title':it['title'],'t':it['text'],'src':urls(it['sources']),'for':[t for t in dict.fromkeys(it.get('matters_for',[])) if t in SK]}
    if it.get('tip'): o['tip']={'t':it['tip']['text'],'src':urls(it['tip']['sources'])}
    if it.get('try_instead'): o['alt']={'slug':it['try_instead']['slug'],'t':it['try_instead']['text'],'src':urls(it['try_instead']['sources'])}
    return o
  n=0
  for slug,v in out.items():
    if 'skip' in v: continue
    assert slug not in P or P[slug].get('source')=='research', f'would overwrite report-based content: {slug}'
    P[slug]={'bottom':v['bottom_line'],'yes':[item(i) for i in v['why_yes']],'no':[item(i) for i in v['why_not']],'source':'research'}; n+=1
  json.dump(P,open(f'{R}/db/racket-page/skin.json','w'),indent=1,ensure_ascii=False)
  print(n,'research products merged;',len(P),'skin products with content'); sys.exit()
P=json.load(open(f'{R}/db/racket-page/padel.json')); C=json.load(open(f'{R}/db/fit-card/padel.json'))
TAG=('control','power','beginner','intermediate','advanced','arm')
n=0
for slug,v in out.items():
  if 'skip' in v: continue
  assert slug not in P or P[slug].get('source')=='research', f'would overwrite player-report content: {slug}'
  tags=lambda it: [t for t in dict.fromkeys(it.get('matters_for',[])) if t in TAG]
  item=lambda it: {'title':it['title'],'t':it['text'],'for':tags(it),'src':urls(it['sources'])}
  yes=[item(i) for i in v['why_yes']]; no=[item(i) for i in v['why_not']]
  P[slug]={'tagline':v['tagline'],'bottom':v['bottom_line'],'yes':yes,'no':no,'source':'research'}
  def line(it,raw):
    t=f"{it['title']}: {it['t'].replace('==','')[0].lower()}{it['t'].replace('==','')[1:]}".rstrip('.')+'.'
    o={'t':t,'for':it['for'],'src':it['src']}
    if it['for']==['arm']: o['only']=['arm']
    if raw.get('tip'): o['tip']={'label':'Tip','t':raw['tip']['text'],'src':urls(raw['tip']['sources'])}
    if raw.get('try_instead'): o['alt']={'slug':raw['try_instead']['slug'],'t':raw['try_instead']['text'],'src':urls(raw['try_instead']['sources'])}
    return o
  C[slug]={'strengths':[line(a,r) for a,r in zip(yes,v['why_yes'])],'catches':[line(a,r) for a,r in zip(no,v['why_not'])]}
  n+=1
json.dump(P,open(f'{R}/db/racket-page/padel.json','w'),indent=1,ensure_ascii=False); json.dump(C,open(f'{R}/db/fit-card/padel.json','w'),indent=1,ensure_ascii=False)
print(n,'research rackets merged;',len(P),'padel rackets with content')
