export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.common.setUserData({ id: partId, key: 'exists', value: 'hello' })

  // Case 1: key exists, no defaultValue
  const r1 = await api.v1.common.getUserData({ id: partId, key: 'exists' })
  console.log('[02] existing key, no default:', JSON.stringify(r1.result))

  // Case 2: key exists, with defaultValue
  const r2 = await api.v1.common.getUserData({ id: partId, key: 'exists', defaultValue: 'fallback' })
  console.log('[02] existing key, with default:', JSON.stringify(r2.result))

  // Case 3: key missing, no defaultValue (docs say returns "")
  const r3 = await api.v1.common.getUserData({ id: partId, key: 'nope' })
  console.log('[02] missing key, no default:', JSON.stringify(r3.result))
  console.log('[02] missing key, no default maxLevel:', r3.maxLevel)

  // Case 4: key missing, with defaultValue
  const r4 = await api.v1.common.getUserData({ id: partId, key: 'nope', defaultValue: 'fallback' })
  console.log('[02] missing key, with default:', JSON.stringify(r4.result))
  console.log('[02] missing key, with default maxLevel:', r4.maxLevel)

  filewrite({
    existingNoDefault: { result: r1.result, maxLevel: r1.maxLevel },
    existingWithDefault: { result: r2.result, maxLevel: r2.maxLevel },
    missingNoDefault: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
    missingWithDefault: { result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel },
  }, 'default-value-cases')

  return { partId }
}
