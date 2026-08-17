export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonStringTest' })).result

  // Test 1: number value
  const r1 = await api.v1.common.setUserData({ id: partId, key: 'numVal', value: 42 })
  console.log('[01] number value:', r1.result, 'maxLevel:', r1.maxLevel)

  // Test 2: boolean value
  const r2 = await api.v1.common.setUserData({ id: partId, key: 'boolVal', value: true })
  console.log('[01] boolean value:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: object value
  const r3 = await api.v1.common.setUserData({ id: partId, key: 'objVal', value: { foo: 'bar' } })
  console.log('[01] object value:', r3.result, 'maxLevel:', r3.maxLevel)

  // Test 4: array value
  const r4 = await api.v1.common.setUserData({ id: partId, key: 'arrVal', value: [1, 2, 3] })
  console.log('[01] array value:', r4.result, 'maxLevel:', r4.maxLevel)

  // Test 5: null value
  const r5 = await api.v1.common.setUserData({ id: partId, key: 'nullVal', value: null })
  console.log('[01] null value:', r5.result, 'maxLevel:', r5.maxLevel)

  // Now retrieve everything that was set
  const g1 = await api.v1.common.getUserData({ id: partId, key: 'numVal' })
  const g2 = await api.v1.common.getUserData({ id: partId, key: 'boolVal' })
  const g3 = await api.v1.common.getUserData({ id: partId, key: 'objVal' })
  const g4 = await api.v1.common.getUserData({ id: partId, key: 'arrVal' })
  const g5 = await api.v1.common.getUserData({ id: partId, key: 'nullVal' })
  const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result

  console.log('[01] retrieved numVal:', JSON.stringify(g1.result), 'type:', typeof g1.result)
  console.log('[01] retrieved boolVal:', JSON.stringify(g2.result), 'type:', typeof g2.result)
  console.log('[01] retrieved objVal:', JSON.stringify(g3.result), 'type:', typeof g3.result)
  console.log('[01] retrieved arrVal:', JSON.stringify(g4.result), 'type:', typeof g4.result)
  console.log('[01] retrieved nullVal:', JSON.stringify(g5.result), 'type:', typeof g5.result)
  console.log('[01] all keys:', keys)

  filewrite({
    sets: {
      number: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
      boolean: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
      object: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
      array: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
      null: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
    },
    gets: {
      numVal: { result: g1.result, type: typeof g1.result },
      boolVal: { result: g2.result, type: typeof g2.result },
      objVal: { result: g3.result, type: typeof g3.result },
      arrVal: { result: g4.result, type: typeof g4.result },
      nullVal: { result: g5.result, type: typeof g5.result },
    },
    keys,
  }, 'non-string-results')

  return { partId }
}
