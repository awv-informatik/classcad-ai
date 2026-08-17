export default async function (api, { snapshot, filewrite }) {
  // Test: does snapshot alone (without calculateMassProperties) lock instances?

  const asmId = (await api.v1.assembly.create({ name: 'SnapLock' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result

  // ONLY take snapshot (no calculateMassProperties on instances)
  await snapshot('before-modify')

  // Modify template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 30 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const m1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[13] inst1 volume AFTER (only snapshot before):', m1.result?.volume)

  // Expected: 72000 if snapshot doesn't lock, 24000 if it does
  filewrite({ inst1VolAfter: m1.result?.volume }, 'snapshot-only-lock')

  await snapshot('after-modify')
  return { asmId, tplId }
}
