// 03 — do DIMENSIONS travel with a copy? Use a clean single-geom dimension (circle RADIUS) and dump the EXACT
// class names of every constraint/dimension node before and after copyGeometry(true), so we can see duplication.
import { makeSketch } from './_setup.mjs'

const nonGeom = tree => Object.values(tree || {})
  .filter(n => /Constraint|Dim|Radius|Distance|Angle/i.test(n.class || ''))
  .map(n => n.class)
  .reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {})

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api, { name: 'CopyDim' })
  const c = (await api.v1.sketch.circle({ id: skId, centerPos: [10, 10, 0], radius: 5 })).result
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [c], value: 5 })
  const before = nonGeom(dimR?.structure?.tree)

  const rTrue = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [c], translation: [40, 0, 0] })       // default true
  const afterTrue = nonGeom(rTrue?.structure?.tree)
  const rFalse = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [c], translation: [0, 40, 0], doCopyConstraints: false })
  const afterFalse = nonGeom(rFalse?.structure?.tree)

  const out = { before, afterTrue, afterFalse, dimResult: dimR?.result }
  filewrite(out, '03-dim-classes')
  console.log('[03] before    ', JSON.stringify(before))
  console.log('[03] afterTrue ', JSON.stringify(afterTrue))
  console.log('[03] afterFalse', JSON.stringify(afterFalse))
  return out
}
