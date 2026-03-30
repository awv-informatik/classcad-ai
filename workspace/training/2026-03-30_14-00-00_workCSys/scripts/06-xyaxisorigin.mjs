// Test: XYAXISORIGIN type — needs origin + first axis + second axis references
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get brep geometry: point for origin, two edges for axes
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }],
    lines: [
      { pos: [40, 0, 0] },   // bottom-front edge (X direction)
      { pos: [0, 0, 20] },   // left-front vertical edge (Z direction)
    ]
  })
  const origin = gids.result?.points?.[0]
  const axis1 = gids.result?.lines?.[0]
  const axis2 = gids.result?.lines?.[1]
  console.log('[06] origin:', origin, 'axis1:', axis1, 'axis2:', axis2)

  if (origin && axis1 && axis2) {
    // 3 references: origin, first axis, second axis
    const r1 = await api.v1.part.workCSys({
      id: partId,
      name: 'CS_xyorigin',
      type: 'XYAXISORIGIN',
      references: [origin, axis1, axis2]
    })
    console.log('[06] 3refs result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[06] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, '3refs-response')
  }

  // Try with work geometry: work point as origin, work axes as directions
  const wpId = (await api.v1.part.workPoint({ id: partId, name: 'WP1', position: [40, 30, 20] })).result
  const xAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
  const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
  console.log('[06] workPoint:', wpId, 'xAxis:', xAxis, 'yAxis:', yAxis)

  if (wpId && xAxis && yAxis) {
    const r2 = await api.v1.part.workCSys({
      id: partId,
      name: 'CS_work',
      type: 'XYAXISORIGIN',
      references: [wpId, xAxis, yAxis]
    })
    console.log('[06] work refs result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[06] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'work-refs-response')
  }

  // Try with only 2 references (wrong count)
  if (origin && axis1) {
    const r3 = await api.v1.part.workCSys({
      id: partId,
      name: 'CS_2refs',
      type: 'XYAXISORIGIN',
      references: [origin, axis1]
    })
    console.log('[06] 2refs result:', r3.result, 'maxLevel:', r3.maxLevel)
    console.log('[06] 2refs messages:', JSON.stringify(r3.messages))
    filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, '2refs-response')
  }

  await snapshot('xyaxisorigin')
  return { partId }
}
