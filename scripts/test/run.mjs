import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,relative} from 'node:path'
import {startFakeWorker} from '../../packages/script/test/fake-worker.mjs'
test('harness reports engine errors and explicit missing exports',async()=>{
 const worker=await startFakeWorker();const dir=await mkdtemp(join(tmpdir(),'cc-harness-'))
 try{
  for(const [label,code] of [['engine','await api.v1.part.boolean({name:"B"}); throw Error("bad geometry")'],['export','await helpers.exportArtifact("STP")']]){
   const script=join(dir,label+'.mjs');await writeFile(script,`export default async(api,helpers)=>{${code}}`)
   const out=join(dir,label)
   const child=spawn(process.execPath,['scripts/run.mjs',relative(process.cwd(),script),'--outdir',out,worker.url],{stdio:'ignore'})
   const exit=await new Promise(r=>child.on('exit',r));assert.equal(exit,1)
   const result=JSON.parse(await readFile(join(out,'run-result.json'),'utf8'));assert.equal(result.ok,false)
   if(label==='export')assert.equal(result.artifacts[0].ok,false)
  }
 }finally{await worker.close();await rm(dir,{recursive:true,force:true})}
})
