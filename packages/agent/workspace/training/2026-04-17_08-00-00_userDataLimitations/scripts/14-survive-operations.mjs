export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OpsTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Set user data
  await api.v1.common.setUserData({ id: boxId, key: 'tag', value: 'original' })
  await api.v1.common.setUserData({ id: partId, key: 'partMeta', value: 'important' })

  // 1. Survive recalc
  await api.v1.common.recalc({})
  const afterRecalc = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[14] after recalc:', afterRecalc)

  // 2. Survive rename
  await api.v1.common.setObjectName({ id: boxId, name: 'RenamedBox' })
  const afterRename = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[14] after rename:', afterRename)

  // 3. Survive expression update
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'testParam', value: 42 }] })
  const afterExpr = (await api.v1.common.getUserData({ id: partId, key: 'partMeta' })).result
  console.log('[14] after expression update:', afterExpr)

  // 4. Survive adding another solid (does it disturb existing UD?)
  const box2Id = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [80, 0, 0] })).result
  const afterAdd = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[14] after adding second box:', afterAdd)

  // 5. Can user data survive object deletion? (the object is gone, so its UD should be gone too)
  await api.v1.common.setUserData({ id: box2Id, key: 'temp', value: 'willBeDeleted' })
  const beforeDel = (await api.v1.common.getUserData({ id: box2Id, key: 'temp' })).result
  console.log('[14] before delete box2:', beforeDel)

  // Delete box2
  const delR = await api.v1.common.deleteObject({ id: box2Id })
  console.log('[14] delete box2 maxLevel:', delR.maxLevel)

  // Try to get UD on deleted object
  const afterDel = await api.v1.common.getUserData({ id: box2Id, key: 'temp', defaultValue: 'GONE' })
  console.log('[14] after delete box2:', afterDel.result, 'maxLevel:', afterDel.maxLevel)

  // Original box UD should still be there
  const origStill = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[14] original box tag still:', origStill)

  filewrite({
    afterRecalc,
    afterRename,
    afterExpr,
    afterAddBox: afterAdd,
    beforeDel,
    afterDel: { result: afterDel.result, maxLevel: afterDel.maxLevel, messages: afterDel.messages },
    origBoxStill: origStill,
  }, 'operations-results')

  return { partId }
}
