// Test: no-op update (only id, no other params)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1' })).result

  await api.v1.part.openFeature({ id: waId })
  const r = await api.v1.part.updateWorkAxis({ id: waId })
  console.log('[03] noop result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  await api.v1.part.closeFeature({ id: waId })

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'noop')
  return { partId }
}
