export default async function (api, { snapshot, filewrite }) {
  // Use two DIFFERENT templates so deletion is visually obvious
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result

  const boxTplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: boxTplId, name: 'B1', length: 60, width: 40, height: 30 })

  const cylTplId = (await api.v1.assembly.partTemplate({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: cylTplId, name: 'C1', radius: 15, height: 50 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const boxInst = (await api.v1.assembly.instance({
    productId: boxTplId, ownerId: asmId, name: 'BoxInst',
  })).result
  const cylInst = (await api.v1.assembly.instance({
    productId: cylTplId, ownerId: asmId, name: 'CylInst',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[12] boxInst:', boxInst, 'cylInst:', cylInst)

  await snapshot('before-two-shapes')

  // Delete the cylinder
  await api.v1.assembly.deleteInstance({ ids: [cylInst] })

  const after = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[12] after deleting cylinder, instances:', after)

  await snapshot('after-cyl-deleted')

  return { asmId }
}
