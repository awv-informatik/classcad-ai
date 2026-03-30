// Test: change type to referenced without providing references — broken state?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', direction: [1, 0, 0] })).result

  // Try changing to 2PLANES without references
  await api.v1.part.openFeature({ id: waId })
  const r1 = await api.v1.part.updateWorkAxis({ id: waId, type: '2PLANES' })
  console.log('[10] type change no refs result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] messages:', JSON.stringify(r1.messages))
  await api.v1.part.closeFeature({ id: waId })

  // Check if axis is in broken state — try to use it
  const expr = await api.v1.part.getExpression({ id: waId })
  console.log('[10] expressions after broken update:', JSON.stringify(expr.result))

  // Can we still update it back?
  await api.v1.part.openFeature({ id: waId })
  const r2 = await api.v1.part.updateWorkAxis({ id: waId, type: 'USERDEFINED', direction: [0, 1, 0] })
  console.log('[10] recovery result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] recovery messages:', JSON.stringify(r2.messages))
  await api.v1.part.closeFeature({ id: waId })

  filewrite({
    brokenUpdate: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    recovery: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'type-no-refs')

  return { partId }
}
