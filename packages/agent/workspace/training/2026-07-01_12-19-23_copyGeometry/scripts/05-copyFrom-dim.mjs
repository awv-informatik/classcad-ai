// 05 — does copyFrom copy the DRIVING dimension annotation (CC_RadialFeatureDimension), or only the underlying
// constraint (CC_2DRadiusConstraint)? copyGeometry(true) copied only the constraint. Compare copyFrom here.
import { makeSketch, addSketch } from './_setup.mjs'

const dimCensus = tree => Object.values(tree || {})
  .filter(n => /Radius|Dimension|RadialFeature/i.test(n.class || ''))
  .map(n => n.class).reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {})

export default async function (api, { filewrite }) {
  const { partId, skId: src, planeId } = await makeSketch(api, { name: 'CopyFromDim' })
  const c = (await api.v1.sketch.circle({ id: src, centerPos: [10, 10, 0], radius: 5 })).result
  const dimR = await api.v1.sketch.dimension({ id: src, type: 'RADIUS', geomIds: [c], value: 5 })
  const before = dimCensus(dimR?.structure?.tree)

  const dst = await addSketch(api, partId, planeId, 'DST')
  const r = await api.v1.sketch.copyFrom({ id: dst, toCopyId: src })
  const after = dimCensus(r?.structure?.tree)

  const out = { before, after, note: 'copyGeometry(true) gave RadiusConstraint 1->2 but RadialFeatureDimension stayed 1; compare copyFrom' }
  filewrite(out, '05-copyFrom-dim')
  console.log('[05] before', JSON.stringify(before))
  console.log('[05] after ', JSON.stringify(after))
  return out
}
