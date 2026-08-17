// Test: error cases — missing id, invalid type, XYAXISORIGIN without refs
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Missing id
  const r1 = await api.v1.part.workCSys({})
  console.log('[07] no id result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] no id msgs:', JSON.stringify(r1.messages))

  // Invalid type
  const r2 = await api.v1.part.workCSys({ id: partId, type: 'INVALID' })
  console.log('[07] invalid type result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] invalid type msgs:', JSON.stringify(r2.messages))

  // XYAXISORIGIN without references
  const r3 = await api.v1.part.workCSys({ id: partId, type: 'XYAXISORIGIN' })
  console.log('[07] no refs result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] no refs msgs:', JSON.stringify(r3.messages))

  filewrite({
    noId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidType: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noRefs: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'error-responses')

  return { partId }
}
