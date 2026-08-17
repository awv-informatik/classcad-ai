export default async function (api, { snapshot, filewrite }) {
  // Create assembly, template, instantiate, then delete template
  const asmId = (await api.v1.assembly.create({ name: 'InstDeleteTest' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances of the template
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[03] tplId:', tplId, 'inst1:', inst1, 'inst2:', inst2)

  await snapshot('before-delete')

  // Try to delete the template that has active instances
  const r = await api.v1.assembly.deleteTemplate({ ids: [tplId] })
  console.log('[03] deleteTemplate with instances - result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-with-instances')

  // Check if instances still exist
  const instances = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[03] instances after delete:', JSON.stringify(instances.result))
  filewrite(instances, 'instances-after-delete')

  // Check if templates still exist
  const templates = await api.v1.assembly.getPartTemplate({})
  console.log('[03] templates after delete:', JSON.stringify(templates.result))

  await snapshot('after-delete')

  return { asmId, tplId, inst1, inst2, deleteResult: r }
}
