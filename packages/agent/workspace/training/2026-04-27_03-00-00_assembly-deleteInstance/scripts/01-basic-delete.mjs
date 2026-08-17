export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'A',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  const beforeList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[01] before delete, instances:', beforeList)

  await snapshot('before')

  // Delete single instance
  const r = await api.v1.assembly.deleteInstance({ ids: [inst1] })
  console.log('[01] deleteInstance result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-response')

  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[01] after delete, instances:', afterList)

  await snapshot('after')

  filewrite({ before: beforeList, after: afterList, deletedId: inst1, survivorId: inst2 }, 'comparison')

  return { asmId, inst1, inst2 }
}
