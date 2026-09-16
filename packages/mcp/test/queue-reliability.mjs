import {test} from 'node:test'
import assert from 'node:assert/strict'
import {serializeTools,setDrawingBusy} from '../dist/queue.js'
test('busy state is isolated per MCP session and does not block docs',async()=>{
 const make=()=>{const handlers={};const server={registerTool:(name,_,fn)=>handlers[name]=fn};serializeTools(server);return {server,handlers}}
 const a=make(),b=make();setDrawingBusy(a.server,()=>true)
 for(const s of [a,b])for(const name of ['run_script','docs'])s.server.registerTool(name,{},async()=>({ok:true}))
 assert.equal((await a.handlers.run_script()).isError,true)
 assert.equal((await a.handlers.docs()).ok,true)
 assert.equal((await b.handlers.run_script()).ok,true)
})
