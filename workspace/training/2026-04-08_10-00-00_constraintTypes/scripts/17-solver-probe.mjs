// Script 17: Probe every possible solver trigger after COINCIDENT constraint
// Question: is there ANY operation that makes the sketch solver enforce constraints?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = { genFixation: false, genVertAndHoriz: false, genIncidence: false }

  // Two separate lines
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0], ...noGen,
  })).result
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [50, 10, 0], endPos: [90, 10, 0], ...noGen,
  })).result

  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  // Add COINCIDENT constraint
  const cId = (await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [pts1.endId, pts2.startId],
  })).result
  console.log('[17] constraint created:', cId)

  function posStr(p) { return p?.pos ? `(${p.pos.x}, ${p.pos.y})` : String(p) }
  async function report(label) {
    const a = (await api.v1.sketch.getPositions({ id: pts1.endId })).result
    const b = (await api.v1.sketch.getPositions({ id: pts2.startId })).result
    console.log(`[17] ${label}: l1.end=${posStr(a)}  l2.start=${posStr(b)}  match=${a?.pos?.x === b?.pos?.x && a?.pos?.y === b?.pos?.y}`)
    return { l1End: a, l2Start: b }
  }

  const results = {}
  results.afterConstraint = await report('after constraint')

  // Probe 1: common.recalc
  const recalcR = await api.v1.common.recalc({})
  console.log('[17] recalc maxLevel:', recalcR.maxLevel)
  results.afterRecalc = await report('after recalc')

  // Probe 2: moveGeometry with zero translation
  const moveR = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [l1, l2], translation: [0, 0, 0],
  })
  console.log('[17] moveGeometry(zero) result:', moveR.result, 'maxLevel:', moveR.maxLevel)
  results.afterMoveZero = await report('after moveGeo(0)')

  // Probe 3: moveGeometry with tiny nudge then back
  await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [l2], translation: [0.001, 0, 0],
  })
  results.afterNudge = await report('after nudge +0.001')
  await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [l2], translation: [-0.001, 0, 0],
  })
  results.afterNudgeBack = await report('after nudge back')

  // Probe 4: add a dimension, then update it
  const dimId = (await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [l1],
  })).result
  console.log('[17] dimension created:', dimId)
  const updR = await api.v1.sketch.updateDimension({ id: dimId, value: 40 })
  console.log('[17] updateDimension result:', updR.result, 'maxLevel:', updR.maxLevel)
  results.afterDimUpdate = await report('after updateDimension')

  // Probe 5: recalc again after dimension
  await api.v1.common.recalc({})
  results.afterRecalc2 = await report('after recalc #2')

  // Probe 6: openFeature + closeFeature cycle
  // Find the sketch feature ID in the structure
  const openR = await api.v1.part.openFeature({ id: skId })
  console.log('[17] openFeature:', openR.maxLevel)
  const closeR = await api.v1.part.closeFeature({ id: skId })
  console.log('[17] closeFeature:', closeR.maxLevel)
  results.afterOpenClose = await report('after open/close feature')

  await snapshot('after-all-probes')

  filewrite(results, 'solver-probe-results')
  return { partId }
}
