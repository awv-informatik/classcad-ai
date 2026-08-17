// Test: 2POINTS type — two point refs define the axis
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Build a box: 80x60x40
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get two vertices
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [80, 60, 40] },
    ]
  })
  const pt1 = gids.result?.points?.[0]
  const pt2 = gids.result?.points?.[1]
  console.log('[06] pt1:', pt1, 'pt2:', pt2)

  if (pt1 && pt2) {
    const r1 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_2pts_brep',
      type: '2POINTS',
      references: [pt1, pt2]
    })
    console.log('[06] 2POINTS(brep) result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[06] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, '2pts-brep')
  }

  // Also try with two work points
  const wp1 = (await api.v1.part.workPoint({ id: partId, name: 'WP1', position: [10, 10, 10] })).result
  const wp2 = (await api.v1.part.workPoint({ id: partId, name: 'WP2', position: [70, 50, 30] })).result
  console.log('[06] workPoints:', wp1, wp2)

  if (wp1 && wp2) {
    const r2 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_2pts_work',
      type: '2POINTS',
      references: [wp1, wp2]
    })
    console.log('[06] 2POINTS(work) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[06] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, '2pts-work')
  }

  // Edge case: same point twice
  if (pt1) {
    const r3 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_2pts_same',
      type: '2POINTS',
      references: [pt1, pt1]
    })
    console.log('[06] 2POINTS(same) result:', r3.result, 'maxLevel:', r3.maxLevel)
    console.log('[06] messages:', JSON.stringify(r3.messages))
    filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, '2pts-same')
  }

  await snapshot('2points')
  return { partId }
}
