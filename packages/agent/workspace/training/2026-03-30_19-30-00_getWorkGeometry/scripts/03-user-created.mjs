// Test getWorkGeometry on user-created work geometry of all 4 types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GWGTest' })).result

  // Create one of each type with custom names
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'MyPlane', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'MyAxis', position: [10, 0, 0], direction: [0, 1, 0] })).result
  const wcId = (await api.v1.part.workCSys({ id: partId, name: 'MyCSys', origin: [20, 20, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  const wptId = (await api.v1.part.workPoint({ id: partId, name: 'MyPoint', position: [30, 30, 30] })).result

  console.log('[03] created — plane:', wpId, 'axis:', waId, 'csys:', wcId, 'point:', wptId)

  // Look them up
  const results = {}
  for (const [name, expectedId] of [['MyPlane', wpId], ['MyAxis', waId], ['MyCSys', wcId], ['MyPoint', wptId]]) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel, expected: expectedId, match: r.result === expectedId }
    console.log(`[03] name="${name}" → result:`, r.result, 'expected:', expectedId, 'match:', r.result === expectedId)
  }

  filewrite(results, 'user-created')
  return { partId }
}
