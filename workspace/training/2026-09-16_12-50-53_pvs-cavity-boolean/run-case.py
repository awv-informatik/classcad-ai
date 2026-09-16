#!/usr/bin/env python3
"""Run the repository harness unchanged against one disposable worker."""
import subprocess,pathlib,time,json,sys,os,signal,socket
folder=pathlib.Path(__file__).resolve().parent
repo=folder.parents[2]
engine=pathlib.Path('/Users/dev/dev/awv/classcad')
name=sys.argv[1]; limit=float(sys.argv[2]) if len(sys.argv)>2 else 60
script=folder/'scripts'/name
wlog=open(folder/'files'/(script.stem+'-worker.log'),'w')
hlog=open(folder/'files'/(script.stem+'-harness.log'),'w')
w=subprocess.Popen([str(engine/'runtime/output/arm64-osx-clang/release/classcad-cli'),'worker','-i',os.environ.get('PVS_INI',str(folder/'worker.ini'))],cwd=engine,stdout=wlog,stderr=subprocess.STDOUT,start_new_session=True,stdin=subprocess.DEVNULL)
h=None;status={"script":name,"workerPid":w.pid,"limitSeconds":limit}
try:
 deadline=time.monotonic()+30
 while True:
  if w.poll() is not None:break
  with socket.socket() as probe:
   if probe.connect_ex(('127.0.0.1',19094))==0:break
  if time.monotonic()>deadline:raise TimeoutError('Worker startup timed out')
  time.sleep(.1)
 if w.poll() is not None: raise RuntimeError('Worker failed to start; inspect log')
 h=subprocess.Popen(['node','scripts/run.mjs',str(script.relative_to(repo)),'--outdir',str(folder),'--port','19094','--debug'],cwd=repo,stdout=hlog,stderr=subprocess.STDOUT,start_new_session=True)
 start=time.monotonic()
 try: status['exitCode']=h.wait(timeout=limit);status['outcome']='exited'
 except subprocess.TimeoutExpired:
  status['outcome']='watchdog_timeout'
  subprocess.run(['sample',str(w.pid),'2','-file',str(folder/'files'/(script.stem+'-sample.txt'))],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=15)
 if os.environ.get('PVS_LLDB') and status['outcome']=='watchdog_timeout':
  with open(folder/'files'/(script.stem+'-lldb.txt'),'w') as dbg:
   subprocess.run(['xcrun','lldb','--batch','-p',str(w.pid),'-o','thread backtrace all','-o','register read','-o','disassemble --pc --count 12','-o','process detach'],stdout=dbg,stderr=subprocess.STDOUT,timeout=20)
 status['elapsedSeconds']=round(time.monotonic()-start,3)
finally:
 for p in [h,w]:
  if p and p.poll() is None:
   os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=3)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
 wlog.close();hlog.close()
 (folder/'files'/(script.stem+'-run.json')).write_text(json.dumps(status,indent=2))
 print(json.dumps(status))
