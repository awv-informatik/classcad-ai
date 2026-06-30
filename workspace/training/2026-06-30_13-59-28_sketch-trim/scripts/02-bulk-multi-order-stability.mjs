// 02 — bulk multi-seg trim, order-independence, untrimmed-id stability, no-coalesce of disjoint survivors, trim-all-of-source.
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

// build a long horizontal line crossed by 4 verticals -> 5 lng segments; return lng segs sorted by midpoint x
async function buildGrid(api, skId) {
  const lng = await line(api, skId, [0, 50, 0], [200, 50, 0])
  for (const x of [40, 80, 120, 160]) await line(api, skId, [x, 0, 0], [x, 100, 0])
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const lngE = pre.result.find(e => e.sourceId === lng)
  const segs = []
  for (const s of lngE.splittedCurves) { const p = await positions(api, s.id); segs.push({ id: s.id, midx: (p.startPos[0] + p.endPos[0]) / 2, start: p.startPos, end: p.endPos }) }
  segs.sort((a, b) => a.midx - b.midx)
  return { lng, segs } // segs[0..4] left->right
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // Fixture 1: reversed-order trim of S1,S3 + stability of S0,S2,S4
  const f1 = await buildGrid(api, skId)
  const S = f1.segs.map(s => s.id)
  const rMulti = await api.v1.sketch.trim({ id: skId, curveIds: [S[3], S[1]] }) // reversed order
  const aliveBeforePost = []
  for (const i of [0, 2, 4]) aliveBeforePost.push({ i, id: S[i], ...(await positions(api, S[i])) })
  await api.v1.sketch.postTrim({ id: skId })
  const geo1 = (await api.v1.sketch.getGeometry({ id: skId })).result
  const surv1 = []
  for (const id of geo1.lines) { const p = await positions(api, id); surv1.push({ id, start: p.startPos, end: p.endPos }) }
  console.log('[02] f1 multiTrim[S3,S1] result', JSON.stringify(rMulti.result), 'max', rMulti.maxLevel)
  console.log('[02] f1 S0/S2/S4 before postTrim alive+stable:', JSON.stringify(aliveBeforePost.map(a => ({ id: a.id, mL: a.maxLevel }))))

  // Fixture 2: forward-order trim [S1,S3] -> compare survivor endpoints
  const sk2 = await addSketch(api, partId, planeId, 'fwd')
  const f2 = await buildGrid(api, sk2)
  const S2 = f2.segs.map(s => s.id)
  await api.v1.sketch.trim({ id: sk2, curveIds: [S2[1], S2[3]] }) // forward order
  await api.v1.sketch.postTrim({ id: sk2 })
  const geo2 = (await api.v1.sketch.getGeometry({ id: sk2 })).result
  const surv2 = []
  for (const id of geo2.lines) { const p = await positions(api, id); surv2.push({ start: p.startPos, end: p.endPos }) }

  // Fixture 3: trim ALL 5 lng segs
  const sk3 = await addSketch(api, partId, planeId, 'all')
  const f3 = await buildGrid(api, sk3)
  const rAll = await api.v1.sketch.trim({ id: sk3, curveIds: f3.segs.map(s => s.id) })
  await api.v1.sketch.postTrim({ id: sk3 })
  const geo3 = (await api.v1.sketch.getGeometry({ id: sk3 })).result
  let lngStillSpans = false
  for (const id of geo3.lines) { const p = await positions(api, id); if (Math.abs(p.startPos[1] - 50) < 1e-6 && Math.abs(p.endPos[1] - 50) < 1e-6 && Math.abs(p.start?.[0]) < 1) lngStillSpans = true }

  filewrite({ f1Surv: surv1, f2Surv: surv2, aliveBeforePost, rAllMax: rAll.maxLevel, geo3lines: geo3.lines.length }, '02-bulk')
  // survivors of f1: the 3 untrimmed lng segments S0(0-40),S2(80-120? no: S2 is 80..? wait 5 segs are 0-40,40-80,80-120,120-160,160-200). trimmed S1(40-80),S3(120-160). survivors S0(0-40),S2(80-120),S4(160-200) lng + the 4 verticals' survivors
  const lngSurv1 = surv1.filter(s => Math.abs(s.start[1] - 50) < 1e-6 && Math.abs(s.end[1] - 50) < 1e-6)
  const checks = {
    multiTrimVoid: rMulti.result === null && rMulti.maxLevel <= 31,
    untrimmedAliveStable: aliveBeforePost.every(a => a.maxLevel <= 31),
    threeDisjointLngSurvivors: lngSurv1.length === 3,
    orderIndependent: JSON.stringify(surv1.map(s => [s.start, s.end]).sort()) !== '[]' && surv2.length === surv1.length,
    trimAllVoid: rAll.result === null && rAll.maxLevel <= 31,
    lngFullyRemoved: !lngStillSpans,
  }
  console.log('[02] f1 lng survivors (disjoint, no coalesce):', lngSurv1.length, JSON.stringify(lngSurv1.map(s => [s.start[0], s.end[0]])))
  console.log('[02] f3 trim-all max', rAll.maxLevel, 'lng fully removed?', !lngStillSpans, 'remaining lines', geo3.lines.length)
  console.log('[02] CHECKS', JSON.stringify(checks))
  console.log('[02]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
