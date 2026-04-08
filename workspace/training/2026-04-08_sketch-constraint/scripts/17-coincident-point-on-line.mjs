// Test COINCIDENT constraint between a point and a curve (point-on-line)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [80, 40, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const ptId = (await api.v1.sketch.point({
    id: skId, pos: [30, 30, 0], genFixation: false,
  })).result
  console.log('[17] lineId:', lineId, 'ptId:', ptId)

  // COINCIDENT between point and line — should put point on line
  const r = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [ptId, lineId],
  })
  console.log('[17] coincident-on-line result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[17] messages:', JSON.stringify(r.messages))

  const pos = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[17] point position after:', JSON.stringify(pos))

  filewrite({
    result: r.result, messages: r.messages, maxLevel: r.maxLevel,
    pointPosAfter: pos,
  }, 'coincident-on-line-response')
  await snapshot('coincident-on-line')
  return { partId }
}
