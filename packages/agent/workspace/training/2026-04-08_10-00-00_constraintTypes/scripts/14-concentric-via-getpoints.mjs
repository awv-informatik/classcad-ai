// Test CONCENTRIC and EQUAL_RADIUS with correct param names (centerPos, not center)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circles with correct centerPos param
  const c1 = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 30,
    genFixation: false,
  })).result
  console.log('[14] c1 ID:', c1)

  const c2 = (await api.v1.sketch.circle({
    id: skId, centerPos: [50, 20, 0], radius: 15,
    genFixation: false,
  })).result
  console.log('[14] c2 ID:', c2)

  // getPoints on circles
  const c1Pts = (await api.v1.sketch.getPoints({ id: c1 })).result
  const c2Pts = (await api.v1.sketch.getPoints({ id: c2 })).result
  console.log('[14] c1 getPoints:', c1Pts)
  console.log('[14] c2 getPoints:', c2Pts)

  // FIXATION on circle
  const rFC = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })
  console.log('[14] FIXATION c1:', rFC.result, 'maxLevel:', rFC.maxLevel)

  // CONCENTRIC
  const rConc = await api.v1.sketch.constraint({ id: skId, type: 'CONCENTRIC', geomIds: [c1, c2] })
  console.log('[14] CONCENTRIC result:', rConc.result, 'maxLevel:', rConc.maxLevel)
  if (rConc.messages?.length) console.log('[14] messages:', JSON.stringify(rConc.messages))

  // EQUAL_RADIUS
  const c3 = (await api.v1.sketch.circle({
    id: skId, centerPos: [80, 0, 0], radius: 10,
    genFixation: false,
  })).result
  const rER = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_RADIUS', geomIds: [c1, c3] })
  console.log('[14] EQUAL_RADIUS result:', rER.result, 'maxLevel:', rER.maxLevel)

  // If getPoints works, check positions
  if (c2Pts?.centerId) {
    const c2CenterBefore = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
    console.log('[14] c2 center:', c2CenterBefore)

    // Move c2 to trigger solving
    const rMove = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [c2], translation: [0, 0, 0] })
    console.log('[14] moveGeometry:', rMove.result)
  }

  // Also test with arcs
  const arc1 = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [0, -60, 0], startPos: [-20, -60, 0], endPos: [20, -60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const arc2 = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [40, -50, 0], startPos: [30, -50, 0], endPos: [50, -50, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const rConcArc = await api.v1.sketch.constraint({ id: skId, type: 'CONCENTRIC', geomIds: [arc1, arc2] })
  console.log('[14] CONCENTRIC arcs:', rConcArc.result, 'maxLevel:', rConcArc.maxLevel)

  const rERArc = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_RADIUS', geomIds: [arc1, arc2] })
  console.log('[14] EQUAL_RADIUS arcs:', rERArc.result, 'maxLevel:', rERArc.maxLevel)

  filewrite({
    fixCircle: { result: rFC.result, maxLevel: rFC.maxLevel },
    concentric: { result: rConc.result, maxLevel: rConc.maxLevel },
    equalRadius: { result: rER.result, maxLevel: rER.maxLevel },
    concentricArcs: { result: rConcArc.result, maxLevel: rConcArc.maxLevel },
    equalRadiusArcs: { result: rERArc.result, maxLevel: rERArc.maxLevel },
  }, 'concentric-equal-radius')

  await snapshot('result')
  return { partId }
}
