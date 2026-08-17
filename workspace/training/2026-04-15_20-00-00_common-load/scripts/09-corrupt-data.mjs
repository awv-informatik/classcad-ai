// Test loading corrupted/invalid data — how does load fail?
export default async function (api, { snapshot, filewrite }) {
  // First clear the drawing
  const partId = (await api.v1.part.create({ name: 'CorruptTest' })).result
  await api.v1.common.clear({})

  // Test 1: empty string
  console.log('[09] Test 1: empty data string')
  const r1 = await api.v1.common.load({ data: '', format: 'OFB' })
  console.log('[09] Empty data result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  console.log('[09] Empty data messages:', JSON.stringify(r1.messages))

  // Test 2: garbage data
  console.log('[09] Test 2: garbage data')
  const r2 = await api.v1.common.load({ data: 'not-valid-ofb-data', format: 'OFB' })
  console.log('[09] Garbage result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[09] Garbage messages:', JSON.stringify(r2.messages))

  // Test 3: garbage base64
  console.log('[09] Test 3: garbage base64')
  const r3 = await api.v1.common.load({ data: 'SGVsbG8gV29ybGQ=', format: 'OFB', encoding: 'base64' })
  console.log('[09] Garbage b64 result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  console.log('[09] Garbage b64 messages:', JSON.stringify(r3.messages))

  // Test 4: no data, no file, no url
  console.log('[09] Test 4: no source specified')
  const r4 = await api.v1.common.load({ format: 'OFB' })
  console.log('[09] No source result:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  console.log('[09] No source messages:', JSON.stringify(r4.messages))

  filewrite({
    emptyData: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    garbage: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    garbageB64: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    noSource: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'corrupt-data-responses')

  return {}
}
