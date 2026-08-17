// Test: updateWorkAxis without openFeature — confirm error
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', direction: [1, 0, 0] })).result
  console.log('[01] waId:', waId)

  // Try update without openFeature
  const r = await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 1, 0] })
  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open')

  return { partId }
}
