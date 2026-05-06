export default async function (api, { snapshot, filewrite }) {
  // Hypothesis: querying an instance "materializes" it, locking it from template propagation.
  // Test: measure only inst1, then modify template. Does inst1 stay locked while inst2 updates?

  const asmId = (await api.v1.assembly.create({ name: 'LockTest' })).result
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

  // ONLY measure inst1 (not inst2)
  const m1_before = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[11] inst1 volume BEFORE:', m1_before.result?.volume)
  // inst2 is NOT queried

  // Modify template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 30 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Measure both AFTER
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const m1_after = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const m2_after = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[11] inst1 volume AFTER:', m1_after.result?.volume, '(was queried before)')
  console.log('[11] inst2 volume AFTER:', m2_after.result?.volume, '(was NOT queried before)')

  // Expected if hypothesis is correct:
  // inst1 stays at 24000 (locked by pre-query)
  // inst2 updates to 72000 (60*40*30, because it was never queried)

  filewrite({
    inst1_before: m1_before.result?.volume,
    inst1_after: m1_after.result?.volume,
    inst2_after: m2_after.result?.volume,
    hypothesis: 'inst1 locked at 24000, inst2 updated to 72000'
  }, 'selective-lock')

  return { asmId, tplId, inst1, inst2 }
}
