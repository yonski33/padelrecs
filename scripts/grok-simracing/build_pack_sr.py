# Sim racing Grok evidence pack (no URLs, no report ids) + private id map. build_pack_sr.py NN slugs.txt [cap]
import json,csv,re,collections,sys
B=sys.argv[1]; CAP=int(sys.argv[3]) if len(sys.argv)>3 else 40
OUT=f'/Users/yonatan/Downloads/padel site/grok/simracing/simracing-batch-{B}.json'
SL=open(sys.argv[2]).read().split()
inv={x['slug']:x for x in json.load(open('inv.json'))}
ex={r['slug']:r for r in csv.DictReader(open('/Users/yonatan/Downloads/simracing_filled.csv'))}
KIND={'Reddit':'forum','YouTube':'YouTube','Blog':'blog'}
def kind(p): return KIND.get(p,'forum' if 'forum' in p.lower() else 'site review' if p.endswith('Recs') else 'blog')
def clean(t): return re.sub(r'https?://\S+','',t or '').strip()[:260]
def val(v): v=(v or '').strip(); return None if v in('','n/a') else v
def plats(s):
  e=val(ex.get(s,{}).get('platform')) or inv[s].get('platforms') or ''
  return [p.strip() for p in e.split(',') if p.strip()] or None
def band(s): return val(ex.get(s,{}).get('price_band'))
def torque(s): return val(ex.get(s,{}).get('torque_nm')) or inv[s].get('torque')
EXK=['suits_new','suits_upgrade','ffb_detail','ffb_strength','brake_feel','rigidity','build','quiet','setup','software','ergonomics','value']
nid=0; idmap={}
pack={'about':f'SimRacingRecs content, batch {B}. Evidence snippets are short summaries of real driver reports (forums, YouTube reviews, blogs). Write only what the snippets support.',
 'scales':{'expert':'The site expert\'s 1-10 values where set (empty = not set): suits_new = how well it suits drivers new to sim racing; suits_upgrade = how well it suits drivers upgrading; the rest are quality ratings (10 = best). Qualities that do not apply to the type are left out.',
  'price_band':'The owner\'s price thirds within the product\'s type: $ low, $$ mid, $$$ high.','platforms':'Platforms the product works with, from the owner\'s sheet or the catalogue. Missing = not applicable (cockpits) or unknown.',
  'level_fit':'0-100 per level from the site engine: beginner = new to sim racing, intermediate = serious / upgrading, advanced = all-in. 50 or below = a poor fit.'},
 'products':[]}
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
  # try-instead: same type, platform-compatible (covers every console this one supports), price band within one step, 10+ reports
  P=set(plats(s) or []); cons=P-{'PC'}; bd=band(s); BO={'$':1,'$$':2,'$$$':3}
  def ok(y):
    if y['slug']==s or y['type']!=x['type'] or y['reports']<10: return False
    yp=set(plats(y['slug']) or [])
    if P and yp and not cons<=yp: return False
    yb=band(y['slug'])
    return not (bd and yb and abs(BO[bd]-BO[yb])>1)
  allowed=[]
  for y in sorted([y for y in inv.values() if ok(y)],key=lambda y:-y['reports'])[:10]:
    try: kf=collections.Counter(t for q in json.load(open(f"ev/{y['slug']}.json"))['reports'] for t in q['tags'])
    except FileNotFoundError: kf=collections.Counter()
    yd=y['suits'] or {}
    allowed.append({'slug':y['slug'],'name':y['name'],'drive':y['drive'],'torque_nm':torque(y['slug']),'platforms':plats(y['slug']),'price_band':band(y['slug']),
      'level_fit':{k:yd.get(k) for k in('beginner','intermediate','advanced')},'known_for':[f'{t} ({n})' for t,n in kf.most_common(4)]})
  su=x['suits'] or {}
  pack['products'].append({'slug':s,'name':x['name'],'type':x['type'],'drive_or_kind':x['drive'],'torque_nm':torque(s),'platforms':plats(s),'price_band':bd,
    'notes':x.get('notes'),'reports_total':x['reports'],'level_fit':{k:su.get(k) for k in('beginner','intermediate','advanced')},
    'expert':{k:val(e.get('expert_'+k)) for k in EXK if val(e.get('expert_'+k))},'snippets':sn,'allowed_try_instead':allowed})
json.dump(pack,open(OUT,'w'),indent=1,ensure_ascii=False); json.dump(idmap,open(f'idmap-batch-{B}.json','w'))
print(B,nid,'snippets', sum(len(json.dumps(p)) for p in pack['products'])//4,'tok')
