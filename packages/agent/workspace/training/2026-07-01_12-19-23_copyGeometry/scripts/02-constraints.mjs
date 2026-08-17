// 02 — does doCopyConstraints actually duplicate constraints/dimensions? Count constraint & dimension nodes in
// the structure tree before/after copying with true vs false. Also: what response fields carry the tree?
import { makeSketch } from './_setup.mjs'

// classify tree nodes: geometry vs constraint vs dimension vs point/other
function census(tree) {
  const c = { CC_Line: 0, CC_Circle: 0, CC_Arc: 0, CC_Point: 0, constraint: 0, dimension: 0, other: {} }
  for (const n of Object.values(tree || {})) {
    const cls = n.class || ''
    if (cls in c) c[cls]++
    else if (/Constraint/i.test(cls)) c.constraint++
    else if (/Dim(ension)?/i.test(cls)) c.dimension++
    else c.other[cls] = (c.other[cls] || 0) + 1
  }
  return c
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api, { name: 'CopyConstr' })
  // two joined lines + a coincident (auto) + an explicit dimension + a perpendicular constraint
  const a = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [30, 0, 0] })).result
  const b = (await api.v1.sketch.line({ id: skId, startPos: [30, 0, 0], endPos: [30, 20, 0] })).result
  await api.v1.sketch.constraint([{ id: skId, type: 'PERPENDICULAR', geomIds: [a, b] }])
  await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [a], value: 30 })

  const q = async () => census((await api.v1.part.get?.({ id: skId }))?.structure?.tree || (await api.v1.sketch.getGeometry({ id: skId }))?.structure?.tree)
  // getGeometry may not carry the tree; grab the tree from a fresh mutating call's structure instead.
  const treeFrom = r => r?.structure?.tree
  const base = census(treeFrom(await api.v1.sketch.constraint([{ id: skId, type: 'HORIZONTAL', geomIds: [a] }])) || {})

  const rTrue = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [a, b], translation: [0, 60, 0] })          // default true
  const afterTrue = census(treeFrom(rTrue))
  const rFalse = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [a, b], translation: [60, 0, 0], doCopyConstraints: false }) // false
  const afterFalse = census(treeFrom(rFalse))

  const out = {
    responseKeys: { true: Object.keys(rTrue || {}), false: Object.keys(rFalse || {}) },
    hasStructure: { true: !!rTrue?.structure, false: !!rFalse?.structure },
    base, afterTrue, afterFalse,
    note: 'compare constraint/dimension counts: base -> afterTrue (should grow if constraints copied) -> afterFalse',
  }
  filewrite(out, '02-constraints')
  console.log('[02] base       ', JSON.stringify(base))
  console.log('[02] afterTrue  ', JSON.stringify(afterTrue))
  console.log('[02] afterFalse ', JSON.stringify(afterFalse))
  console.log('[02] response keys true=', out.responseKeys.true, 'false=', out.responseKeys.false)
  return out
}
