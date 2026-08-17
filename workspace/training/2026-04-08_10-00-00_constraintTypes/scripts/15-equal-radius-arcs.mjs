// Test FIXATION on arcs/circles with correct params + TANGENT line-circle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Arc with correct centerPos
  const arc1 = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [0, 0, 0], startPos: [-30, 0, 0], endPos: [30, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[15] arc1 ID:', arc1)

  const arc2 = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [80, 0, 0], startPos: [65, 0, 0], endPos: [95, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[15] arc2 ID:', arc2)

  // FIXATION on arc
  const rFA = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [arc1] })
  console.log('[15] FIXATION arc1:', rFA.result, 'maxLevel:', rFA.maxLevel)

  // EQUAL_RADIUS arcs
  const rER = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_RADIUS', geomIds: [arc1, arc2] })
  console.log('[15] EQUAL_RADIUS arcs:', rER.result, 'maxLevel:', rER.maxLevel)

  // FIXATION on circle
  const circ = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 60, 0], radius: 20,
    genFixation: false,
  })).result
  console.log('[15] circle ID:', circ)

  const rFC = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [circ] })
  console.log('[15] FIXATION circle:', rFC.result, 'maxLevel:', rFC.maxLevel)

  // TANGENT between circle and line
  const line = (await api.v1.sketch.line({
    id: skId, startPos: [-30, 60, 0], endPos: [30, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const rTCL = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [circ, line] })
  console.log('[15] TANGENT circle-line:', rTCL.result, 'maxLevel:', rTCL.maxLevel)
  if (rTCL.messages?.length) console.log('[15] tangent msgs:', JSON.stringify(rTCL.messages))

  filewrite({
    fixArc: { result: rFA.result, maxLevel: rFA.maxLevel },
    equalRadius: { result: rER.result, maxLevel: rER.maxLevel },
    fixCircle: { result: rFC.result, maxLevel: rFC.maxLevel },
    tangentCircleLine: { result: rTCL.result, maxLevel: rTCL.maxLevel },
  }, 'fix-equal-tangent')

  await snapshot('result')
  return { partId }
}
