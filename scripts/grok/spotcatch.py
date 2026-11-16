# spotcatch.py: for batch:slug pairs, print the tagline, the biggest catch and any level catch with FULL snippet text
import json,sys
for a in sys.argv[1:]:
  n,s=a.split(':'); p={d['slug']:d for d in json.load(open(f'discgolf-batch-{n}.json'))['discs']}; v=json.load(open(f'discgolf-batch-{n}.out.json'))[s]
  sn={x['id']:x['text'] for x in p[s]['snippets']}
  print(f"\n#### {n} {s} {p[s]['flight']} ex {p[s]['expert']['level']}\nT: {v['tagline']}\nYES1: {v['why_yes'][0]['title']}: {v['why_yes'][0]['text']}")
  for i in [v['why_not'][0]]+[i for i in v['why_not'][1:] if 'beginner' in i.get('matters_for',[])]:
    print(f"* {i['title']}: {i['text']}"); [print(f"   {k}: {sn[k]}") for k in i['sources']]
