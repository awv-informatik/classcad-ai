/**
 * 02 (variant B) — the constrained, expression-driven tooth-space sketch alone:
 * 1. build from PERTURBED seeds → solver must land the exact ANSI 21T layout
 * 2. THE parametric acid test: updateExpression teeth 21→24 → every dim
 *    cascades → sketch must re-solve onto the exact 24T layout
 * 3. extrude the re-solved profile → volume vs analytic 24T area
 */
import { EXPRESSIONS, buildParametricToothSketch, verifyAgainstAnalytic, analytic } from './_sketchB.mjs'
import { polygonizeSpace, polyArea, inch } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ParamTooth' })
  const partId = partR.result
  const right = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Right').id

  const eR = await api.v1.part.expression({ id: partId, toCreate: EXPRESSIONS })
  if (eR.maxLevel > 31) { filewrite(eR.messages, 'expr-errors'); throw new Error('expressions failed') }
  const rp = (await api.v1.part.getExpression({ id: partId, name: 'Rp' })).result
  console.log('[02] expression graph up, Rp =', rp?.value, '(expect', (0.375 / (2 * Math.sin(Math.PI / 21)) * 25.4).toFixed(4), 'mm)')

  const b = await buildParametricToothSketch(api, partId, right, { seedN: 21, perturb: true })
  if (b.error) { filewrite(b.error, 'build-error'); throw new Error(`sketch build failed at ${b.error.stage}`) }
  console.log('[02] sketch built (perturbed seeds), dims:', Object.keys(b.dims).length)

  const v21 = await verifyAgainstAnalytic(api, b.junctions, 21, 'solved 21T from rough seeds')
  await snapshot('sketch-21T', { view: 'right' })

  // ---- acid test: change the ONE master parameter
  const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: 24 }] })
  console.log('[02] updateExpression teeth→24: maxLevel', up.maxLevel)
  const v24 = await verifyAgainstAnalytic(api, b.junctions, 24, 'after teeth→24 cascade')
  await snapshot('sketch-24T', { view: 'right' })

  // ---- emergent topping radius check (F_eff = |b−y|)
  const a24 = analytic(24)
  const bl = (await api.v1.sketch.getPositions({ id: b.junctions.bL })).result?.pos
  const yl = (await api.v1.sketch.getPositions({ id: b.junctions.yL })).result?.pos
  const Feff = Math.hypot(bl.x - yl.x, bl.y - yl.y) / inch
  console.log('[02] emergent topping radius:', Feff.toFixed(6), 'vs analytic F_eff', a24.tf.Feff.toFixed(6), 'vs published F', a24.tf.Fstd.toFixed(6))

  // ---- extrude the 24T profile, area check
  const ext = await api.v1.part.extrusion({ id: partId, name: 'Slab', references: b.profileRefs, type: 'SYMMETRIC', limit2: 2.54 })
  await api.v1.common.recalc({})
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const cadArea = mp.volume / inch ** 3 / 0.1
  const polyA = polyArea(polygonizeSpace(a24.tf))
  console.log(`[02] 24T slab area: CAD ${cadArea.toFixed(5)} vs analytic ${polyA.toFixed(5)} in² (dev ${((cadArea / polyA - 1) * 100).toFixed(3)}%)`)

  const report = {
    worst21mm: v21.worst, worst24mm: v24.worst,
    FeffEmergent: Feff, FeffAnalytic: a24.tf.Feff, Fpublished: a24.tf.Fstd,
    cadArea24: cadArea, polyArea24: polyA,
    extLevel: ext.maxLevel,
  }
  filewrite(report, 'param-sketch-report')
  if (v21.worst > 1e-6 || v24.worst > 1e-6) throw new Error('solved layout deviates from analytic')
  if (Math.abs(cadArea / polyA - 1) > 0.005) throw new Error('area deviation')
  return report
}
