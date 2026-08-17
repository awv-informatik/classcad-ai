export default async function (api, { snapshot, filewrite }) {
  // Test: does calculateMassProperties on the ROOT assembly (not instance) lock instances?
  // Also test: does snapshot alone lock instances?

  const asmId = (await api.v1.assembly.create({ name: 'RootLock' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // Query ROOT assembly (not individual instances)
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[12] root volume BEFORE:', rootMass.result?.volume)

  // Modify template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 30 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const m1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const m2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[12] inst1 volume AFTER (root was queried):', m1.result?.volume)
  console.log('[12] inst2 volume AFTER (root was queried):', m2.result?.volume)

  filewrite({
    rootVolBefore: rootMass.result?.volume,
    inst1VolAfter: m1.result?.volume,
    inst2VolAfter: m2.result?.volume
  }, 'root-mass-lock')

  return { asmId, tplId }
}
