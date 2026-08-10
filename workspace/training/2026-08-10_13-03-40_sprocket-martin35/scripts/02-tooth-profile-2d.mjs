/**
 * 02 — validate the ANSI tooth-space arc chain in isolation:
 * draw one tooth-space profile (21T #35) on the Right plane with construction
 * circles (pitch/blank/root), extrude it thin, and compare the CAD volume
 * against the polygonized profile area × thickness. Proves closure, arc
 * directions (isClockwise), and my interpretation of the ACA construction.
 */
import { inch, toothForm, polygonizeSpace, polyArea, CHAIN_35 } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { pitch: P, rollerDia: Dr } = CHAIN_35
  const N = 21
  const blankOD = P / Math.sin(Math.PI / N) + P / 2
  const tf = toothForm({ P, Dr, N, blankOD })
  const mm = (v) => v * inch

  const partR = await api.v1.part.create({ name: 'ToothSpace2D' })
  const partId = partR.result
  const right = Object.values(partR.structure.tree).find(
    (o) => o.class === 'CC_WorkPlane' && o.name === 'Right',
  ).id
  const skId = (await api.v1.sketch.create({ id: partId, planeId: right, name: 'Space' })).result

  const arcs = [], lines = []
  for (const e of tf.entities) {
    if (e.kind === 'line')
      lines.push({ startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0] })
    else
      arcs.push({
        startPos: [mm(e.start[0]), mm(e.start[1]), 0],
        endPos: [mm(e.end[0]), mm(e.end[1]), 0],
        centerPos: [mm(e.center[0]), mm(e.center[1]), 0],
        isClockwise: e.cw,
      })
  }
  const g = await api.v1.sketch.geometry({
    id: skId, lines, arcsByCenter: arcs,
    // construction circles: pitch, blank OD, root — visual reference (dashed)
    circles: [
      { centerPos: [0, 0, 0], radius: mm(tf.Rp), isConstruction: true },
      { centerPos: [0, 0, 0], radius: mm(tf.Ro), isConstruction: true },
      { centerPos: [0, 0, 0], radius: mm(tf.rootR), isConstruction: true },
    ],
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  console.log('[02] geometry maxLevel:', g.maxLevel, 'arcs:', g.result.arcsByCenter.length, 'lines:', g.result.lines.length)
  if (g.maxLevel > 31) { filewrite(g.messages, 'geom-errors'); throw new Error('geometry rejected') }

  await snapshot('space-profile', { view: 'right' })

  const ext = await api.v1.part.extrusion({
    id: partId, name: 'SpaceSlab',
    references: [...g.result.arcsByCenter, ...g.result.lines],
    type: 'SYMMETRIC', limit2: mm(0.1),
  })
  console.log('[02] extrusion:', ext.result, 'maxLevel:', ext.maxLevel)
  if (ext.maxLevel > 31) { filewrite(ext.messages, 'ext-errors'); throw new Error('extrusion failed — profile not a closed region') }
  await api.v1.common.recalc({})
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const cadArea = mp.volume / inch ** 3 / 0.1
  const polyA = polyArea(polygonizeSpace(tf))
  const dev = Math.abs(cadArea - polyA) / polyA
  console.log(`[02] area: CAD=${cadArea.toFixed(5)} in² vs poly=${polyA.toFixed(5)} in² (dev ${(dev * 100).toFixed(3)}%)`)
  console.log(`[02] tooth form: PD=${tf.PD.toFixed(4)} Ro=${tf.Ro.toFixed(4)} rootR=${tf.rootR.toFixed(4)} Feff=${tf.Feff.toFixed(5)} (Fstd=${tf.Fstd.toFixed(5)}) flatTip=${tf.flatTip}`)
  filewrite({ cadArea, polyA, deviationPct: dev * 100, tf: { PD: tf.PD, Ro: tf.Ro, rootR: tf.rootR, Feff: tf.Feff, Fstd: tf.Fstd, tipR: tf.tipR, flatTip: tf.flatTip } }, 'area-check')
  await snapshot('space-slab')
  if (dev > 0.005) throw new Error(`area deviation ${(dev * 100).toFixed(2)}% > 0.5%`)
  return { partId, cadArea, polyA }
}
