// 04 — arg-shape validation: empty [] (safe no-op, NOT trim-all), missing curveIds, missing id, duplicate [s,s].
import { makeSketch, line, positions, firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  await line(api, skId, [0, 50, 0], [100, 50, 0])
  await line(api, skId, [50, 0, 0], [50, 100, 0])
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const segs = pre.result.flatMap(e => e.splittedCurves.map(s => s.id))
  const allAlive = async () => { let n = 0; for (const id of segs) if ((await positions(api, id)).maxLevel <= 31) n++; return n }

  // (a) empty []
  const rEmpty = await api.v1.sketch.trim({ id: skId, curveIds: [] })
  const aliveAfterEmpty = await allAlive()
  console.log('[04] (a) trim([]) max', rEmpty.maxLevel, 'err', JSON.stringify(firstError(rEmpty)), '| segs alive', aliveAfterEmpty, '/', segs.length, '(NOT trim-all)')

  // (b) missing curveIds
  const rNoCurve = await api.v1.sketch.trim({ id: skId })
  console.log('[04] (b) trim({id}) missing curveIds max', rNoCurve.maxLevel, 'err', JSON.stringify(firstError(rNoCurve)))

  // (c) missing id
  const rNoId = await api.v1.sketch.trim({ curveIds: [segs[0]] })
  console.log('[04] (c) trim missing id max', rNoId.maxLevel, 'err', JSON.stringify(firstError(rNoId)))

  // (d) duplicate [s,s] -> idempotent
  const s = segs[0]
  const rDup = await api.v1.sketch.trim({ id: skId, curveIds: [s, s] })
  const othersAlive = []
  for (const id of segs.slice(1)) othersAlive.push((await positions(api, id)).maxLevel)
  await api.v1.sketch.postTrim({ id: skId })
  console.log('[04] (d) trim([s,s]) dup max', rDup.maxLevel, '| other 3 segs alive', JSON.stringify(othersAlive))

  filewrite({ rEmpty: rEmpty.maxLevel, aliveAfterEmpty, rNoCurve: { max: rNoCurve.maxLevel, err: firstError(rNoCurve) }, rNoId: { max: rNoId.maxLevel, err: firstError(rNoId) }, rDup: rDup.maxLevel, othersAlive }, '04-argshape')
  const checks = {
    emptyNoOp: rEmpty.maxLevel <= 31 && aliveAfterEmpty === segs.length,
    missingId_1004: rNoId.maxLevel >= 51 && firstError(rNoId).some(e => e.code === 1004),
    dup_idempotent: rDup.maxLevel <= 31 && othersAlive.every(m => m <= 31),
  }
  console.log('[04] CHECKS', JSON.stringify(checks), '| missingCurveIds verdict:', rNoCurve.maxLevel >= 51 ? 'error '+JSON.stringify(firstError(rNoCurve).map(e=>e.code)) : 'no-op(mL31)')
  console.log('[04]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, missingCurveIdsMax: rNoCurve.maxLevel }
}
