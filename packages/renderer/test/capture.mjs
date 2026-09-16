import {test} from 'node:test'
import assert from 'node:assert/strict'
import {fetchGraphic} from '../dist/node.js'
test('capture does not regenerate by default and never hides refresh failure',async()=>{
 const seen=[];const graphic={containers:[]}
 assert.equal(await fetchGraphic({getGraphic:async o=>{seen.push(o);return graphic}}),graphic)
 assert.deepEqual(seen,[{recalc:false}])
 await assert.rejects(fetchGraphic({getGraphic:async()=>{throw Error('lost worker')},getLastGraphic:()=>({containers:[{}]})}),/lost worker/)
})
