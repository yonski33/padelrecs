# spotcheck.py pack out slug… : prints the first why_yes item and the biggest catch with FULL snippet text
import json,sys
p={d['slug']:d for d in json.load(open(sys.argv[1]))['discs']}; o=json.load(open(sys.argv[2]))
for s in sys.argv[3:]:
  sn={x['id']:x['text'] for x in p[s]['snippets']}; v=o[s]
  print(f"\n#### {s} {p[s]['flight']} lf {p[s]['level_fit']} ex {p[s]['expert']['level']}\nT: {v['tagline']}")
  for i in [v['why_yes'][0],v['why_not'][0]]:
    print(f"\n* {i['title']}: {i['text']}")
    for k in i['sources']: print(f"   {k}: {sn[k]}")
    if 'try_instead' in i: print('   ->',i['try_instead']['text'])
