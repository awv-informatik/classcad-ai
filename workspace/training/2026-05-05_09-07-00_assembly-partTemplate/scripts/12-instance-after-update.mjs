export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PostUpdateInst' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  // Create instance BEFORE update
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const iBefore = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'BeforeUpdate' })).result

  // Update template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 40 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Create instance AFTER update
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const iAfter = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'AfterUpdate',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure both
  const mBefore = (await api.v1.assembly.calculateMassProperties({ id: iBefore })).result
  const mAfter = (await api.v1.assembly.calculateMassProperties({ id: iAfter })).result
  console.log('[12] instance BEFORE update - vol:', mBefore.volume, 'cog:', JSON.stringify(mBefore.cog))
  console.log('[12] instance AFTER update - vol:', mAfter.volume, 'cog:', JSON.stringify(mAfter.cog))
  console.log('[12] template vol:', (await api.v1.assembly.calculateMassProperties({ id: tplId })).result.volume)

  filewrite({
    beforeInstance: { vol: mBefore.volume, cog: mBefore.cog },
    afterInstance: { vol: mAfter.volume, cog: mAfter.cog },
  }, 'instance-after-update')

  return { asmId }
}
