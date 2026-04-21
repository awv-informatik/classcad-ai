export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SamePosTest' })).result
  console.log('[08] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Box1' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0], name: 'Cyl1' })).result
  console.log('[08] boxId:', boxId, 'cylId:', cylId)

  // Move before cyl
  const r1 = await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  console.log('[08] moveBefore(cyl) #1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Call moveBefore on same position again — is it a no-op?
  const r2 = await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  console.log('[08] moveBefore(cyl) #2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'moveBefore-same')

  // Move backwards (from mid to earlier)
  const r3 = await api.v1.part.operationMoveBefore({ id: partId, featureId: boxId })
  console.log('[08] moveBefore(box) from mid result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Move forward (from before box to before cyl) — docs say this triggers recalc
  const r4 = await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  console.log('[08] moveBefore(cyl) from before-box result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'moveBefore-forward')

  // operationMoveToEnd when already at end
  await api.v1.part.operationMoveToEnd({ id: partId })
  const r5 = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[08] moveToEnd when already at end result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'moveToEnd-atEnd')

  return { partId }
}
