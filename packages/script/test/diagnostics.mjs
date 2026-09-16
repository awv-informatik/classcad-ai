import {test} from 'node:test'
import assert from 'node:assert/strict'
import {runScript} from '../dist/index.js'
const session={env:'node',execute:async()=>({maxLevel:51,messages:[{message:'invalid solid'}]}),getTree:async()=>({}),getGraphic:async()=>null}
test('strict errors retain feature context and raw mode remains available',async()=>{
 const events=[]
 const r=await runScript('await api.v1.part.boolean({name:"Cut1"})',session,{strict:true,onOperation:e=>events.push(e)})
 assert.equal(r.ok,false);assert.match(r.error,/Cut1.*invalid solid/)
 assert.equal(events[0].phase,'start');assert.equal(events.at(-1).phase,'error')
 assert.equal((await runScript('await api.v1.part.boolean({})',session)).ok,true)
})
test('rolling logs preserve final diagnostics',async()=>{
 const r=await runScript('for(let i=0;i<10;i++) log(i); throw Error("last")',session,{maxLogEntries:3})
 assert.deepEqual(r.logs,['7','8','9']);assert.equal(r.ok,false)
})
