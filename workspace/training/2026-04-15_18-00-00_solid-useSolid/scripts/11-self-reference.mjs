// 11 — Can useSolid pull from the same EI (self-reference)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SelfRef' })).result

  const eif = (await api.v1.part.entityInjection({ id: partId, name: 'SelfEI' })).result
  const box = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
  console.log('[11] eif:', eif, 'box:', box)

  // Try useSolid from the same EI into itself
  const r = await api.v1.solid.useSolid({ from: [eif], in: eif })
  console.log('[11] self-reference result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'self-ref')

  await snapshot('self-ref')
  return { result: r.result }
}
