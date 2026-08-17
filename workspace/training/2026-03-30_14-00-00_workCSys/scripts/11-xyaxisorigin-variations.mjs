// Test: XYAXISORIGIN with different reference combinations + offset/rotation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }, { pos: [80, 60, 40] }],
    lines: [{ pos: [40, 0, 0] }, { pos: [0, 30, 0] }]
  })
  const pt1 = gids.result?.points?.[0]
  const pt2 = gids.result?.points?.[1]
  const edge1 = gids.result?.lines?.[0]
  const edge2 = gids.result?.lines?.[1]
  console.log('[11] pt1:', pt1, 'pt2:', pt2, 'edge1:', edge1, 'edge2:', edge2)

  // XYAXISORIGIN with offset on top
  if (pt1 && edge1 && edge2) {
    const r1 = await api.v1.part.workCSys({
      id: partId,
      name: 'CS_xy_off',
      type: 'XYAXISORIGIN',
      references: [pt1, edge1, edge2],
      offset: [10, 10, 10]
    })
    console.log('[11] xy+offset result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[11] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'xy-offset')
  }

  // XYAXISORIGIN with rotation on top
  if (pt2 && edge1 && edge2) {
    const r2 = await api.v1.part.workCSys({
      id: partId,
      name: 'CS_xy_rot',
      type: 'XYAXISORIGIN',
      references: [pt2, edge1, edge2],
      rotation: [0, 0, Math.PI / 4]
    })
    console.log('[11] xy+rotation result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[11] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'xy-rotation')
  }

  await snapshot('xyaxisorigin-variations')
  return { partId }
}
