# Content consistency sweep (PM/owner 2026-11-17): every written line on the 6 sites vs the product's traits and specs, plus
# each niche's wrong terms. Rules: "<grok folder>/consistency_rules.py" (shared with the Grok validators).
# Usage: python3 scripts/content-consistency/sweep.py <grok folder> <work dir with <site>.json trait dumps>
# Writes <work>/report-<site>.md and <work>/fixes.json (one row per flagged line, with where it lives).
import json,sys,os,glob,collections
G,W=sys.argv[1],sys.argv[2]; sys.path.insert(0,G); from consistency_rules import check_line
SITES=['padel','pickleball','tennis','discgolf','simracing','skin']
def load(p):
  try: return json.load(open(p))
  except Exception: return {}
rows={s:load(f'{W}/{s}.json') for s in SITES}
for f in glob.glob(f'{G}/simracing/simracing-batch-*.json'):   # sim racing: platforms and level fit from the packs
  if f.endswith('.out.json'): continue
  for p in load(f).get('products',[]): rows['simracing'][p['slug']]={'name':p['name'],'shape':p.get('type'),'platforms':p.get('platforms'),'suits':p.get('level_fit'),'dots':{}}
for p in load(f'{W}/skin-all.json') or []: rows['skin'][p['slug']]={'name':p['name'],'shape':p.get('type'),'fragrance':p.get('fragrance'),'dots':{}}
batch={}
for f in glob.glob(f'{G}/**/*.out.json',recursive=True)+glob.glob(f'{G}/*.out.json'):
  d=load(f)
  if isinstance(d,dict):
    for k in d: batch.setdefault(k,os.path.relpath(f,G))
def content(s):
  R='.'; pg=load(f'{W}/tennis-page.json') if s=='tennis' else load(f'{R}/db/racket-page/{s}.json')
  fc=load(f'{W}/tennis-card.json') if s=='tennis' else load(f'{R}/db/fit-card/{s}.json')
  for slug,v in pg.items():
    for k in('tagline','bottom'):
      if v.get(k): yield slug,f'racket-page/{s}.json',f'{k}',v[k],'any'
    for side in('yes','no'):
      for i,it in enumerate(v.get(side,[])): yield slug,f'racket-page/{s}.json',f'{side}[{i}] {it["title"]}',f'{it["title"]}: {it["t"]}',side
  for slug,v in fc.items():
    for side,k in (('yes','strengths'),('no','catches')):
      for i,it in enumerate(v.get(k,[])): yield slug,f'fit-card/{s}.json',f'{k}[{i}]',it['t'],side
  for d in('lines','short'):
    for slug,t in load(f'{R}/db/{d}/{s}.json').items(): yield slug,f'{d}/{s}.json','line',t,'any'
fixes=[]
for s in SITES:
  n=0; rs=rows[s]; out=[]
  for slug,file,where,text,side in content(s):
    n+=1; row=rs.get(slug,{'name':slug,'dots':{}})
    for prob in check_line(s,text,row,side):
      fx={'site':s,'slug':slug,'file':file,'where':where,'text':text,'problem':prob,'batch':batch.get(slug,'(not from a Grok batch)')}
      fixes.append(fx); out.append(fx)
  with open(f'{W}/report-{s}.md','w') as f:
    f.write(f'# {s}: content consistency ({n} lines checked, {len(out)} flags, {len({x["slug"] for x in out})} products)\n\n| Product | Where | Line | Problem | Batch |\n|---|---|---|---|---|\n')
    for x in out: f.write(f"| {x['slug']} | {x['file']} {x['where']} | {x['text'].replace('==','').replace('|','/')} | {x['problem']} | {x['batch']} |\n")
  print(f'{s}: {n} lines, {len(out)} flags ({sum(1 for x in out if x["problem"].startswith("term"))} terms), {len({x["slug"] for x in out})} products, rows with data {len(rs)}')
json.dump(fixes,open(f'{W}/fixes.json','w'),indent=1,ensure_ascii=False)
