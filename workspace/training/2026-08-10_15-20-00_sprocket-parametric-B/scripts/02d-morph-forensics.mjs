/**
 * 02d — forensics on the frozen-cluster state + two repair strategies:
 *   facts: is JxL coincidence violated in data? |a−c| vs E−R? arc radii? lgs dump
 *   R1: updateDimension nudge ON the working-arc subsystem (dMcL)
 *   R2: fresh sketch, morph in SMALL steps 21→22→23→24
 */
import { EXPRESSIONS, buildParametricToothSketch, verifyAgainstAnalytic } from './_sketchB.mjs'
import { inch } from './_model.mjs'

export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'Forensics' })
  const partId = partR.result
  const right = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Right').id
  await api.v1.part.expression({ id: partId, toCreate: EXPRESSIONS })
  const b = await buildParametricToothSketch(api, partId, right, { seedN: 21, perturb: true })
  if (b.error) throw new Error('build failed')
  const pos = async (id) => {
    const p = (await api.v1.sketch.getPositions({ id })).result?.pos
    return p ? [p.z, -p.y] : null // world→local (Right plane)
  }
  const pRoot = (await api.v1.sketch.getPoints({ id: b.ids.root })).result
  const pWorkL = (await api.v1.sketch.getPoints({ id: b.ids.workL })).result

  const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: 24 }] })
  const facts = {}
  const rootEnd = await pos(pRoot.endId)
  const workLStart = await pos(pWorkL.startId)
  const a = await pos(pRoot.centerId)
  const c = await pos(pWorkL.centerId)
  const wStart = workLStart
  facts.coincidenceGap_JxL = +Math.hypot(rootEnd[0] - wStart[0], rootEnd[1] - wStart[1]).toFixed(4)
  facts.acDist = +Math.hypot(a[0] - c[0], a[1] - c[1]).toFixed(4)
  facts.EminusR_mm = +(((1.3025 * 0.2 + 0.0015) - (0.5025 * 0.2 + 0.0015)) * inch).toFixed(4)
  facts.workL_radius = +Math.hypot(wStart[0] - c[0], wStart[1] - c[1]).toFixed(4)
  facts.E_mm = +((1.3025 * 0.2 + 0.0015) * inch).toFixed(4)
  // lgs dump: all constraint-ish nodes
  const states = {}
  for (const n of Object.values(up.structure?.tree ?? {})) {
    if (n.class?.includes('Constraint') || n.class?.includes('Dimension')) {
      const s = n.members?.lgsState
      states[`${n.name ?? n.id}(${n.class.replace('CC_2D', '').replace('CC_', '')})`] = s?.value ?? s ?? '?'
    }
  }
  facts.lgs = states
  console.log('[02d] facts:', JSON.stringify(facts, null, 1).slice(0, 1500))

  // R1: nudge the working-arc subsystem directly
  await api.v1.sketch.updateDimension({ id: b.dims.dMcL, value: 3.5 })
  const r1b = await api.v1.sketch.updateDimension({ id: b.dims.dMcL, value: '@expr.Mc' })
  const v1 = await verifyAgainstAnalytic(api, b.junctions, 24, 'R1 after dMcL nudge')
  console.log('[02d] R1 nudge solver:', r1b.result)

  filewrite(facts, 'forensics')

  // R2: fresh part, stepwise morph
  await api.v1.common.clear({})
  const partR2 = await api.v1.part.create({ name: 'Stepwise' })
  const partId2 = partR2.result
  const right2 = Object.values(partR2.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Right').id
  await api.v1.part.expression({ id: partId2, toCreate: EXPRESSIONS })
  const b2 = await buildParametricToothSketch(api, partId2, right2, { seedN: 21, perturb: true })
  if (b2.error) throw new Error('build2 failed')
  for (const n of [22, 23, 24]) {
    await api.v1.part.updateExpression({ id: partId2, toUpdate: [{ name: 'teeth', value: n }] })
  }
  const v2 = await verifyAgainstAnalytic(api, b2.junctions, 24, 'R2 stepwise 21→24')
  return { R1: v1.worst, R2stepwise: v2.worst, facts: { gap: facts.coincidenceGap_JxL, ac: facts.acDist } }
}
