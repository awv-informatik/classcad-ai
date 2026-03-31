// 04 — Rename to empty string
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  console.log('[04] partId:', partId)

  // Rename to empty string
  const r = await api.v1.common.setObjectName({ id: partId, name: '' })
  console.log('[04] empty name result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-name-response')
  filewrite(r.structure, 'structure-after-empty')

  return { partId }
}
