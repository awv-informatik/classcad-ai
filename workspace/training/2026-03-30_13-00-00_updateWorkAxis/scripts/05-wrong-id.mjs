// Test: pass part ID instead of workAxis ID to updateWorkAxis
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1' })).result

  // Use part ID (wrong)
  await api.v1.part.openFeature({ id: partId })
  const r1 = await api.v1.part.updateWorkAxis({ id: partId, direction: [0, 1, 0] })
  console.log('[05] partId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[05] messages:', JSON.stringify(r1.messages))

  // Use non-existent ID
  const r2 = await api.v1.part.updateWorkAxis({ id: 99999, direction: [0, 1, 0] })
  console.log('[05] bad ID result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] bad ID messages:', JSON.stringify(r2.messages))

  // Missing id entirely
  const r3 = await api.v1.part.updateWorkAxis({ direction: [0, 1, 0] })
  console.log('[05] no id result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[05] no id messages:', JSON.stringify(r3.messages))

  filewrite({
    partId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    badId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'wrong-id-responses')

  return { partId }
}
