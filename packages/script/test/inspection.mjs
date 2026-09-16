import {test} from 'node:test'
import assert from 'node:assert/strict'
import {currentSolids,graphicBounds,uniqueEdge,edgeCandidates} from '../dist/index.js'
const capture={revision:2,tree:{1:{id:1,class:'CC_Solid',members:{consumed:{value:0}}},2:{id:2,class:'CC_Solid',members:{consumed:{value:1}}}},graphic:{containers:[{owner:1,edges:[{id:3,points:[0,0,0,10,0,0]},{id:4,points:[0,1,0,10,1,0]}]}]}}
test('inspection filters consumed solids and labels approximate bounds',()=>{
 assert.deepEqual(currentSolids(capture),[1]);const b=graphicBounds(capture,[1]);assert.deepEqual(b.max,[10,1,0]);assert.equal(b.approximate,true)
 assert.equal(uniqueEdge(capture,[5,0,0],.1).id,3)
 assert.throws(()=>uniqueEdge(capture,[5,.5,0],.6),/found 2/)
 assert.equal(edgeCandidates(capture,[5,.5,0],.6).revision,2)
 assert.throws(()=>edgeCandidates(capture,[0,0,0],-1),/nonnegative/)
})
