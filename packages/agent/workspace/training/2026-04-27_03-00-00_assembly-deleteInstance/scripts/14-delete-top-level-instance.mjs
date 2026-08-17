export default async function (api, { snapshot, filewrite }) {
  // Delete a top-level instance (direct child of root assembly)
  // and verify the root assembly is still usable
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Delete inst1
  await api.v1.assembly.deleteInstance({ ids: [inst1] })

  // Verify we can still add new instances after deletion
  const inst3 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'C',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[14] new inst3 after deletion:', inst3)

  const finalList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[14] final instances:', finalList)
  console.log('[14] contains inst2 and inst3:', finalList.includes(inst2) && finalList.includes(inst3))
  console.log('[14] does NOT contain inst1:', !finalList.includes(inst1))

  await snapshot('after-delete-and-readd')

  return { asmId }
}
