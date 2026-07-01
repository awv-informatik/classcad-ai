// 05 — no-trim postTrim + trim([])->postTrim restore original ids UNCHANGED and coords byte-exact; containers cleaned;
// does the dimension id churn on a no-trim postTrim (geometry-ids-stable-but-handles-recreated asymmetry)?
import { makeSketch, addSketch, line, positions, containers, vecApprox } from './_setup.mjs'

const findDim = (tree, name) => Object.values(tree || {}).find(n => /FeatureDimension/.test(n.class || '') && n.name === name)

async function snapshot(api, skId) {
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const rows = []
  for (const id of geo.lines) { const p = await positions(api, id); rows.push({ id, s: p.startPos, e: p.endPos }) }
  return { ids: geo.lines.slice().sort(), rows }
}
const sameGeom = (a, b) => JSON.stringify(a.ids) === JSON.stringify(b.ids) &&
  a.rows.every(r => { const m = b.rows.find(x => x.id === r.id); return m && vecApprox(r.s, m.s) && vecApprox(r.e, m.e) })

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  // RUN A: no-trim postTrim
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const hp = (await api.v1.sketch.getPoints({ id: h })).result
  await api.v1.sketch.dimension({ id: skId, name: 'HD_A', type: 'HORIZONTAL_DISTANCE', geomIds: [hp.startId, hp.endId], value: 100 })
  const dimIdBefore = findDim((await api.v1.sketch.getGeometry({ id: skId })).structure?.tree, 'HD_A')?.id
  const preSnap = await snapshot(api, skId)
  await api.v1.sketch.preTrim({ id: skId })
  const rPostA = await api.v1.sketch.postTrim({ id: skId }) // NO trim
  const postSnap = await snapshot(api, skId)
  const contsA = containers(rPostA.structure?.tree).map(c => c.name)
  const dimIdAfter = findDim(rPostA.structure?.tree, 'HD_A')?.id
  const A = { idsUnchanged: sameGeom(preSnap, postSnap), containersCleaned: contsA.length === 0, dimIdBefore, dimIdAfter, dimChurned: dimIdBefore !== dimIdAfter }
  console.log('[05] A no-trim: geometry ids+coords unchanged?', A.idsUnchanged, '| containers cleaned?', A.containersCleaned)
  console.log('[05] A dimension id', dimIdBefore, '->', dimIdAfter, '| churned on no-trim?', A.dimChurned)

  // RUN B: trim([]) -> postTrim
  const skB = await addSketch(api, partId, planeId, 'B')
  await line(api, skB, [0, 50, 0], [100, 50, 0]); await line(api, skB, [50, 0, 0], [50, 100, 0])
  const preSnapB = await snapshot(api, skB)
  await api.v1.sketch.preTrim({ id: skB })
  await api.v1.sketch.trim({ id: skB, curveIds: [] })
  const rPostB = await api.v1.sketch.postTrim({ id: skB })
  const postSnapB = await snapshot(api, skB)
  const B = { idsUnchanged: sameGeom(preSnapB, postSnapB), containersCleaned: containers(rPostB.structure?.tree).map(c => c.name).length === 0 }
  console.log('[05] B trim([]): geometry ids+coords unchanged?', B.idsUnchanged, '| containers cleaned?', B.containersCleaned)

  filewrite({ A, B, preSnap, postSnap }, '05-restore')
  const checks = { A_restore: A.idsUnchanged && A.containersCleaned, B_restore: B.idsUnchanged && B.containersCleaned }
  console.log('[05] CHECKS', JSON.stringify(checks), '| dim churn on no-trim:', A.dimChurned)
  console.log('[05]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, dimChurnedOnNoTrim: A.dimChurned }
}
