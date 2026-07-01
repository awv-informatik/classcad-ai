// 01b — resolve the render-vs-data conflict: measure the SURVIVOR arc geometry directly from the structure tree.
// If survivors are C1-outer (center 0,0, major arc) + C2-outer (center 60,0, major arc) => union is correct, render lies.
import { makeSketch, circle, positions } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

const arcNode = (tree, id) => { const n = tree?.[id]; return n ? { id, class: n.class, members: n.members } : null }

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const C1 = await circle(api, skId, [0, 0, 0], 50)
  const C2 = await circle(api, skId, [60, 0, 0], 50)
  const srcMap = { [C1]: { type: 'circle', c: [0, 0], r: 50 }, [C2]: { type: 'circle', c: [60, 0], r: 50 } }
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { trim } = await classify(api, pre.result, srcMap, shapes, { keepRule: UNION_OUTLINE })
  console.log('[01b] trimming (inner):', JSON.stringify(trim))

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const tree = rPost.structure?.tree || (await api.v1.sketch.getGeometry({ id: skId })).structure?.tree

  // dump each survivor arc node so we can read center/radius/angles
  const survivors = []
  for (const id of geo.arcs || []) {
    const n = arcNode(tree, id)
    const pr = await positions(api, id)
    survivors.push({ id, class: n?.class, members: n?.members, endpoints: [pr.startPos, pr.endPos] })
  }
  filewrite({ survivorArcIds: geo.arcs, survivors }, '01b-survivor-arcs')
  for (const s of survivors) {
    console.log(`[01b] arc ${s.id} class ${s.class} endpoints ${JSON.stringify(s.endpoints)}`)
    console.log(`[01b]   members keys: ${Object.keys(s.members || {}).join(',')}`)
    // print any center/radius/angle-ish members
    for (const [k, v] of Object.entries(s.members || {})) {
      if (/cent|rad|angle|start|end|clock|dir/i.test(k)) console.log(`[01b]   ${k} = ${JSON.stringify(v.value ?? v)}`)
    }
  }
  return { survivorArcIds: geo.arcs }
}
