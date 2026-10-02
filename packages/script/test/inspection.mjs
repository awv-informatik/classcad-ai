import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildScriptApi,currentBodies,currentSolids,graphicBounds,uniqueEdge,edgeCandidates,inspectSolid} from '../dist/index.js'
const capture={revision:2,tree:{1:{id:1,class:'CC_Solid',members:{consumed:{value:0}}},2:{id:2,class:'CC_Solid',members:{consumed:{value:1}}}},graphic:{containers:[{owner:1,edges:[{id:3,points:[0,0,0,10,0,0]},{id:4,points:[0,1,0,10,1,0]}]}]}}
test('inspection filters consumed solids and labels approximate bounds',()=>{
 assert.deepEqual(currentSolids(capture),[1]);const b=graphicBounds(capture,[1]);assert.deepEqual(b.max,[10,1,0]);assert.equal(b.approximate,true)
 assert.equal(uniqueEdge(capture,[5,0,0],.1).id,3)
 assert.throws(()=>uniqueEdge(capture,[5,.5,0],.6),/found 2/)
 assert.equal(edgeCandidates(capture,[5,.5,0],.6).revision,2)
 assert.throws(()=>edgeCandidates(capture,[0,0,0],-1),/nonnegative/)
})
// A box sliced by a sheet: the slice consumes the box (2) AND the sheet (4), the result is solid 3.
// Sheet 5 is a live open body, 6 a curve shape (it has a consumed member too, but is no body),
// 7 a solid with per-face colours (CC_DecoratedSolid is a CC_Solid subclass).
const sheets={revision:3,tree:{2:{id:2,class:'CC_Solid',members:{consumed:{value:1}}},3:{id:3,class:'CC_Solid',members:{consumed:{value:0}}},
 4:{id:4,class:'CC_Sheet',members:{consumed:{value:1}}},5:{id:5,class:'CC_Sheet',members:{consumed:{value:0}}},6:{id:6,class:'CC_CurveEntity',members:{consumed:{value:0}}},
 7:{id:7,class:'CC_DecoratedSolid',members:{consumed:{value:0}}}},
 graphic:{containers:[{owner:3,edges:[{id:7,points:[0,0,0,10,0,0]}]},{owner:4,edges:[{id:8,points:[-20,0,20,100,0,200]}]},{owner:5,edges:[{id:9,points:[0,0,0,0,0,30]}]}]}}
test('a sheet is a current body but no solid; a consumed sheet is neither',async()=>{
 assert.deepEqual(currentSolids(sheets),[3,7]);assert.deepEqual(currentBodies(sheets),[3,5,7])
 assert.deepEqual(graphicBounds(sheets,currentBodies(sheets)).max,[10,0,30])
 assert.deepEqual(graphicBounds(sheets).max,[100,0,200]) // unfiltered: the consumed sheet widens the box
 const session={getGraphic:async()=>sheets.graphic,getTree:async()=>sheets.tree,execute:async()=>({result:{volume:1},maxLevel:31})}
 assert.equal(buildScriptApi(session).inspect.currentBodies,currentBodies)
 assert.equal((await inspectSolid(session,3)).mass.volume,1)
 await assert.rejects(inspectSolid(session,5),/not a current unconsumed solid/) // mass properties need a solid
 await assert.rejects(inspectSolid(session,4),/not a current unconsumed solid/)
})
