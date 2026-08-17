export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DefaultTest' })).result

  // Get non-existent key without defaultValue
  const r1 = await api.v1.common.getUserData({ id: partId, key: 'nope' })
  console.log('[07] no default: result=', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Get non-existent key with defaultValue
  const r2 = await api.v1.common.getUserData({ id: partId, key: 'nope', defaultValue: 'fallback' })
  console.log('[07] with default: result=', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Get non-existent key with empty string default
  const r3 = await api.v1.common.getUserData({ id: partId, key: 'nope', defaultValue: '' })
  console.log('[07] empty default: result=', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Remove non-existent key
  const r4 = await api.v1.common.removeUserData({ id: partId, key: 'nope' })
  console.log('[07] remove non-existent: maxLevel=', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  // Clear with no user data
  const r5 = await api.v1.common.clearUserData({ id: partId })
  console.log('[07] clear empty: maxLevel=', r5.maxLevel, 'messages:', JSON.stringify(r5.messages))

  // getUserDataKeys on object with no data
  const r6 = await api.v1.common.getUserDataKeys({ id: partId })
  console.log('[07] keys on empty:', r6.result)

  // Non-string key
  const r7 = await api.v1.common.setUserData({ id: partId, key: 42, value: 'numKey' })
  console.log('[07] numeric key: maxLevel=', r7.maxLevel, 'messages:', JSON.stringify(r7.messages))

  filewrite({
    noDefault: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    withDefault: { result: r2.result, maxLevel: r2.maxLevel },
    emptyDefault: { result: r3.result, maxLevel: r3.maxLevel },
    removeNonExistent: { maxLevel: r4.maxLevel, messages: r4.messages },
    clearEmpty: { maxLevel: r5.maxLevel, messages: r5.messages },
    keysEmpty: r6.result,
    numericKey: { maxLevel: r7.maxLevel, messages: r7.messages },
  }, 'default-results')

  return { partId }
}
