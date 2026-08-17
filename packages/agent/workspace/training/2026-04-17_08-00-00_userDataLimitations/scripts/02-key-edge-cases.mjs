export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeyEdgeTest' })).result

  // Test 1: empty string key
  const r1 = await api.v1.common.setUserData({ id: partId, key: '', value: 'empty-key' })
  console.log('[02] empty key:', r1.result, 'maxLevel:', r1.maxLevel)

  // Test 2: empty string value
  const r2 = await api.v1.common.setUserData({ id: partId, key: 'emptyVal', value: '' })
  console.log('[02] empty value:', r2.result, 'maxLevel:', r2.maxLevel)
  const g2 = await api.v1.common.getUserData({ id: partId, key: 'emptyVal', defaultValue: 'MISSING' })
  console.log('[02] empty value retrieved:', JSON.stringify(g2.result))

  // Test 3: case sensitivity
  await api.v1.common.setUserData({ id: partId, key: 'MyKey', value: 'upper' })
  await api.v1.common.setUserData({ id: partId, key: 'mykey', value: 'lower' })
  await api.v1.common.setUserData({ id: partId, key: 'MYKEY', value: 'allcaps' })
  const gUpper = (await api.v1.common.getUserData({ id: partId, key: 'MyKey' })).result
  const gLower = (await api.v1.common.getUserData({ id: partId, key: 'mykey' })).result
  const gCaps = (await api.v1.common.getUserData({ id: partId, key: 'MYKEY' })).result
  console.log('[02] case sensitivity: MyKey=', gUpper, 'mykey=', gLower, 'MYKEY=', gCaps)
  const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[02] all keys:', keys)

  // Test 4: overwrite same key
  await api.v1.common.setUserData({ id: partId, key: 'overwrite', value: 'first' })
  const before = (await api.v1.common.getUserData({ id: partId, key: 'overwrite' })).result
  await api.v1.common.setUserData({ id: partId, key: 'overwrite', value: 'second' })
  const after = (await api.v1.common.getUserData({ id: partId, key: 'overwrite' })).result
  console.log('[02] overwrite: before=', before, 'after=', after)

  // Test 5: special characters in keys
  const specialKeys = ['key with spaces', 'key/slash', 'key.dot', 'key:colon', 'key\ttab', 'key\nnewline']
  const specialResults = {}
  for (const k of specialKeys) {
    const rs = await api.v1.common.setUserData({ id: partId, key: k, value: 'val' })
    const gs = await api.v1.common.getUserData({ id: partId, key: k })
    specialResults[k] = { setMaxLevel: rs.maxLevel, getValue: gs.result }
    console.log('[02] special key', JSON.stringify(k), ':', rs.maxLevel <= 31 ? '✓' : '❌', 'retrieved:', JSON.stringify(gs.result))
  }

  // Test 6: unicode key
  const ru = await api.v1.common.setUserData({ id: partId, key: '日本語', value: '値' })
  const gu = await api.v1.common.getUserData({ id: partId, key: '日本語' })
  console.log('[02] unicode: set maxLevel=', ru.maxLevel, 'get=', JSON.stringify(gu.result))

  const allKeys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[02] final key count:', allKeys.length, 'keys:', allKeys)

  filewrite({
    emptyKey: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    emptyValue: { setMaxLevel: r2.maxLevel, retrieved: g2.result },
    caseSensitivity: { MyKey: gUpper, mykey: gLower, MYKEY: gCaps, keys },
    overwrite: { before, after },
    specialKeys: specialResults,
    unicode: { setMaxLevel: ru.maxLevel, getValue: gu.result },
    allKeys,
  }, 'key-edge-results')

  return { partId }
}
