// Test TANGENT constraint: arc-line and arc-arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Arc-line tangent: fixed horizontal line, arc above it
  const line = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [line] })

  const arc = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [40, 25, 0], startPos: [15, 25, 0], endPos: [65, 25, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[05] arc ID:', arc)

  // Get arc positions via getPoints
  const arcPts = (await api.v1.sketch.getPoints({ id: arc })).result
  console.log('[05] arc getPoints:', arcPts)

  let arcCenterBefore, arcStartBefore
  if (arcPts?.centerId) {
    arcCenterBefore = (await api.v1.sketch.getPositions({ id: arcPts.centerId })).result
    arcStartBefore = (await api.v1.sketch.getPositions({ id: arcPts.startId })).result
    console.log('[05] arc center BEFORE:', arcCenterBefore)
    console.log('[05] arc start BEFORE:', arcStartBefore)
  }

  await snapshot('before-tangent')

  // TANGENT between arc and line
  const rTL = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [arc, line] })
  console.log('[05] TANGENT arc-line result:', rTL.result, 'maxLevel:', rTL.maxLevel)
  if (rTL.messages?.length) console.log('[05] messages:', JSON.stringify(rTL.messages))

  // Move arc to trigger solving
  if (rTL.result) {
    const rMove = await api.v1.sketch.moveGeometry({
      id: skId, geomIds: [arc], translation: [0, -5, 0],
    })
    console.log('[05] moveGeometry result:', rMove.result)
  }

  if (arcPts?.centerId) {
    const arcCenterAfter = (await api.v1.sketch.getPositions({ id: arcPts.centerId })).result
    console.log('[05] arc center AFTER:', arcCenterAfter)
  }

  await snapshot('after-tangent')

  filewrite({
    tangent: { result: rTL.result, maxLevel: rTL.maxLevel, messages: rTL.messages },
    arcCenterBefore, arcStartBefore,
  }, 'tangent-arc-line')

  // Arc-arc tangent in second part
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result

  const arc1 = (await api.v1.sketch.arcByCenter({
    id: skId2, centerPos: [0, 0, 0], startPos: [-20, 0, 0], endPos: [20, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId2, type: 'FIXATION', geomIds: [arc1] })

  const arc2 = (await api.v1.sketch.arcByCenter({
    id: skId2, centerPos: [50, 0, 0], startPos: [35, 5, 0], endPos: [65, 5, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const rTT = await api.v1.sketch.constraint({ id: skId2, type: 'TANGENT', geomIds: [arc1, arc2] })
  console.log('[05] TANGENT arc-arc result:', rTT.result, 'maxLevel:', rTT.maxLevel)
  if (rTT.messages?.length) console.log('[05] arc-arc messages:', JSON.stringify(rTT.messages))

  filewrite({ arcArc: { result: rTT.result, maxLevel: rTT.maxLevel } }, 'tangent-arc-arc')

  return { partId }
}
