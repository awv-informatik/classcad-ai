// 06 — stale-dead id, mixed valid+bogus (atomic, survivor measured), mixed valid+sourceId, re-trim already-trimmed.
import { makeSketch, addSketch, line, positions, firstError, vecApprox } from './_setup.mjs'

const lastCode = r => { const e = firstError(r); return e[e.length - 1]?.code }

export default async function run(api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: stale-dead seg id (killed by re-preTrim)
  await line(api, skId, [0, 50, 0], [100, 50, 0]); await line(api, skId, [50, 0, 0], [50, 100, 0])
  const preA1 = await api.v1.sketch.preTrim({ id: skId })
  const segX = preA1.result[0].splittedCurves[0].id
  await api.v1.sketch.preTrim({ id: skId }) // re-preTrim -> segX now dead
  const rStale = await api.v1.sketch.trim({ id: skId, curveIds: [segX] })
  console.log('[06] A stale-dead trim([deadSeg]) max', rStale.maxLevel, 'code', lastCode(rStale))
  await api.v1.sketch.postTrim({ id: skId })

  // B: mixed valid+bogus -> atomic, valid survives with measured endpoints
  const skB = await addSketch(api, partId, planeId, 'B')
  await line(api, skB, [0, 50, 0], [100, 50, 0]); await line(api, skB, [50, 0, 0], [50, 100, 0])
  const preB = await api.v1.sketch.preTrim({ id: skB })
  const vSeg = preB.result[0].splittedCurves[0].id
  const vSegPosBefore = await positions(api, vSeg)
  const rMixBogus = await api.v1.sketch.trim({ id: skB, curveIds: [vSeg, 999999] })
  const vSegPosAfter = await positions(api, vSeg)
  const survived = vSegPosAfter.maxLevel <= 31 && vecApprox(vSegPosAfter.startPos, vSegPosBefore.startPos) && vecApprox(vSegPosAfter.endPos, vSegPosBefore.endPos)
  console.log('[06] B mixed valid+bogus max', rMixBogus.maxLevel, 'code', lastCode(rMixBogus), '| validSeg survived+untouched?', survived)

  // C: mixed valid+sourceId -> poison or trim-valid?
  const skC = await addSketch(api, partId, planeId, 'C')
  const hC = await line(api, skC, [0, 50, 0], [100, 50, 0]); await line(api, skC, [50, 0, 0], [50, 100, 0])
  const preC = await api.v1.sketch.preTrim({ id: skC })
  const vSegC = preC.result.find(e => e.sourceId === hC).splittedCurves[0].id
  const rMixSrc = await api.v1.sketch.trim({ id: skC, curveIds: [vSegC, hC] }) // hC is an original sourceId
  const vSegCDead = (await positions(api, vSegC)).maxLevel >= 51
  console.log('[06] C mixed valid+sourceId max', rMixSrc.maxLevel, 'code', lastCode(rMixSrc), '| validSeg trimmed?', vSegCDead, '(poison vs per-element no-op)')

  // D: re-trim already-trimmed (not yet committed)
  const skD = await addSketch(api, partId, planeId, 'D')
  await line(api, skD, [0, 50, 0], [100, 50, 0]); await line(api, skD, [50, 0, 0], [50, 100, 0])
  const preD = await api.v1.sketch.preTrim({ id: skD })
  const sD = preD.result[0].splittedCurves[0].id
  const rT1 = await api.v1.sketch.trim({ id: skD, curveIds: [sD] })
  const rT2 = await api.v1.sketch.trim({ id: skD, curveIds: [sD] }) // re-trim
  console.log('[06] D re-trim: t1 max', rT1.maxLevel, '| t2(already-trimmed) max', rT2.maxLevel, 'code', lastCode(rT2))

  filewrite({ staleCode: lastCode(rStale), staleMax: rStale.maxLevel, mixBogusMax: rMixBogus.maxLevel, survived, mixSrcMax: rMixSrc.maxLevel, vSegCDead, reTrim2Max: rT2.maxLevel, reTrim2Code: lastCode(rT2) }, '06-atomicity')
  const checks = {
    mixedBogusAtomic: rMixBogus.maxLevel >= 51 && survived,
  }
  console.log('[06] CHECKS', JSON.stringify(checks))
  console.log('[06] verdicts -> stale-dead:', rStale.maxLevel >= 51 ? '1006' : 'mL31 no-op',
    '| mixed-source:', vSegCDead ? 'trimmed-valid(per-element)' : (rMixSrc.maxLevel >= 51 ? 'poison' : 'no-op'),
    '| re-trim:', rT2.maxLevel >= 51 ? '1006' : 'mL31 no-op')
  return { checks }
}
