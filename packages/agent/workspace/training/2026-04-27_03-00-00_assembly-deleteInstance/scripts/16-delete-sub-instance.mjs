export default async function (api, { filewrite }) {
  // Delete a sub-assembly instance (not its children, the sub-assembly instance itself)
  const rootId = (await api.v1.assembly.create({ name: 'Root' })).result
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: subTplId })

  await api.v1.assembly.instance({ productId: partTplId, ownerId: subTplId, name: 'Child' })
  await api.v1.assembly.setCurrentProduct({ id: rootId })

  const subInst = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'SubInst',
  })).result

  console.log('[16] sub-assembly instance:', subInst)

  const before = (await api.v1.assembly.getInstance({ ownerId: rootId })).result
  console.log('[16] root children before:', before)

  // Delete the sub-assembly instance itself (not a child inside it)
  const r = await api.v1.assembly.deleteInstance({ ids: [subInst] })
  console.log('[16] delete sub-instance result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sub-instance-delete')

  const after = (await api.v1.assembly.getInstance({ ownerId: rootId })).result
  console.log('[16] root children after:', after)

  // Template should still exist and be usable
  const tplChildren = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result
  console.log('[16] sub-template children still intact:', tplChildren)

  return { rootId }
}
