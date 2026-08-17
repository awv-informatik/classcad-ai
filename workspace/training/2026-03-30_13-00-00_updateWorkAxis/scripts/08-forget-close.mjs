// Test: what happens if you forget closeFeature? Can you open another feature?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const wa1 = (await api.v1.part.workAxis({ id: partId, name: 'WA1', direction: [1, 0, 0] })).result
  const wa2 = (await api.v1.part.workAxis({ id: partId, name: 'WA2', direction: [0, 1, 0] })).result
  console.log('[08] wa1:', wa1, 'wa2:', wa2)

  // Open wa1, update it, DON'T close
  await api.v1.part.openFeature({ id: wa1 })
  const r1 = await api.v1.part.updateWorkAxis({ id: wa1, direction: [1, 1, 0] })
  console.log('[08] update wa1:', r1.result, r1.maxLevel)

  // Try to open wa2 without closing wa1
  const openR = await api.v1.part.openFeature({ id: wa2 })
  console.log('[08] open wa2 result:', openR.result, 'maxLevel:', openR.maxLevel)
  console.log('[08] open wa2 messages:', JSON.stringify(openR.messages))

  // Try to update wa2
  const r2 = await api.v1.part.updateWorkAxis({ id: wa2, direction: [0, 0, 1] })
  console.log('[08] update wa2:', r2.result, r2.maxLevel)
  console.log('[08] wa2 messages:', JSON.stringify(r2.messages))

  filewrite({
    updateWa1: { result: r1.result, maxLevel: r1.maxLevel },
    openWa2: { result: openR.result, maxLevel: openR.maxLevel, messages: openR.messages },
    updateWa2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'forget-close')

  // Clean up — close whatever is open
  await api.v1.part.closeFeature({ id: wa1 })
  await api.v1.part.closeFeature({ id: wa2 })

  return { partId }
}
