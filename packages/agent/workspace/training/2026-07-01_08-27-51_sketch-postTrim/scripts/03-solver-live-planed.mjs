// 03 — after postTrim on a PLANED sketch, updateDimension re-solves AND geometry moves. Planeless control returns 0.
import { makeSketch, addPlanelessSketch, line, positions, vecApprox } from './_setup.mjs'

const findDim = (tree, name) => Object.values(tree || {}).find(n => /FeatureDimension/.test(n.class || '') && n.name === name)
async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const horiz = async (api, geo) => { for (const id of geo.lines) { const p = await positions(api, id); if (Math.abs(p.startPos[1] - 50) < 1e-6 && Math.abs(p.endPos[1] - 50) < 1e-6) return { id, ...p } } return null }

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api) // planed (Top)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const hp = (await api.v1.sketch.getPoints({ id: h })).result
  const dimR = await api.v1.sketch.dimension({ id: skId, name: 'HD_main', type: 'HORIZONTAL_DISTANCE', geomIds: [hp.startId, hp.endId], value: 100 })
  console.log('[03] dimension HD_main create max', dimR.maxLevel)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const vOverhang = await segTouching(api, pre.result.find(e => e.sourceId === v), [50, 0, 0]) // trim V bottom, keep H
  await api.v1.sketch.trim({ id: skId, curveIds: [vOverhang] })
  const rPost = await api.v1.sketch.postTrim({ id: skId })

  const dimNode = findDim(rPost.structure?.tree, 'HD_main')
  const hBefore = await horiz(api, (await api.v1.sketch.getGeometry({ id: skId })).result)
  const upd = await api.v1.sketch.updateDimension({ id: dimNode.id, value: 70 })
  const hAfter = await horiz(api, (await api.v1.sketch.getGeometry({ id: skId })).result)
  const lenAfter = hAfter ? Math.hypot(hAfter.endPos[0] - hAfter.startPos[0], hAfter.endPos[1] - hAfter.startPos[1]) : null
  console.log('[03] planed updateDimension result', JSON.stringify(upd.result), 'max', upd.maxLevel)
  console.log('[03] H length before', hBefore && Math.hypot(hBefore.endPos[0] - hBefore.startPos[0], 0), '-> after', lenAfter, '(target 70)')

  // planeless control
  const pl = await addPlanelessSketch(api, partId, 'pl')
  const hpl = await line(api, pl, [0, 50, 0], [100, 50, 0])
  const hplp = (await api.v1.sketch.getPoints({ id: hpl })).result
  await api.v1.sketch.dimension({ id: pl, name: 'HD_pl', type: 'HORIZONTAL_DISTANCE', geomIds: [hplp.startId, hplp.endId], value: 100 })
  const dimPl = findDim((await api.v1.sketch.getGeometry({ id: pl })).structure?.tree, 'HD_pl')
  const updPl = await api.v1.sketch.updateDimension({ id: dimPl.id, value: 70 })
  const hplAfter = await horiz(api, (await api.v1.sketch.getGeometry({ id: pl })).result)
  const lenPl = hplAfter ? Math.abs(hplAfter.endPos[0] - hplAfter.startPos[0]) : null
  console.log('[03] planeless updateDimension result', JSON.stringify(updPl.result), '| H length', lenPl, '(unmoved=100 expected)')

  filewrite({ planedUpd: upd.result, lenAfter, planelessUpd: updPl.result, lenPl }, '03-solver')
  const checks = {
    planedSolved: upd.result === 1 || upd.result === 2,
    planedGeometryMoved: lenAfter != null && Math.abs(lenAfter - 70) < 1e-4,
    planelessDidNotSolve: updPl.result === 0 || updPl.result === false || lenPl == null || Math.abs(lenPl - 70) > 1,
  }
  console.log('[03] CHECKS', JSON.stringify(checks))
  console.log('[03]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
