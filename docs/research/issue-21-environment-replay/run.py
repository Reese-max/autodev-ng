#!/usr/bin/env python3
"""Portable offline research replay: fresh published-source build, whitelist env."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

here=Path(__file__).resolve().parent
source=Path(sys.argv[1]).resolve()
node=str(Path(sys.argv[2] if len(sys.argv)>2 else shutil.which('node')).resolve())
output=Path(sys.argv[3]).resolve() if len(sys.argv)>3 else here/'author-output'
output.mkdir(parents=True,exist_ok=True)
keys=['PATH','PATHEXT','SYSTEMROOT','WINDIR','COMSPEC','TEMP','TMP']
env={k:os.environ[k] for k in keys if k in os.environ}
env['PATH']=str(Path(node).parent)+os.pathsep+env.get('PATH','')
env['RESEARCH_SOURCE']=str(source)
version=subprocess.check_output([node,'--version'],env=env,text=True).strip()
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,env=env,text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=source,env=env,text=True).strip()
if head!='a2378aa6fea3605f596e3ee264adbb2eb04c9010':raise SystemExit('Published research primitive pin required')
if subprocess.check_output(['git','diff','HEAD','--name-only'],cwd=source,env=env,text=True).strip():raise SystemExit('Tracked source changed')
cmd=[node,str(source/'node_modules/typescript/bin/tsc'),'-p','tsconfig.build.json']
b=subprocess.run(cmd,cwd=source,env=env,text=True,capture_output=True,timeout=90)
(output/'build.log').write_text(b.stdout+b.stderr,encoding='utf-8')
modules=['backends/long-horizon','backends/store','backends/types','backends/roles','backends/metrics','globalcost','globalcost/extra','db','engines/team-state','engines/ownership','engines/attempt-accounting','engines/run-verify','guardian/incident','lock']
hashes=lambda extension:{('dist/' if extension=='js' else 'src/')+m+'.'+extension:hashlib.sha256((source/('dist/' if extension=='js' else 'src/')/(m+'.'+extension)).read_bytes()).hexdigest() for m in modules}
receipt={'sourceSha':head,'sourceTree':tree,'node':version,'command':cmd,'exitCode':b.returncode,'environmentKeys':sorted(env),'compiledSha256':hashes('js') if b.returncode==0 else {},'sourceSha256':hashes('ts')}
(output/'build-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
if b.returncode:sys.stderr.write(b.stderr+b.stdout);raise SystemExit(b.returncode)
r=subprocess.run([node,str(here/'replay.mjs'),str(source),str(output)],cwd=source,env=env,text=True,capture_output=True,timeout=110)
(output/'replay.log').write_text(r.stdout+r.stderr,encoding='utf-8')
sys.stdout.write(r.stdout);sys.stderr.write(r.stderr)
raise SystemExit(r.returncode)
