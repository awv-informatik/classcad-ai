export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Set same key on different objects with different values
  await api.v1.common.setUserData({ id: partId, key: 'tag', value: 'part-value' })
  await api.v1.common.setUserData({ id: eifId, key: 'tag', value: 'eif-value' })

  // Read back — should be isolated
  const partTag = (await api.v1.common.getUserData({ id: partId, key: 'tag' })).result
  const eifTag = (await api.v1.common.getUserData({ id: eifId, key: 'tag' })).result
  console.log('[10] part tag:', partTag, ', eif tag:', eifTag)
  console.log('[10] isolated:', partTag !== eifTag)

  // Clear one, the other should remain
  await api.v1.common.clearUserData({ id: partId })
  const partAfter = await api.v1.common.getUserData({ id: partId, key: 'tag', defaultValue: '__GONE__' })
  const eifAfter = (await api.v1.common.getUserData({ id: eifId, key: 'tag' })).result
  console.log('[10] after clearing part: part tag=', partAfter.result, ', eif tag=', eifAfter)

  filewrite({
    before: { partTag, eifTag },
    afterClearPart: { partTag: partAfter.result, eifTag: eifAfter },
  }, 'cross-object-isolation')

  return { partId }
}
