// 05d — find the safe multi-case structure under the "one part.create per run" constraint.
// Regime C: one part, MANY sketches (no 2nd part.create).
// Regime D: one part, one sketch, MANY lines + a splitCurve per line.
import { firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const log = []
  const partR = await api.v1.part.create({ name: 'Viable' })
  const partId = partR.result
  const top = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  console.log('[05d] partId', partId, 'topId', top?.id)

  // Regime C: 3 sketches on the one part, each split independently
  for (let i = 0; i < 3; i++) {
    const skR = await api.v1.sketch.create({ id: partId, planeId: top.id, name: 'C' + i })
    const skId = skR.result
    const lId = (await api.v1.sketch.line({ id: skId, startPos: [0, i * 10, 0], endPos: [100, i * 10, 0] })).result
    const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: lId, values: [0.5] }] })
    const row = { regime: 'C', i, skId, skMax: skR.maxLevel, lId, splitMax: r.maxLevel, splitOk: Array.isArray(r.result), segs: r.result?.[0]?.splittedCurves?.length, err: Array.isArray(r.result) ? [] : firstError(r) }
    console.log('[05d]', JSON.stringify(row))
    log.push(row)
  }

  // Regime D: one sketch, 3 independent lines, split each
  const skR = await api.v1.sketch.create({ id: partId, planeId: top.id, name: 'D' })
  const skD = skR.result
  for (let i = 0; i < 3; i++) {
    const lId = (await api.v1.sketch.line({ id: skD, startPos: [0, 50 + i * 10, 0], endPos: [100, 50 + i * 10, 0] })).result
    const r = await api.v1.sketch.splitCurve({ id: skD, splits: [{ geomId: lId, values: [0.25, 0.75] }] })
    const row = { regime: 'D', i, skId: skD, lId, splitMax: r.maxLevel, splitOk: Array.isArray(r.result), segs: r.result?.[0]?.splittedCurves?.length, err: Array.isArray(r.result) ? [] : firstError(r) }
    console.log('[05d]', JSON.stringify(row))
    log.push(row)
  }

  filewrite(log, '05d-regimes')
  return { allOk: log.every(r => r.splitOk) }
}
