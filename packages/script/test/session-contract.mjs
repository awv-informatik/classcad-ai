import {test} from 'node:test'
import assert from 'node:assert/strict'
import {WebSocketServer} from 'ws'
import {connectSession} from '../dist/node.js'
import {connect} from '../../mcp/dist/client.js'
// Identical wire scenarios must behave the same in both adapters.
for(const [name,open] of [['node',url=>connectSession(url,{requestTimeoutMs:25})],['mcp',url=>connect(url,{engine:'drogon',requestTimeoutMs:25})]]){
 test(`${name}: complete empty graphics replace old cache; timeout fences further work`,async()=>{
  const wss=new WebSocketServer({port:0});await new Promise(r=>wss.once('listening',r));let empty=false
  wss.on('connection',ws=>ws.on('message',raw=>{
   const q=JSON.parse(String(raw));if(q.command==='Hang')return
   ws.send(JSON.stringify({command:'Result',_from_:q.command,_transactionID_:q.transactionID,result:{result:1},structure:{tree:{}},graphic:{containers:empty?[]:[{id:1,owner:1,type:1,meshes:[]}]} }))
  }))
  const s=await open(`ws://127.0.0.1:${wss.address().port}`)
  try{
   await s.pull();assert.equal(s.getLastGraphic().containers.length,1)
   empty=true;await s.pull();assert.deepEqual(s.getLastGraphic().containers,[])
   await assert.rejects(s.request('Hang'),/outcome unknown/)
   await assert.rejects(s.execute({'v1.part.box':[{}]}),/outcome unknown/)
  }finally{s.close();await new Promise(r=>wss.close(r))}
 })
}
for(const [name,open] of [['node',url=>connectSession(url)],['mcp',url=>connect(url,{engine:'drogon'})]]){
 test(`${name}: WASM-shaped Results keep their errors (maxLevel/messages nested in result)`,async()=>{
  const wss=new WebSocketServer({port:0});await new Promise(r=>wss.once('listening',r))
  wss.on('connection',ws=>ws.on('message',raw=>{
   const q=JSON.parse(String(raw));const api=Object.keys(q.task?.[0]??{})[0]??''
   const result=/fail/.test(api)
    ?{result:null,maxLevel:51,messages:[{api,code:1014,levelStr:'ERROR',level:51,message:'polyline2d is not planar!'}]}
    :{result:7}
   ws.send(JSON.stringify({command:'Result',from:q.command,_transactionID_:q.transactionID,result}))
  }))
  const s=await open(`ws://127.0.0.1:${wss.address().port}`)
  try{
   const bad=await s.execute({'v1.curve.fail':[{}]})
   assert.equal(bad.maxLevel,51);assert.equal(bad.result,null)
   assert.deepEqual(bad.messages.map(m=>m.code),[1014])
   const ok=await s.execute({'v1.part.box':[{}]})
   assert.equal(ok.maxLevel,0);assert.equal(ok.result,7)
  }finally{s.close();await new Promise(r=>wss.close(r))}
 })
}
