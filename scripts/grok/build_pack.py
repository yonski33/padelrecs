# Builds the Grok evidence pack (no URLs, no report uuids) + a private id map kept here.
import json,csv,re,collections,sys
B=sys.argv[1]; CAP=int(sys.argv[3]) if len(sys.argv)>3 else 25
OUT=f'/Users/yonatan/Downloads/padel site/grok/discgolf-batch-{B}.json'
SL=open(sys.argv[2]).read().split()
inv={x['slug']:x for x in json.load(open('inv.json'))}
ex={r['slug']:r for r in csv.DictReader(open('/Users/yonatan/Downloads/discgolf_filled_clean.csv'))}
KIND={'Reddit':'forum','YouTube':'YouTube','Blog':'blog'}
def kind(p): return KIND.get(p,'forum' if 'forum' in p.lower() else 'site review' if p in('DiscGolfRecs','PickleballRecs') else 'blog')
def clean(t): t=re.sub(r'https?://\S+','',t or '').strip(); return t[:240]
def lean(fl):
  try: s,g,t,f=[float(v) for v in fl.split('/')]
  except: return None
  tf=t+f; return 'understable' if tf<=0 else 'overstable' if tf>=3 else 'neutral'
nid=0; idmap={}
pack={'about':f'DiscGolfRecs content pilot, batch {B}. Evidence snippets are short summaries of real player reports (forums, YouTube reviews, blogs). Write only what the snippets support.',
 'scales':{'flight':'speed / glide / turn / fade (Innova-style). Turn: negative = turns right for a right-hand backhand (understable). Fade: higher = harder finish left.',
  'expert':'The site expert\'s 1-10 values where set: stability 1 very understable .. 10 very overstable; glide 1-10; grip 1-10; beat_in 10 = holds its flight a long time (slow to beat in); arm_speed 1 suits a slow arm .. 10 needs a power arm; level = the levels it suits. Empty = not set.',
  'level_fit':'0-100 per level from the site engine (reader and writer evidence + expert). 50 or below = a poor fit for that level.'},
 'discs':[]}
for s in SL:
  d=json.load(open(f'ev/{s}.json')); r=d['reports']; x=inv[s]; e=ex.get(s,{})
  # pick 10-25 snippets: cover each tag (up to 3), all YouTube/blog, keep negatives, then longest
  cand=[i for i,q in enumerate(r) if len(clean(q.get('summary')))>=35]
  pick=[]
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
  same=[y for y in inv.values() if y['type']==x['type'] and y['slug']!=s and y['reports']>=20]
  same=sorted(same,key=lambda y:-y['reports'])[:10]
  allowed=[]
  for y in same:
    yd=y['suits'] or {}
    kf=collections.Counter(t for q in json.load(open(f"ev/{y['slug']}.json"))['reports'] for t in q['tags'])
    allowed.append({'slug':y['slug'],'name':y['name'],'flight':y['flight'],'lean':lean(y['flight'] or ''),'level_fit':{k:yd.get(k) for k in('beginner','intermediate','advanced')},
      'known_for':[f'{t} ({n})' for t,n in kf.most_common(4)]})
  su=x['suits'] or {}
  pack['discs'].append({'slug':s,'name':x['name'],'type':x['type'],'flight':x['flight'],'flight_lean':lean(x['flight'] or ''),'plastics':x['plastics'],
    'reports_total':x['reports'],'level_fit':{k:su.get(k) for k in('beginner','intermediate','advanced')},
    'expert':{k:(e.get('expert_'+k) or '').strip() or None for k in('stability','glide','grip','beat_in','level','arm_speed')},
    'snippets':sn,'allowed_try_instead':allowed})
json.dump(pack,open(OUT,'w'),indent=1,ensure_ascii=False); json.dump(idmap,open(f'idmap-batch-{B}.json','w'))
print(nid,'snippets', [len(d['snippets']) for d in pack['discs']])
