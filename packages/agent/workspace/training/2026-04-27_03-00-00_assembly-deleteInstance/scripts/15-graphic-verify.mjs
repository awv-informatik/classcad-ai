export default async function (api, { snapshot, filewrite }) {
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

  // Get graphic data before deletion
  const rBefore = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[15] instances before:', rBefore.result)

  // Count bodies/meshes in graphic before
  const gBefore = rBefore.graphic
  if (gBefore) {
    const bodyCount = gBefore.meshes ? gBefore.meshes.length : 'no meshes field'
    console.log('[15] graphic body count before:', bodyCount)
    filewrite(gBefore, 'graphic-before')
  } else {
    console.log('[15] no graphic data in getInstance response')
  }

  await snapshot('before')

  // Delete cylinder instance
  const delR = await api.v1.assembly.deleteInstance({ ids: [cylInst] })
  console.log('[15] delete result:', delR.result, 'maxLevel:', delR.maxLevel)

  // Get getInstance again to trigger fresh graphic data
  const rAfter = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[15] instances after:', rAfter.result)

  const gAfter = rAfter.graphic
  if (gAfter) {
    const bodyCount = gAfter.meshes ? gAfter.meshes.length : 'no meshes field'
    console.log('[15] graphic body count after:', bodyCount)
    filewrite(gAfter, 'graphic-after')
  } else {
    console.log('[15] no graphic data in getInstance response')
  }

  // Also call a no-op to get fresh structure data
  const structR = await api.v1.common.getClassFileVersion({})
  if (structR.graphic) {
    const bodyCount = structR.graphic.meshes ? structR.graphic.meshes.length : 'no meshes'
    console.log('[15] graphic from getClassFileVersion after delete:', bodyCount)
    filewrite(structR.graphic, 'graphic-after-noop')
  }

  await snapshot('after')

  return { asmId }
}
