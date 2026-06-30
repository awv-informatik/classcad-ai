// 10 — trim footguns: (A) bogus id -> atomic mL51 1006, valid seg NOT trimmed; (B) ORIGINAL sourceId ->
// silent no-op mL31 (removes nothing); (C) multiple trim() before one postTrim works.
import { makeSketch, addSketch, line, positions, firstError, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const crossed = async (api, sk) => ({ A: await line(api, sk, [0, 0, 0], [100, 100, 0]), B: await line(api, sk, [0, 100, 0], [100, 0, 0]) })

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: trim([validSeg, 999999]) -> atomic fail, valid seg survives postTrim
  const a = await crossed(api, skId)
  const preA = await api.v1.sketch.preTrim({ id: skId })
  const validSeg = await segTouching(api, preA.result.find(e => e.sourceId === a.A), [0, 0, 0])
  const rA = await api.v1.sketch.trim({ id: skId, curveIds: [validSeg, 999999] })
  await api.v1.sketch.postTrim({ id: skId })
  const geoA = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  const A = { trimMax: rA.maxLevel, err: firstError(rA), bothLinesBack: geoA.length === 2 }
  console.log('[10] A trim([valid,999999]) max', rA.maxLevel, 'err', JSON.stringify(A.err), '| atomic (both lines back)?', A.bothLinesBack, 'lines', geoA.length)

  // B: trim([originalLineId]) -> silent no-op
  const skB = await addSketch(api, partId, planeId, 'B')
  const b = await crossed(api, skB)
  await api.v1.sketch.preTrim({ id: skB })
  const rB = await api.v1.sketch.trim({ id: skB, curveIds: [b.A] }) // original id, not a staged seg
  await api.v1.sketch.postTrim({ id: skB })
  const geoB = (await api.v1.sketch.getGeometry({ id: skB })).result.lines
  const B = { trimMax: rB.maxLevel, err: firstError(rB), nothingRemoved: geoB.length === 2 }
  console.log('[10] B trim([originalId]) max', rB.maxLevel, 'err', JSON.stringify(B.err), '| FOOTGUN nothing removed?', B.nothingRemoved, 'lines', geoB.length)

  // C: 3 segs (one line + 2 verticals); two trim() calls remove both END segs; middle survives
  const skC = await addSketch(api, partId, planeId, 'C')
  const lng = await line(api, skC, [0, 50, 0], [120, 50, 0])
  await line(api, skC, [40, 0, 0], [40, 100, 0])
  await line(api, skC, [80, 0, 0], [80, 100, 0])
  const preC = await api.v1.sketch.preTrim({ id: skC })
  const lngE = preC.result.find(e => e.sourceId === lng)
  const leftSeg = await segTouching(api, lngE, [0, 50, 0])
  const rightSeg = await segTouching(api, lngE, [120, 50, 0])
  const t1 = await api.v1.sketch.trim({ id: skC, curveIds: [leftSeg] })
  const t2 = await api.v1.sketch.trim({ id: skC, curveIds: [rightSeg] })
  await api.v1.sketch.postTrim({ id: skC })
  const geoC = (await api.v1.sketch.getGeometry({ id: skC })).result
  const survivor = []
  for (const id of geoC.lines) { const p = await positions(api, id); survivor.push({ id, start: p.startPos, end: p.endPos }) }
  const middle = survivor.find(s => (vecApprox(s.start, [40, 50, 0]) && vecApprox(s.end, [80, 50, 0])) || (vecApprox(s.start, [80, 50, 0]) && vecApprox(s.end, [40, 50, 0])))
  const C = { t1Max: t1.maxLevel, t2Max: t2.maxLevel, survivors: survivor, middlePresent: !!middle }
  console.log('[10] C two-trim: t1', t1.maxLevel, 't2', t2.maxLevel, '| middle (40,50)-(80,50) survives?', C.middlePresent, JSON.stringify(survivor))

  filewrite({ A, B, C }, '10-footguns')
  const checks = {
    A_atomicFail: A.trimMax >= 51 && A.bothLinesBack,
    B_silentNoOp: B.trimMax <= 31 && B.nothingRemoved,
    C_multiTrim: C.t1Max <= 31 && C.t2Max <= 31 && C.middlePresent,
  }
  console.log('[10] CHECKS', JSON.stringify(checks))
  console.log('[10]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
