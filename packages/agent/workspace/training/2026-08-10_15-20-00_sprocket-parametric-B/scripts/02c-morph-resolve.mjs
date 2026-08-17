/**
 * 02c — does the expression-cascade fully re-solve a constrained sketch?
 * Build 21T → morph teeth→24 → measure → then try re-solve triggers:
 *   T1: common.recalc
 *   T2: value-changing updateDimension nudge (dRseat +0.001 → back)
 *   T3: re-bind a dim to its expression via updateDimension('@expr...')
 * Measure worst junction error after each. Also scan lgsState for losers.
 */
import { EXPRESSIONS, buildParametricToothSketch, verifyAgainstAnalytic } from './_sketchB.mjs'

export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'MorphSolve' })
  const partId = partR.result
  const right = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Right').id
  await api.v1.part.expression({ id: partId, toCreate: EXPRESSIONS })
  const b = await buildParametricToothSketch(api, partId, right, { seedN: 21, perturb: true })
  if (b.error) throw new Error('build failed: ' + JSON.stringify(b.error))
  const v21 = await verifyAgainstAnalytic(api, b.junctions, 21, '21T baseline')

  const lgsScan = (structure) => {
    const bad = []
    for (const n of Object.values(structure?.tree ?? {}))
      if (n.class?.includes('Constraint') && n.members?.lgsState?.value === 0) bad.push(n.name ?? n.id)
    return bad
  }

  const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: 24 }] })
  const v0 = await verifyAgainstAnalytic(api, b.junctions, 24, 'after cascade')
  const losers0 = lgsScan(up.structure)
  console.log('[02c] losers after cascade:', JSON.stringify(losers0))

  await api.v1.common.recalc({})
  const v1 = await verifyAgainstAnalytic(api, b.junctions, 24, 'T1 after recalc')

  const n1 = await api.v1.sketch.updateDimension({ id: b.dims.dRseat, value: 2.6 })
  const n2 = await api.v1.sketch.updateDimension({ id: b.dims.dRseat, value: '@expr.Rseat' })
  console.log('[02c] nudge results:', n1.result, n2.result)
  const v2 = await verifyAgainstAnalytic(api, b.junctions, 24, 'T2 after dim nudge+rebind')
  const losers2 = lgsScan(n2.structure)
  console.log('[02c] losers after nudge:', JSON.stringify(losers2))

  const out = { v21: v21.worst, afterCascade: v0.worst, afterRecalc: v1.worst, afterNudge: v2.worst, losers0, losers2 }
  filewrite(out, 'morph-resolve')
  return out
}
