// COINCIDENT point-on-circle with correct params. Also test getPositions on sketch.point
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circ = (await api.v1.sketch.circle({
    id: skId, centerPos: [40, 40, 0], radius: 30,
    genFixation: false,
  })).result
  console.log('[17] circle ID:', circ)

  const pt = (await api.v1.sketch.point({
    id: skId, pos: [0, 0, 0],
    genFixation: false,
  })).result
  console.log('[17] point ID:', pt)

  // What does getPoints return for a standalone point?
  const ptPts = (await api.v1.sketch.getPoints({ id: pt })).result
  console.log('[17] point getPoints:', ptPts)

  // What does getPositions return for the point?
  const ptPos = (await api.v1.sketch.getPositions({ id: pt })).result
  console.log('[17] point getPositions (on geom ID):', ptPos)

  // If getPoints returns something, try getPositions on the sub-point
  if (ptPts?.centerId) {
    const ptSubPos = (await api.v1.sketch.getPositions({ id: ptPts.centerId })).result
    console.log('[17] point getPositions (on centerId):', ptSubPos)
  }

  // COINCIDENT: point on circle
  const rC = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [pt, circ],
  })
  console.log('[17] COINCIDENT pt-on-circle result:', rC.result, 'maxLevel:', rC.maxLevel)
  if (rC.messages?.length) console.log('[17] messages:', JSON.stringify(rC.messages))

  // Try the reverse order: [circle, point]
  const pt2 = (await api.v1.sketch.point({
    id: skId, pos: [80, 80, 0],
    genFixation: false,
  })).result
  const rC2 = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [circ, pt2],
  })
  console.log('[17] COINCIDENT circle-pt (reversed) result:', rC2.result, 'maxLevel:', rC2.maxLevel)
  if (rC2.messages?.length) console.log('[17] reversed messages:', JSON.stringify(rC2.messages))

  // Try COINCIDENT point-on-arc
  const arc = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [0, -40, 0], startPos: [-20, -40, 0], endPos: [20, -40, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const pt3 = (await api.v1.sketch.point({
    id: skId, pos: [10, -20, 0],
    genFixation: false,
  })).result
  const rCA = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [pt3, arc],
  })
  console.log('[17] COINCIDENT pt-on-arc result:', rCA.result, 'maxLevel:', rCA.maxLevel)
  if (rCA.messages?.length) console.log('[17] pt-on-arc messages:', JSON.stringify(rCA.messages))

  // Try COINCIDENT with line endpoint on circle
  const line = (await api.v1.sketch.line({
    id: skId, startPos: [60, 0, 0], endPos: [80, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const linePts = (await api.v1.sketch.getPoints({ id: line })).result
  const rCLC = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [linePts.endId, circ],
  })
  console.log('[17] COINCIDENT lineEnd-on-circle:', rCLC.result, 'maxLevel:', rCLC.maxLevel)

  filewrite({
    ptOnCircle: { result: rC.result, maxLevel: rC.maxLevel, messages: rC.messages },
    ptOnCircleReversed: { result: rC2.result, maxLevel: rC2.maxLevel, messages: rC2.messages },
    ptOnArc: { result: rCA.result, maxLevel: rCA.maxLevel, messages: rCA.messages },
    lineEndOnCircle: { result: rCLC.result, maxLevel: rCLC.maxLevel },
    ptGetPoints: ptPts,
  }, 'coincident-curves')

  return { partId }
}
