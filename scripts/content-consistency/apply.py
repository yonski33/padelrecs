# Applies reviewed rewrites (rewrites.json) to the content files; the fit card's copy of a page item follows it.
# Usage: python3 scripts/content-consistency/apply.py <rewrites.json> <site> [--dry]
import json,sys,re
rw=[x for x in json.load(open(sys.argv[1])) if x['site']==sys.argv[2]]; dry='--dry' in sys.argv; s=sys.argv[2]
P=json.load(open(f'db/racket-page/{s}.json')); C=json.load(open(f'db/fit-card/{s}.json'))
L={d:json.load(open(f'db/{d}/{s}.json')) for d in('lines','short')}
card=lambda title,t: f"{title}: {t.replace('==','')[0].lower()}{t.replace('==','')[1:]}"
for x in rw:
  slug,w=x['slug'],x['where']
  if w in('tagline','bottom'): print(f'{slug} {w}\n  - {P[slug][w]}\n  + {x["text"]}'); P[slug][w]=x['text']; continue
  if w in('lines','short'):  # raw edit: these files keep their own formatting
    print(f'{slug} {w}\n  - {L[w][slug]}\n  + {x["text"]}'); f=f'db/{w}/{s}.json'; raw=open(f).read()
    old=json.dumps(L[w][slug],ensure_ascii=False); assert raw.count(old)==1, f'{slug}: line not unique in {f}'
    if not dry: open(f,'w').write(raw.replace(old,json.dumps(x['text'],ensure_ascii=False)))
    continue
  if w.startswith('card:'):
    k,i=re.match(r'card:(\w+)\[(\d+)\]',w).groups(); it=C[slug][k][int(i)]; print(f'{slug} {w}\n  - {it["t"]}\n  + {x["text"]}'); it['t']=x['text']; continue
  side,i=re.match(r'(yes|no)\[(\d+)\]',w).groups(); it=P[slug][side][int(i)]; old=f"{it['title']}: {it['t']}"
  print(f'{slug} {w}\n  - {old}\n  + {x["title"]}: {x["t"]}')
  for c in (C.get(slug) or {}).get('strengths' if side=='yes' else 'catches',[]):
    if c['t'].lower().startswith(it['title'].lower()+':'): c['t']=card(x['title'],x['t']); print('    (fit card copy updated)')
  it['title'],it['t']=x['title'],x['t']
if not dry:
  for f,d in ((f'db/racket-page/{s}.json',P),(f'db/fit-card/{s}.json',C)): json.dump(d,open(f,'w'),indent=1,ensure_ascii=False)
