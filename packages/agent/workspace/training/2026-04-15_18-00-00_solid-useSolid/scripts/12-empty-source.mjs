// 12 — What happens when the source feature has no solids?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptySource' })).result

  // Create an empty EI (no solids added)
  const emptyEif = (await api.v1.part.entityInjection({ id: partId, name: 'EmptyEI' })).result
  console.log('[12] empty EI:', emptyEif)

  // Try useSolid from empty EI
  const dstEif = (await api.v1.part.entityInjection({ id: partId, name: 'Dest' })).result
  const r = await api.v1.solid.useSolid({ from: [emptyEif], in: dstEif })
  console.log('[12] useSolid from empty EI: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-source')

  return { result: r.result }
}
