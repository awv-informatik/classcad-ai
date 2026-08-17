// 01 — Basic entityInjection creation with default name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  console.log('[01] partId:', partId)

  const r = await api.v1.part.entityInjection({ id: partId })
  console.log('[01] entityInjection result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'ei-response')
  filewrite(r.structure, 'ei-structure')

  return { partId, eifId: r.result }
}
