// 21 — constraint/dimension fate across a split + is the sketch still solver-live afterward?
// Count constraint/dimension nodes in the structure tree before/after; try updateDimension after.
import { makeSketch, line, firstError } from './_setup.mjs'

const countByClass = (tree, re) => Object.values(tree || {}).filter(n => re.test(n.class || '')).length

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const pts = (await api.v1.sketch.getPoints({ id: l })).result

  // FIXATION on the start point + a HORIZONTAL_DISTANCE dimension between endpoints (value 100, name for re-fetch)
  const fix = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })
  const dim = await api.v1.sketch.dimension({ id: skId, name: 'LEN', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.startId, pts.endId], value: 100 })
  console.log('[21] fix', fix.result, 'dim', dim.result, 'dimMax', dim.maxLevel)

  const treeBefore = (await api.v1.sketch.getGeometry({ id: skId })).structure?.tree || {}
  const before = { constraints: countByClass(treeBefore, /Constraint/), dims: countByClass(treeBefore, /Dimension/) }

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.5] }] })
  const treeAfter = r.structure?.tree || (await api.v1.sketch.getGeometry({ id: skId })).structure?.tree || {}
  const after = { constraints: countByClass(treeAfter, /Constraint/), dims: countByClass(treeAfter, /Dimension/) }
  console.log('[21] split ok', Array.isArray(r.result), 'counts before', JSON.stringify(before), 'after', JSON.stringify(after))

  // Re-fetch the dimension by name and try to update it -> solver live?
  let upd = null
  try {
    upd = await api.v1.sketch.updateDimension({ id: skId, name: 'LEN', value: 80 })
  } catch (e) { upd = { threw: String(e) } }
  console.log('[21] updateDimension after split:', JSON.stringify(upd?.result ?? upd), 'max', upd?.maxLevel, 'err', JSON.stringify(upd ? firstError(upd) : null))

  filewrite({ fix: fix.result, dim: dim.result, before, after, updResult: upd?.result, updMax: upd?.maxLevel }, '21-survival')
  return { before, after, solverLive: upd?.result === 1 }
}
