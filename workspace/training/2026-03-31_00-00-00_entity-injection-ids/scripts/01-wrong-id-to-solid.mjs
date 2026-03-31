// Q: What happens when you pass a part ID to solid.box instead of an EI ID?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[01] partId:', partId)

  // Try passing part ID directly to solid.box — should fail
  const r = await api.v1.solid.box({ id: partId, length: 50, width: 50, height: 50 })
  console.log('[01] solid.box with partId — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) {
    for (const m of r.messages) {
      console.log('[01] message:', m.message, 'level:', m.level, 'code:', m.code)
    }
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'solid-box-with-part-id')

  return { partId }
}
