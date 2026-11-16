# merge_fix.py out.json fix-reply.json: replaces the fixed discs in out.json (keeps a .bak first)
import json,sys,re,shutil
o=json.load(open(sys.argv[1])); raw=re.sub(r'^```(json)?|```$','',open(sys.argv[2]).read().strip(),flags=re.M).strip(); f=json.loads(raw)
shutil.copy(sys.argv[1],sys.argv[1]+'.bak'); unknown=[s for s in f if s not in o]
o.update({s:v for s,v in f.items() if s not in unknown}); json.dump(o,open(sys.argv[1],'w'),indent=1,ensure_ascii=False)
print('merged',len(f)-len(unknown),'discs', 'unknown:'+','.join(unknown) if unknown else '')
