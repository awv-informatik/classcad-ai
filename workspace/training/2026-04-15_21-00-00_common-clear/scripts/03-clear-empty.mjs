// 03 — clear on already-empty drawing (no part.create first)
export default async function (api, { filewrite }) {
  // Call clear immediately — drawing should be empty (harness clears on start)
  const r1 = await api.v1.common.clear({})
  console.log('[03] clear on empty — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'clear-empty-response')

  // Double clear — clear after clear
  const r2 = await api.v1.common.clear({})
  console.log('[03] double clear — result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Can we still create after clearing empty?
  const partId = (await api.v1.part.create({ name: 'AfterEmpty' })).result
  console.log('[03] create after empty clear — partId:', partId)

  return { partId }
}
