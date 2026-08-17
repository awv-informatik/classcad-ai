export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MoveBeforeTest' })).result
  console.log('[01] partId:', partId)

  // Create 3 features: box, cylinder, work plane
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0] })).result
  console.log('[01] cylId:', cylId)

  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  console.log('[01] wpId:', wpId)

  // Snapshot with all features
  await snapshot('all-features')

  // Move rollback bar before cylinder — should hide cyl and WP
  const r1 = await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  console.log('[01] moveBefore(cyl) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'moveBefore-cyl')

  await snapshot('before-cylinder')

  // Move to end — should restore all features
  const r2 = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[01] moveToEnd result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'moveToEnd')

  await snapshot('restored-all')

  return { partId, boxId, cylId, wpId }
}
