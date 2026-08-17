// 06 — postTrim twice in a row (2nd = pure no-op, no further churn); bare postTrim (no preTrim) creates no container.
import { makeSketch, addSketch, line, positions, containers, vecApprox, firstError } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const consSet = tree => Object.values(tree || {}).filter(n => /Constraint/.test(n.class || '')).map(n => n.name + ':' + n.id).sort()
async function geomSnap(api, skId) { const g = (await api.v1.sketch.getGeometry({ id: skId })).result; const r = []; for (const id of g.lines) { const p = await positions(api, id); r.push(id + ':' + JSON.stringify([p.startPos, p.endPos])) } return r.sort() }

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  // RUN A: full cycle then postTrim again
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const oh = await segTouching(api, pre.result.find(e => e.sourceId === h), [0, 50, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [oh] })
  const rPost1 = await api.v1.sketch.postTrim({ id: skId })
  const geom1 = await geomSnap(api, skId); const cons1 = consSet(rPost1.structure?.tree)
  const rPost2 = await api.v1.sketch.postTrim({ id: skId }) // back-to-back
  const geom2 = await geomSnap(api, skId); const cons2 = consSet(rPost2.structure?.tree)
  const A = { post2Void: rPost2.result === null && rPost2.maxLevel <= 31, geomIdentical: JSON.stringify(geom1) === JSON.stringify(geom2), consIdentical: JSON.stringify(cons1) === JSON.stringify(cons2), cons1, cons2 }
  console.log('[06] A postTrim#2 max', rPost2.maxLevel, '| geom byte-identical?', A.geomIdentical, '| constraints unchanged?', A.consIdentical)
  console.log('[06] A cons after #1', JSON.stringify(cons1), '| after #2', JSON.stringify(cons2))

  // RUN B: bare postTrim (no preTrim)
  const skB = await addSketch(api, partId, planeId, 'B')
  await line(api, skB, [0, 50, 0], [100, 50, 0]); await line(api, skB, [50, 0, 0], [50, 100, 0])
  const contBefore = containers((await api.v1.sketch.getGeometry({ id: skB })).structure?.tree).length
  const rBare = await api.v1.sketch.postTrim({ id: skB })
  const contAfter = containers(rBare.structure?.tree).length
  const B = { max: rBare.maxLevel, err: firstError(rBare), noContainersCreated: contBefore === 0 && contAfter === 0 }
  console.log('[06] B bare postTrim max', rBare.maxLevel, '| containers before/after', contBefore, contAfter)

  filewrite({ A, B }, '06-idempotence')
  const checks = { A_post2NoOp: A.post2Void && A.geomIdentical && A.consIdentical, B_bareNoOp: B.max <= 31 && B.noContainersCreated }
  console.log('[06] CHECKS', JSON.stringify(checks))
  console.log('[06]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
