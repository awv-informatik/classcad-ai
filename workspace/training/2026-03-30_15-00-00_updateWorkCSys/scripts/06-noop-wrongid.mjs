// Test: no-op update + wrong ID types + return value
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const csId = (await api.v1.part.workCSys({ id: partId, name: 'CS1' })).result

  // No-op
  await api.v1.part.openFeature({ id: csId })
  const r1 = await api.v1.part.updateWorkCSys({ id: csId })
  console.log('[06] noop result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] noop messages:', JSON.stringify(r1.messages))
  console.log('[06] result === csId:', r1.result === csId)
  console.log('[06] envelope keys:', Object.keys(r1).join(', '))
  await api.v1.part.closeFeature({ id: csId })

  // Wrong ID: part ID
  const r2 = await api.v1.part.updateWorkCSys({ id: partId, offset: [10, 0, 0] })
  console.log('[06] partId result:', r2.result, r2.maxLevel)
  console.log('[06] partId msgs:', JSON.stringify(r2.messages))

  // Missing ID
  const r3 = await api.v1.part.updateWorkCSys({ offset: [10, 0, 0] })
  console.log('[06] no id result:', r3.result, r3.maxLevel)
  console.log('[06] no id msgs:', JSON.stringify(r3.messages))

  filewrite({
    noop: { result: r1.result, maxLevel: r1.maxLevel, sameId: r1.result === csId, keys: Object.keys(r1) },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'edge-cases')
  return { partId }
}
