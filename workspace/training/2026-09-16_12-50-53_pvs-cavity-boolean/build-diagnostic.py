import json,pathlib,subprocess,os
f=pathlib.Path(__file__).resolve().parent
r=pathlib.Path('/Users/dev/dev/awv/classcad/runtime')
cmd=json.loads((f/'files/debug-compile-command.json').read_text())
env=dict(os.environ,MACOSX_DEPLOYMENT_TARGET='26.0')
with open(f/'files/lifetime-build.log','w') as out:
 subprocess.run(cmd,cwd=r/'output/arm64-osx-clang/build',env=env,stdout=out,stderr=subprocess.STDOUT,check=True)
 subprocess.run((f/'files/debug-link-command.txt').read_text(),shell=True,cwd=r/'output/arm64-osx-clang/build',stdout=out,stderr=subprocess.STDOUT,check=True)
print('Diagnostic compile and link succeeded')
