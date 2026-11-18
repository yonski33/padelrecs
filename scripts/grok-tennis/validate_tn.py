# Validates Grok's disc golf output against the evidence pack. Reuses the PickleballRecs checker rules (page_check.py) and the
# site's who-said-it regex (lib/voice.ts). Usage: python3 validate.py discgolf-batch-01.json discgolf-batch-01.out.json
import json,re,sys
import os; REPO=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
pack=json.load(open(sys.argv[1])); raw=open(sys.argv[2]).read().strip()
raw=re.sub(r'^```(json)?|```$','',raw,flags=re.M).strip()
out=json.loads(raw)
discs={d['slug']:d for d in pack['rackets']}
_src=open(f'{REPO}/lib/voice.ts').read()
ATTR=re.compile('|'.join(re.findall(r'String\.raw`([^`]*)`',_src.split('export const hasAttribution')[0])),re.I)
def who(t):
  t=re.sub(r'\b(splits? (opinion|reviews)|opinion splits|opinions? (is |are )?split)\b[^.]*','',t.replace('==',''),flags=re.I)
  return ATTR.search(t) or re.search(r"\b(players?|throwers?|hitters?|arms?|fans?|beginners?|people|anyone|reviewers?)\s+(who\s+\w+\s+)?(find|found|say|said|call|report|notice|complain|feel|felt|describe|rave|swear|prefer|like|love|may find)\b",t,re.I) or re.search(r"\b(some|many|most|few)\s+(prefer|like|love|miss|wish)\b",t,re.I)
BANNED=re.compile(r"paddle|\bdiscs?\b|owners?\b|% (liked|loved)|reddit|brand says|roomy|warranty is not|\bjunk\b|defective|garbage|poor quality|cheaply made|in our test|we (threw|found|tested|noticed)|\bI (found|threw|felt)\b",re.I)
MEDICAL=re.compile(r"\b(prevent|cure|heal|injur|tendon|inflammat|therap|medical)\w*",re.I)
FOR={'control','power','beginner','intermediate','advanced','arm'}
STOP=set("a an the and or of to in on at for with it its is it's your you out off up too very more less no not than from by as be can this that racket frame".split())
def cw(t): return {w[:5] for w in re.findall(r"[a-z0-9.+']+",t.lower().replace('==','')) if w not in STOP and len(w)>2}
PAIRS=[(r'forgiv|big sweet|large sweet',r'small sweet|tight sweet|unforgiv'),(r'\bsoft\b|plush|arm.friendly|comfortable',r'harsh|stiff|jarr|firm'),(r'easy power|free power|lots of power',r'(low|little|no) (free )?power|underpowered'),(r'stable|solid',r'unstable|twist|pushed around'),(r'maneuverab|quick|whippy',r'hard to swing|sluggish|heavy to swing'),(r'stable|holds? (a |its )?line|straight',r'flip|turns? over too|too understable'),(r'understable|turns? over|flips? up',r'too overstable|won.t turn|fades? hard'),
       (r'glide|glidey',r'little glide|drops? out|no glide'),(r'grip|tacky',r'slippery|slick'),(r'durab|lasts|holds up|keeps its flight',r'beats? in fast|wears? (out )?fast|beat in within'),
       (r'easy (to throw|for slow)|slow arm|beginner',r'needs? (a )?(big|power) arm|not a first|too fast for')]
rows=[];allp=[]
for slug in discs:
  v=out.get(slug); p=[]
  if v is None: rows.append((slug,'MISSING',['not in output'])); continue
  if 'skip' in v: rows.append((slug,'SKIP',[v['skip']])); continue
  ids={s['id'] for s in discs[slug]['snippets']}
  allowed={a['slug'] for a in discs[slug]['allowed_try_instead']}
  for k in ('tagline','bottom_line','why_yes','why_not'):
    if k not in v: p.append(f'schema: missing {k}')
  if p: rows.append((slug,'FAIL',p)); continue
  def srcs(o,what):
    s=o.get('sources'); 
    if not isinstance(s,list): p.append(f'{what}: no sources'); return
    bad=[x for x in s if x not in ids]
    if bad: p.append(f'{what}: unknown ids {bad}')
    if len(set(s)&ids)<2: p.append(f'{what}: needs 2+ valid sources')
  lines=[('tagline',v['tagline']),('bottom_line',v['bottom_line'])]
  for side in ('why_yes','why_not'):
    it=v[side]
    if not isinstance(it,list) or not 1<=len(it)<=4: p.append(f'{side}: 1-4 items'); continue
    if len({i.get('title') for i in it})!=len(it): p.append(f'{side}: duplicate titles')
    for i in it:
      t=i.get('title',''); x=i.get('text','')
      for f in ('title','text','matters_for','sources'):
        if f not in i: p.append(f'schema: {side} item missing {f}')
      if x.count('==')!=2: p.append(f'highlight: "{t}" needs exactly one ==phrase==')
      if len(t)+2+len(x.replace('==',''))>105: p.append(f'match-box line too long: "{t}"')
      bad=set(i.get('matters_for',[]))-FOR
      if bad: p.append(f'matters_for: unknown {sorted(bad)}')
      srcs(i,f'"{t}"')
      a,b=cw(t),cw(x); sh=a&b
      if len(sh)>=2 or (len(a)==1 and sh==a and len(b)<4): p.append(f'body repeats title: "{t}"')
      lines+=[(t,t),(t,x)]
      if side=='why_yes' and ('tip' in i or 'try_instead' in i): p.append(f'tip/try_instead only on why_not: "{t}"')
      if 'tip' in i: srcs(i['tip'],f'tip on "{t}"'); lines.append(('tip',i['tip'].get('text','')))
      if 'try_instead' in i:
        ti=i['try_instead']; srcs(ti,f'try_instead on "{t}"'); lines.append(('try_instead',ti.get('text','')))
        if ti.get('slug') not in allowed: p.append(f'try_instead not allowed: {ti.get("slug")}')
  if isinstance(v['why_not'],list) and v['why_not']:
    n=lambda i: len(set(i.get('sources',[]))&ids)
    if n(v['why_not'][0])<max(n(i) for i in v['why_not']): p.append('why_not[0] is not the best-supported catch')
  own=' '.join(str(x) for x in (discs[slug].get('specs') or {}).values()); alts=' '.join(str(a.get('specs')) for a in discs[slug]['allowed_try_instead'])
  sntext=' '.join(x['text'] for x in discs[slug]['snippets'])
  for what,t in lines:
    spec=own+' '+alts if what=='try_instead' else own
    for m,u in re.findall(r'\b(\d{2,3})\s*(sq ?in|RA|g\b)',t):
      if not re.search(rf'\b{m}\s*{u[:2]}',spec) and not re.search(rf'\b{m}\s*{u[:2]}',sntext): p.append(f'number {m} not in the specs or snippets: {t}')
    for m in re.findall(r'\b(1[68]x[12]\d)\b',t):
      if m not in spec and m not in sntext: p.append(f'pattern {m} not in the specs: {t}')
    if re.search(r'\$\s?\d',t): p.append(f'no prices: {t}')
    if len(t.replace('==',''))>105: p.append(f'too long ({len(t)}): {what}')
    m=who(t)
    if m: p.append(f'who-said-it "{m.group(0)}": {t}')
    if BANNED.search(t): p.append(f'banned word "{BANNED.search(t).group(0)}": {t}')
    if MEDICAL.search(t): p.append(f'medical claim: {t}')
  Y=' '.join(i.get('title','')+' '+i.get('text','') for i in v['why_yes']).lower(); N=' '.join(i.get('title','')+' '+i.get('text','') for i in v['why_not']).lower()
  for py,pn in PAIRS:
    if re.search(py,Y) and re.search(pn,N) and not re.search(r'\bcan\b|some|split|poly|string|tension|version|20\d\d|weight|lead|tape|off.centre|off-center|heavy ball|fast swing',N): p.append(f'possible contradiction: /{py}/ vs /{pn}/')
  if v['why_yes'] and v['why_yes'][0].get('matters_for')==[] and False: pass
  if isinstance(v['why_not'],list) and v['why_not']:
    cat=v['tagline'].split('The catch:')[-1] if 'The catch:' in v['tagline'] else ''
    if not cat: p.append('tagline: no "The catch:"')
    elif not (cw(cat)&cw(v['why_not'][0].get('title','')+' '+v['why_not'][0].get('text',''))): p.append('tagline catch does not match why_not[0]')
  tier='short' if min(len(v['why_yes']),len(v['why_not']))<3 else 'full'
  rows.append((slug,('PASS' if not p else 'FAIL')+('' if tier=='full' else '/short'),p))
extra=set(out)-set(discs)
w=max(len(r[0]) for r in rows)
print(f"{'disc':{w}}  result  problems"); print('-'*(w+40))
for s,r,p in rows: print(f"{s:{w}}  {r:11}  {len(p) if r.startswith('FAIL') else ''}")
print('\nPASS',sum(r[1].startswith('PASS') for r in rows),'FAIL',sum(r[1].startswith('FAIL') for r in rows),'short',sum(r[1].endswith('short') for r in rows),'SKIP',sum(r[1]=='SKIP' for r in rows),'MISSING',sum(r[1]=='MISSING' for r in rows))
if extra: print('unknown slugs in output:',sorted(extra))
for s,r,p in rows:
  if r.startswith('FAIL') or r=='SKIP':
    print(f'\n## {s} ({r})'); [print('  -',x) for x in p]

# --fix <file.md> [notes.json]: write a fix list for Grok (failures + hand-review notes {slug: [note, …]})
if '--fix' in sys.argv:
  fx=sys.argv[sys.argv.index('--fix')+1]; notes=json.load(open(sys.argv[sys.argv.index('--fix')+2])) if len(sys.argv)>sys.argv.index('--fix')+2 else {}
  bad={s:p for s,r,p in rows if r.startswith('FAIL')}
  for s,n in notes.items(): bad.setdefault(s,[]).extend(n)
  if not bad: print('no fixes needed'); sys.exit(0)
  B=re.search(r'batch-(\d+)',sys.argv[1]).group(1)
  L=[f'# Fix list for TennisRecs batch {B}','',f'Your batch {B} JSON had problems in {len(bad)} discs. Keep every rule from the brief. Rewrite ONLY the discs',
     'below so each problem is fixed, and reply with ONE JSON object holding just those discs (same schema, nothing else).',
     'Notes: "why_not[0] is not the best-supported catch" means re-sort the side so the item with the most valid sources is first',
     '(and make the tagline\'s "The catch:" that item). "body repeats title" means rename the title so it shares no words with the text.',
     'If a claim is marked unsupported, drop it or replace it with one the snippets do say.','']
  for s,p in bad.items():
    L.append(f'## {s}'); L+= [f'- {x}' for x in p]; L.append('')
  open(fx,'w').write('\n'.join(L)); print('fix list:',fx,len(bad),'discs')
