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
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[02] created:', inst1, inst2, inst3)

  // Delete multiple at once
  const r = await api.v1.assembly.deleteInstance({ ids: [inst1, inst3] })
  console.log('[02] delete [inst1, inst3] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-delete-response')

  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[02] after delete, instances:', afterList)
  console.log('[02] expected only inst2:', inst2, '— match:', JSON.stringify(afterList) === JSON.stringify([inst2]))

  return { asmId }
}
