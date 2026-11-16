# Grok output (validated) -> db/racket-page/simracing.json + db/fit-card/simracing.json, the same shape as padel/pickleball.
# Usage: python3 convert_grok.py 02 [03 …]   (reads grok/simracing-batch-NN.json, .out.json and idmap-batch-NN.json)
import json,sys,re
G='/Users/yonatan/Downloads/padel site/grok/simracing'; R='..'
TAG={'new':'beginner','serious':'intermediate','all_in':'advanced','console':'arm'}
page,card={},{}
import os
HOLD=set(open('hold.txt').read().split()) if os.path.exists('hold.txt') else set()  # discs waiting on a fix list
for b in sys.argv[1:]:
  out=json.load(open(f'{G}/simracing-batch-{b}.out.json')); idm=json.load(open(f'idmap-batch-{b}.json'))
  for slug,v in out.items():
    if 'skip' in v or slug in HOLD: continue
    def ids(src): 
      r=[]
      for k in src:
        m=idm[k]; assert m['slug']==slug, (slug,k)
        if m['report_id'] not in r: r.append(m['report_id'])
      return r
    def tags(it): return list(dict.fromkeys(TAG[t] for t in it.get('matters_for',[]) if t in TAG))
    def item(it): return {'title':it['title'],'t':it['text'],'for':tags(it),'src':ids(it['sources'])}
    yes=[item(i) for i in v['why_yes']]; no=[item(i) for i in v['why_not']]
    page[slug]={'tagline':v['tagline'],'bottom':v['bottom_line'],'yes':yes,'no':no}
    def line(it,raw):
      t=f"{it['title']}: {it['t'].replace('==','')[0].lower()}{it['t'].replace('==','')[1:]}".rstrip('.')+'.'
      o={'t':t,'for':it['for'],'src':it['src']}
      if it['for']==['arm']: o['only']=['arm']
      if raw.get('tip'): o['tip']={'label':'Player tip','t':raw['tip']['text'],'src':ids(raw['tip']['sources'])}
      if raw.get('try_instead'): o['alt']={'slug':raw['try_instead']['slug'],'t':raw['try_instead']['text'],'src':ids(raw['try_instead']['sources'])}
      return o
    card[slug]={'strengths':[line(a,r) for a,r in zip(yes,v['why_yes'])],'catches':[line(a,r) for a,r in zip(no,v['why_not'])]}
json.dump(page,open(f'{R}/db/racket-page/simracing.json','w'),indent=1,ensure_ascii=False)
json.dump(card,open(f'{R}/db/fit-card/simracing.json','w'),indent=1,ensure_ascii=False)
print(len(page),'discs written')
