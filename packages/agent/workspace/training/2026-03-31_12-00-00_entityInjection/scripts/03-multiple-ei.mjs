// 03 — Multiple entity injections in one part
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiEI' })).result
  console.log('[03] partId:', partId)

  const ei1 = await api.v1.part.entityInjection({ id: partId, name: 'EI_One' })
  const ei2 = await api.v1.part.entityInjection({ id: partId, name: 'EI_Two' })
  const ei3 = await api.v1.part.entityInjection({ id: partId, name: 'EI_Three' })

  console.log('[03] ei1:', ei1.result, 'maxLevel:', ei1.maxLevel)
  console.log('[03] ei2:', ei2.result, 'maxLevel:', ei2.maxLevel)
  console.log('[03] ei3:', ei3.result, 'maxLevel:', ei3.maxLevel)

  // Check structure tree for all three
  const tree = ei3.structure?.tree
  const nodes = [ei1.result, ei2.result, ei3.result].map(id => ({
    id,
    name: tree?.[id]?.name,
    class: tree?.[id]?.class,
    parent: tree?.[id]?.parent,
  }))
  console.log('[03] nodes:', JSON.stringify(nodes))
  filewrite(nodes, 'multi-ei-nodes')

  return { partId, ei1: ei1.result, ei2: ei2.result, ei3: ei3.result }
}
