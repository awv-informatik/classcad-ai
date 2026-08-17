// Test COLINEAR and CONCENTRIC constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // COLINEAR: two non-aligned lines → should become colinear
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [60, 10, 0], endPos: [100, 15, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l2Before = await getLinePositions(api, l2)

  const rCo = await api.v1.sketch.constraint({ id: skId, type: 'COLINEAR', geomIds: [l1, l2] })
  console.log('[10] COLINEAR result:', rCo.result, 'maxLevel:', rCo.maxLevel)

  const l2After = await getLinePositions(api, l2)
  console.log('[10] l2 BEFORE colinear:', l2Before)
  console.log('[10] l2 AFTER colinear:', l2After)

  // CONCENTRIC: two circles with different centers → should share center
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result

  const c1 = (await api.v1.sketch.circle({
    id: skId2, center: [0, 0, 0], radius: 30,
    genFixation: false,
  })).result
  await api.v1.sketch.constraint({ id: skId2, type: 'FIXATION', geomIds: [c1] })

  const c2 = (await api.v1.sketch.circle({
    id: skId2, center: [20, 15, 0], radius: 15,
    genFixation: false,
  })).result

  // Get center positions via getPoints
  const c2Pts = (await api.v1.sketch.getPoints({ id: c2 })).result
  const c2CenterBefore = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
  console.log('[10] c2 center BEFORE concentric:', c2CenterBefore)

  const rConc = await api.v1.sketch.constraint({ id: skId2, type: 'CONCENTRIC', geomIds: [c1, c2] })
  console.log('[10] CONCENTRIC result:', rConc.result, 'maxLevel:', rConc.maxLevel)

  const c2CenterAfter = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
  console.log('[10] c2 center AFTER concentric:', c2CenterAfter)

  // Test CONCENTRIC with arcs
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  const skId3 = (await api.v1.sketch.create({ id: partId3 })).result

  const arc1 = (await api.v1.sketch.arcByCenter({
    id: skId3, center: [0, 0, 0], startPos: [-20, 0, 0], endPos: [20, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId3, type: 'FIXATION', geomIds: [arc1] })

  const arc2 = (await api.v1.sketch.arcByCenter({
    id: skId3, center: [30, 10, 0], startPos: [20, 10, 0], endPos: [40, 10, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const arc2Pts = (await api.v1.sketch.getPoints({ id: arc2 })).result
  const arc2CenterBefore = (await api.v1.sketch.getPositions({ id: arc2Pts.centerId })).result

  const rConcArc = await api.v1.sketch.constraint({ id: skId3, type: 'CONCENTRIC', geomIds: [arc1, arc2] })
  console.log('[10] CONCENTRIC arcs result:', rConcArc.result, 'maxLevel:', rConcArc.maxLevel)

  const arc2CenterAfter = (await api.v1.sketch.getPositions({ id: arc2Pts.centerId })).result
  console.log('[10] arc2 center BEFORE:', arc2CenterBefore, 'AFTER:', arc2CenterAfter)

  filewrite({
    colinear: { before: l2Before, after: l2After, result: rCo.result },
    concentricCircles: { centerBefore: c2CenterBefore, centerAfter: c2CenterAfter, result: rConc.result },
    concentricArcs: { centerBefore: arc2CenterBefore, centerAfter: arc2CenterAfter, result: rConcArc.result },
  }, 'colinear-concentric-data')

  await snapshot('result')
  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
