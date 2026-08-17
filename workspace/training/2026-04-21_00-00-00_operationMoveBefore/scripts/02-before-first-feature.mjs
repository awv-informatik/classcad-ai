export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BeforeFirstTest' })).result
  console.log('[02] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[02] boxId:', boxId)

  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0] })).result
  console.log('[02] cylId:', cylId)

  // Move before the FIRST feature (box) — should hide everything
  const r1 = await api.v1.part.operationMoveBefore({ id: partId, featureId: boxId })
  console.log('[02] moveBefore(box) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'moveBefore-box')

  await snapshot('before-box')

  // Move to end to restore
  const r2 = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[02] moveToEnd result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Try moveBefore with the PART ID as featureId (should fail?)
  const r3 = await api.v1.part.operationMoveBefore({ id: partId, featureId: partId })
  console.log('[02] moveBefore(partId) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'moveBefore-partId')

  // Try with an invalid ID
  const r4 = await api.v1.part.operationMoveBefore({ id: partId, featureId: 999999 })
  console.log('[02] moveBefore(999999) result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'moveBefore-invalidId')

  return { partId, boxId, cylId }
}
