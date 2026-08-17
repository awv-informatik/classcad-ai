export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Set user data on the box
  await api.v1.common.setUserData({ id: boxId, key: 'tag', value: 'original' })

  // Verify it's there
  const before = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[12] before recalc:', before)

  // Force a recalc
  const recR = await api.v1.common.recalc({})
  console.log('[12] recalc maxLevel:', recR.maxLevel)

  // Check user data after recalc
  const after = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[12] after recalc:', after)

  // Set user data on the part, then set an expression (triggers internal recalc)
  await api.v1.common.setUserData({ id: partId, key: 'partMeta', value: 'important' })
  const partBefore = (await api.v1.common.getUserData({ id: partId, key: 'partMeta' })).result

  await api.v1.part.setExpression({ id: partId, name: 'testParam', value: 42 })
  const partAfter = (await api.v1.common.getUserData({ id: partId, key: 'partMeta' })).result
  console.log('[12] part UD before expr:', partBefore, 'after expr:', partAfter)

  // Test rename object
  await api.v1.common.setObjectName({ id: boxId, name: 'RenamedBox' })
  const afterRename = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[12] after rename:', afterRename)

  filewrite({
    beforeRecalc: before,
    afterRecalc: after,
    partBeforeExpr: partBefore,
    partAfterExpr: partAfter,
    afterRename: afterRename,
  }, 'recalc-results')

  return { partId }
}
