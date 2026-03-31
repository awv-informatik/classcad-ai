// 13 — What happens if you pass the part ID directly to solid.box instead of the EI ID?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongIdTest' })).result
  console.log('[13] partId:', partId)

  // Try creating a solid directly on the part (no entity injection)
  const r = await api.v1.solid.box({ id: partId, length: 50, width: 50, height: 50 })
  console.log('[13] solid.box on partId — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'solid-on-part')

  return { partId }
}
