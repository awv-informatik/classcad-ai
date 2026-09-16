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
