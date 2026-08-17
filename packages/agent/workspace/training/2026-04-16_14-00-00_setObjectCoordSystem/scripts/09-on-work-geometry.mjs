// Test setObjectCoordSystem on work geometry — work plane, work axis, work point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysWorkGeo' })).result
  console.log('[09] partId:', partId)

  // Create work geometry
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0]
  })).result
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'WA1', origin: [0, 0, 0], direction: [0, 1, 0]
  })).result
  const wptId = (await api.v1.part.workPoint({
    id: partId, name: 'WPt1', position: [10, 10, 10]
  })).result
  console.log('[09] wpId:', wpId, 'waId:', waId, 'wptId:', wptId)

  // Test on work plane
  const r1 = await api.v1.common.setObjectCoordSystem({
    id: wpId,
    origin: [100, 0, 50],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[09] on workPlane result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages.length > 0) console.log('[09] wp messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'wp-response')

  // Test on work axis
  const r2 = await api.v1.common.setObjectCoordSystem({
    id: waId,
    origin: [50, 50, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[09] on workAxis result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) console.log('[09] wa messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'wa-response')

  // Test on work point
  const r3 = await api.v1.common.setObjectCoordSystem({
    id: wptId,
    origin: [200, 200, 200],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[09] on workPoint result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages.length > 0) console.log('[09] wpt messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'wpt-response')

  await snapshot('after-all')

  return { partId, wpId, waId, wptId }
}
