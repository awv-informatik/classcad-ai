export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RefreshTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Existing' })).result

  // Measure before
  const volBefore = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  console.log('[14] i1 vol before:', volBefore)

  // Update template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 40 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Verify template is updated
  const tplVol = (await api.v1.assembly.calculateMassProperties({ id: tplId })).result.volume
  console.log('[14] template vol after update:', tplVol)

  // Switch to assembly — measure BEFORE creating new instance
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const volBeforeNewInst = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  console.log('[14] i1 vol BEFORE new instance:', volBeforeNewInst)

  // NOW create a new instance from same template — this should trigger refresh
  const i2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Trigger',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure again — has the original instance refreshed?
  const volAfterNewInst = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  const vol2 = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result.volume
  console.log('[14] i1 vol AFTER new instance:', volAfterNewInst)
  console.log('[14] i2 (new) vol:', vol2)
  console.log('[14] propagation triggered by new instance?', volBeforeNewInst !== volAfterNewInst)

  filewrite({
    volBefore,
    tplVol,
    volBeforeNewInstance: volBeforeNewInst,
    volAfterNewInstance: volAfterNewInst,
    newInstanceVol: vol2,
    triggeredByNewInstance: volBeforeNewInst !== volAfterNewInst,
  }, 'refresh-mechanism')

  return { asmId }
}
