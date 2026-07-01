// 04 — HD_main survives split+trim+postTrim by NAME with a NEW id (name kept, id churned); dimensionCount stays 1;
// value re-anchors to the surviving segment (capture the number, don't assume).
import { makeSketch, line, positions, vecApprox } from './_setup.mjs'

const findDim = (tree, name) => Object.values(tree || {}).find(n => /FeatureDimension/.test(n.class || '') && n.name === name)
const countDims = tree => Object.values(tree || {}).filter(n => /FeatureDimension/.test(n.class || '')).length
async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const hp = (await api.v1.sketch.getPoints({ id: h })).result
  await api.v1.sketch.dimension({ id: skId, name: 'HD_main', type: 'HORIZONTAL_DISTANCE', geomIds: [hp.startId, hp.endId], value: 100 })
  const treeBefore = (await api.v1.sketch.getGeometry({ id: skId })).structure?.tree
  const dimBefore = findDim(treeBefore, 'HD_main')
  const dimCountBefore = countDims(treeBefore)
  console.log('[04] HD_main before: id', dimBefore?.id, 'dimCount', dimCountBefore)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  // trim the H segment RIGHT of the crossing (50..100) -> survivor is (0,50)->(50,50)
  const hRight = await segTouching(api, pre.result.find(e => e.sourceId === h), [100, 50, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [hRight] })
  const rPost = await api.v1.sketch.postTrim({ id: skId })

  const dimAfter = findDim(rPost.structure?.tree, 'HD_main')
  const dimCountAfter = countDims(rPost.structure?.tree)
  // measured distance the dimension now spans (read its displayInfo endpoints if present, else the H survivor)
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  let hSurv = null
  for (const id of geo.lines) { const p = await positions(api, id); if (Math.abs(p.startPos[1] - 50) < 1e-6 && Math.abs(p.endPos[1] - 50) < 1e-6) hSurv = p }
  const measuredDist = hSurv ? Math.abs(hSurv.endPos[0] - hSurv.startPos[0]) : null
  filewrite({ dimBeforeId: dimBefore?.id, dimAfterId: dimAfter?.id, dimCountBefore, dimCountAfter, measuredDist, hSurv }, '04-hd-survival')
  console.log('[04] HD_main after: present', !!dimAfter, 'id', dimAfter?.id, '(before', dimBefore?.id, ') dimCount', dimCountAfter)
  console.log('[04] H survivor length (re-anchored value):', measuredDist)

  const checks = {
    survivesByName: !!dimAfter,
    idChurned: dimAfter && dimAfter.id !== dimBefore.id,
    namePreserved: dimAfter?.name === 'HD_main',
    countStill1: dimCountAfter === 1,
  }
  console.log('[04] CHECKS', JSON.stringify(checks), '| re-anchor value =', measuredDist)
  console.log('[04]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, measuredDist }
}
