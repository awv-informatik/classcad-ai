export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set two keys
  await api.v1.common.setUserData({ id: partId, key: 'a', value: 'alpha' })
  await api.v1.common.setUserData({ id: partId, key: 'b', value: 'beta' })

  // Read both before removal
  const before_a = (await api.v1.common.getUserData({ id: partId, key: 'a' })).result
  const before_b = (await api.v1.common.getUserData({ id: partId, key: 'b' })).result
  console.log('[03] before remove: a=', before_a, 'b=', before_b)

  // Remove key 'a', then read it
  await api.v1.common.removeUserData({ id: partId, key: 'a' })
  const after_remove_a = await api.v1.common.getUserData({ id: partId, key: 'a', defaultValue: '__GONE__' })
  const after_remove_b = (await api.v1.common.getUserData({ id: partId, key: 'b' })).result
  console.log('[03] after remove a:', after_remove_a.result, 'b still:', after_remove_b)

  // clearUserData, then read
  await api.v1.common.setUserData({ id: partId, key: 'c', value: 'gamma' })
  await api.v1.common.clearUserData({ id: partId })
  const after_clear_b = await api.v1.common.getUserData({ id: partId, key: 'b', defaultValue: '__GONE__' })
  const after_clear_c = await api.v1.common.getUserData({ id: partId, key: 'c', defaultValue: '__GONE__' })
  console.log('[03] after clear: b=', after_clear_b.result, 'c=', after_clear_c.result)

  filewrite({
    beforeRemove: { a: before_a, b: before_b },
    afterRemoveA: { a: after_remove_a.result, b: after_remove_b },
    afterClear: { b: after_clear_b.result, c: after_clear_c.result },
  }, 'after-remove-clear')

  return { partId }
}
