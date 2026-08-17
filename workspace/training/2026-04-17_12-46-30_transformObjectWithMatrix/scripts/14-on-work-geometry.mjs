export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WorkGeoTest' })).result

  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP1',
    origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0],
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'WA1',
    origin: [0, 0, 0], direction: [0, 1, 0],
  })).result

  const wptId = (await api.v1.part.workPoint({
    id: partId, name: 'WPt1',
    position: [10, 10, 10],
  })).result

  console.log('[14] wpId:', wpId, 'waId:', waId, 'wptId:', wptId)

  // Transform work plane
  const r1 = await api.v1.common.transformObjectWithMatrix({
    id: wpId,
    matrix: [
      [1, 0, 0, 100],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[14] work plane transform - maxLevel:', r1.maxLevel)
  if (r1.messages && r1.messages.length > 0) {
    console.log('[14] wp messages:', JSON.stringify(r1.messages))
  }
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'workplane-response')

  // Transform work axis
  const r2 = await api.v1.common.transformObjectWithMatrix({
    id: waId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 50],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[14] work axis transform - maxLevel:', r2.maxLevel)
  if (r2.messages && r2.messages.length > 0) {
    console.log('[14] wa messages:', JSON.stringify(r2.messages))
  }
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'workaxis-response')

  // Transform work point
  const r3 = await api.v1.common.transformObjectWithMatrix({
    id: wptId,
    matrix: [
      [1, 0, 0, 200],
      [0, 1, 0, 200],
      [0, 0, 1, 200],
      [0, 0, 0, 1],
    ],
  })
  console.log('[14] work point transform - maxLevel:', r3.maxLevel)
  if (r3.messages && r3.messages.length > 0) {
    console.log('[14] wpt messages:', JSON.stringify(r3.messages))
  }
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'workpoint-response')

  return { partId }
}
