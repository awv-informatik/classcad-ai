export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'C',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')

  // Delete all instances at once
  const r = await api.v1.assembly.deleteInstance({ ids: [inst1, inst2, inst3] })
  console.log('[08] delete all result:', r.result, 'maxLevel:', r.maxLevel)

  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[08] after delete all, instances:', afterList)
  console.log('[08] empty:', Array.isArray(afterList) && afterList.length === 0)

  await snapshot('after-all-deleted')

  filewrite({ before: [inst1, inst2, inst3], after: afterList }, 'delete-all-comparison')

  return { asmId }
}
