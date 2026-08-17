// Test: return value structure of updateWorkAxis — verify it returns the axis ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1' })).result
  console.log('[09] waId:', waId)

  await api.v1.part.openFeature({ id: waId })
  const r = await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 0, 1] })
  console.log('[09] result:', r.result, 'type:', typeof r.result)
  console.log('[09] result === waId:', r.result === waId)
  console.log('[09] maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  console.log('[09] envelope keys:', Object.keys(r).join(', '))
  await api.v1.part.closeFeature({ id: waId })

  filewrite({
    result: r.result,
    resultType: typeof r.result,
    sameAsInput: r.result === waId,
    maxLevel: r.maxLevel,
    messages: r.messages,
    envelopeKeys: Object.keys(r)
  }, 'return-value')

  return { partId }
}
