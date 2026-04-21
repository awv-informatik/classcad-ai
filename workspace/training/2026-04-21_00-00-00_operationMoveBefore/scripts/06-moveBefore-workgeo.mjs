export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WorkGeoTest' })).result
  console.log('[06] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Box1' })).result
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'MyWP', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'MyWA', origin: [0, 0, 0], direction: [0, 1, 0] })).result
  console.log('[06] boxId:', boxId, 'wpId:', wpId, 'waId:', waId)

  // Move before work plane
  const r1 = await api.v1.part.operationMoveBefore({ id: partId, featureId: wpId })
  console.log('[06] moveBefore(workPlane) result:', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('before-wp')

  // Move before work axis
  const r2 = await api.v1.part.operationMoveBefore({ id: partId, featureId: waId })
  console.log('[06] moveBefore(workAxis) result:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('before-wa')

  // Move before a DEFAULT work plane (Top)
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  console.log('[06] topId:', topId)
  const r3 = await api.v1.part.operationMoveBefore({ id: partId, featureId: topId })
  console.log('[06] moveBefore(Top) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'moveBefore-Top')

  await api.v1.part.operationMoveToEnd({ id: partId })
  return { partId }
}
