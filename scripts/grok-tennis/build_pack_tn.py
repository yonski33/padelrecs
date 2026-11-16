# Tennis Grok evidence pack (no URLs, no report ids) + private id map. build_pack_tn.py NN slugs.txt [cap]
import json,csv,re,collections,sys
B=sys.argv[1]; CAP=int(sys.argv[3]) if len(sys.argv)>3 else 40
OUT=f'/Users/yonatan/Downloads/padel site/grok/tennis/tennis-batch-{B}.json'
SL=open(sys.argv[2]).read().split()
inv={x['slug']:x for x in json.load(open('inv.json'))}
ex={r['slug']:r for r in csv.DictReader(open('/Users/yonatan/Downloads/tennis_filled.csv'))}
lv={r['slug']:r for r in csv.DictReader(open('/Users/yonatan/Downloads/tennis_level_filled.csv'))}
KIND={'Reddit':'forum','YouTube':'YouTube','Blog':'blog'}
def kind(p): return KIND.get(p,'forum' if 'forum' in p.lower() else 'site review' if p.endswith('Recs') else 'blog')
def clean(t): return re.sub(r'https?://\S+','',t or '').strip()[:260]
def val(v): v=(v or '').strip(); return None if v in('','n/a') else v
def side(a): return None if a is None else 'control' if a<0.42 else 'power' if a>0.58 else 'all-round'
def g(s):
  m=re.search(r'(\d{3})\s*g',s or ''); return int(m.group(1)) if m else None
EXK=['power','control','spin','arm','maneuverability','stability','forgiveness']
def level(s):
  x=inv[s]; su=x['suits'] or {}; e=ex.get(s,{}); l=lv.get(s,{})
  return {'fit':{k:su.get(k) for k in('beginner','intermediate','advanced')},'fit_basis':su.get('basis'),
          'expert_level':val(e.get('expert_level')) or val(l.get('expert_level'))}
nid=0; idmap={}
pack={'about':f'TennisRecs content, batch {B}. Evidence snippets are short summaries of real player reports (forums, YouTube reviews, blogs). Write only what the snippets support.',
 'scales':{'expert':"The site expert's 1-10 ratings where set (10 = most): power, control, spin, arm (comfort: 10 = kindest to the arm), maneuverability, stability, forgiveness. Empty = not set.",
  'dots':'The site engine\'s 1-5 trait dots from all evidence (5 = most).','side':'The engine\'s style side from all evidence: control, all-round or power.',
  'level':'fit = 0-100 per level from the engine (50 or below = a poor fit); fit_basis says what it rests on ("expert" = the expert set it; "N players" = reports; "specs" = estimated from the specs). expert_level, when set, wins.'},
 'rackets':[]}
pool=[y for y in inv.values() if y['reports']>=15]
for s in SL:
  d=json.load(open(f'ev/{s}.json')); r=d['reports']; x=inv[s]; e=ex.get(s,{})
  cand=[i for i,q in enumerate(r) if len(clean(q.get('summary')))>=35]; pick=[]
  for i in cand:
    if r[i]['platform']!='Reddit' and len(pick)<CAP*2//5: pick.append(i)
  tags=collections.defaultdict(list)
  for i in cand:
    for t in r[i]['tags']: tags[t].append(i)
  for t,ids in sorted(tags.items(),key=lambda kv:-len(kv[1])):
    for i in sorted(ids,key=lambda i:-len(r[i]['summary']))[:3]:
      if i not in pick and len(pick)<CAP-3: pick.append(i)
  for i in [i for i in cand if r[i]['sentiment']!='positive']:
    if i not in pick and len(pick)<CAP: pick.append(i)
  for i in sorted(cand,key=lambda i:-len(r[i]['summary'])):
    if len(pick)>=CAP: break
    if i not in pick: pick.append(i)
  sn=[]
  for i in pick:
    nid+=1; k=f'e{nid}'; idmap[k]={'slug':s,'report_id':r[i]['id'],'index':i}
    sn.append({'id':k,'source':kind(r[i]['platform']),'year':(r[i].get('date') or '')[:4] or None,'sentiment':r[i]['sentiment'],'tags':r[i]['tags'],'text':clean(r[i]['summary'])})
  # try-instead pool: most-reviewed, the kindest to the arm, the closest in weight, and the other side of the style axis
  o=[y for y in pool if y['slug']!=s]; w=g(x['specs'].get('weight'))
  pick_alt=sorted(o,key=lambda y:-y['reports'])[:6]+sorted(o,key=lambda y:-(y['dots'] or {}).get('arm',0))[:3]
  if w: pick_alt+=sorted([y for y in o if g(y['specs'].get('weight'))],key=lambda y:abs(g(y['specs'].get('weight'))-w))[:3]
  pick_alt+=sorted(o,key=lambda y:abs((y['axis'] or .5)-(1-(x['axis'] or .5))))[:2]
  allowed=[];seen=set()
  for y in pick_alt:
    if y['slug'] in seen: continue
    seen.add(y['slug']); kf=collections.Counter(t for q in json.load(open(f"ev/{y['slug']}.json"))['reports'] for t in q['tags']) if __import__('os').path.exists(f"ev/{y['slug']}.json") else collections.Counter()
    allowed.append({'slug':y['slug'],'name':y['name'],'side':side(y['axis']),'dots':y['dots'],'specs':y['specs'],'level_fit':{k:(y['suits'] or {}).get(k) for k in('beginner','intermediate','advanced')},'known_for':[f'{t} ({n})' for t,n in kf.most_common(4)]})
  pack['rackets'].append({'slug':s,'name':x['name'],'specs':x['specs'],'side':side(x['axis']),'dots':x['dots'],'reports_total':x['reports'],
    'level':level(s),'expert':{k:val(e.get('expert_'+k)) for k in EXK if val(e.get('expert_'+k))},'snippets':sn,'allowed_try_instead':allowed})
json.dump(pack,open(OUT,'w'),indent=1,ensure_ascii=False); json.dump(idmap,open(f'idmap-batch-{B}.json','w'))
print(B,nid,'snippets',sum(len(json.dumps(p)) for p in pack['rackets'])//4,'tok')
