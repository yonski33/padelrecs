# spotcheck_urls.py pack out [every=5]: for 1 in N written rackets, list 2 cited URLs per racket (biggest catch + top strength)
# with the line they support, for Claude to fetch and confirm. Prints a checklist; record results in a hit-rate table.
import json,sys
o=json.load(open(sys.argv[2])); N=int(sys.argv[3]) if len(sys.argv)>3 else 5
w=[(s,v) for s,v in o.items() if 'skip' not in v]
for s,v in w[::N]:
  for it in (v['why_yes'][0],v['why_not'][0]):
    x=it['sources'][0]; print(f"{s} | {it['title']}: {it['text'].replace('==','')}\n   {x['url']}  ({x.get('note','')})")
