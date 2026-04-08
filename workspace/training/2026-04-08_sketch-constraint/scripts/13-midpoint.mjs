// Test MIDPOINT constraint — point constrained to the midpoint of a line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // A line
  const lineId = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // A point not at midpoint
  const ptId = (await api.v1.sketch.point({
    id: skId, pos: [30, 20, 0],
    genFixation: false, genIncidence: false,
  })).result
  console.log('[13] lineId:', lineId, 'ptId:', ptId)

  // MIDPOINT — [point, line]?
  const r = await api.v1.sketch.constraint({
    id: skId, type: 'MIDPOINT', geomIds: [ptId, lineId],
  })
  console.log('[13] midpoint result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))

  // Check position after
  const pos = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[13] point position after:', JSON.stringify(pos))

  filewrite({
    result: r.result, messages: r.messages, maxLevel: r.maxLevel,
    pointPosAfter: pos,
  }, 'midpoint-response')
  await snapshot('midpoint')
  return { partId }
}
