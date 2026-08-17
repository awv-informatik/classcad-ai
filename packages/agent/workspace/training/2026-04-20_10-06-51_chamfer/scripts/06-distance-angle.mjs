export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferDistAngle' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Snapshot first to ensure proper edge IDs
  await snapshot('before')

  // Find top-front edge
  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[06] edge IDs:', JSON.stringify(edgeIds))

  // DISTANCE_ANGLE: distance1=15, angle=PI/6 (30 degrees)
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'ChamferAngle30',
    references: edgeIds,
    type: 'DISTANCE_ANGLE',
    distance1: 15,
    angle: 'C:PI/6',
  })
  console.log('[06] DISTANCE_ANGLE result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  await snapshot('after')

  return { partId, chamferId: r.result }
}
