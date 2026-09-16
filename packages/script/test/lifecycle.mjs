import {test} from 'node:test'
import assert from 'node:assert/strict'
import {runScript,isSessionBusy} from '../dist/index.js'
import {connectSession} from '../dist/node.js'
import {WebSocketServer} from 'ws'
test('cancel retains lease, blocks later commands, and restores after settlement',async()=>{
 let resolve,calls=0,restored=false
 const session={env:'node',execute:async()=>{calls++;return await new Promise(r=>resolve=r)},getTree:async()=>({}),getGraphic:async()=>null,
 withRunScope:async run=>{try{return await run()}finally{restored=true}}}
 const abort=new AbortController()
 const run=runScript('await api.v1.part.box({}); await api.v1.part.box({})',session,{signal:abort.signal})
 await new Promise(r=>setTimeout(r,5));abort.abort()
 assert.equal((await run).pending,true);assert.equal(isSessionBusy(session),true);assert.equal(restored,false)
 assert.equal((await runScript('return 1',session)).pending,true)
 resolve({result:1});await new Promise(r=>setTimeout(r,5))
 assert.equal(calls,1);assert.equal(restored,true);assert.equal(isSessionBusy(session),false)
})
test('worker disconnect rejects immediately even with debug timeouts disabled',async()=>{
 const server=new WebSocketServer({port:0});await new Promise(r=>server.once('listening',r))
 server.on('connection',ws=>ws.on('message',()=>ws.close()))
 const s=await connectSession(`ws://127.0.0.1:${server.address().port}`,{debug:true})
 try{await assert.rejects(s.execute({'v1.part.box':[{}]}),/disconnected/)}finally{s.close();await new Promise(r=>server.close(r))}
})
