// 06 — Empty tools array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionEmptyTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 60, height: 40
  })).result

  console.log('[06] box1:', box1)

  // Try: union with empty tools array
  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [] })
  console.log('[06] empty-tools result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-tools-response')

  return { partId, eifId }
}
