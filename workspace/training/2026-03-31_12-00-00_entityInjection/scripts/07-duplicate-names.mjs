// 07 — What happens with duplicate entity injection names?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DupTest' })).result

  const r1 = await api.v1.part.entityInjection({ id: partId, name: 'Same' })
  const r2 = await api.v1.part.entityInjection({ id: partId, name: 'Same' })
  const r3 = await api.v1.part.entityInjection({ id: partId, name: 'Same' })

  console.log('[07] r1:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] r2:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] r3:', r3.result, 'maxLevel:', r3.maxLevel)

  // Check actual names in structure tree
  const tree = r3.structure?.tree
  const names = [r1.result, r2.result, r3.result].map(id => ({
    id,
    name: tree?.[id]?.name,
  }))
  console.log('[07] names:', JSON.stringify(names))
  filewrite(names, 'duplicate-names')

  return { partId, ids: [r1.result, r2.result, r3.result] }
}
