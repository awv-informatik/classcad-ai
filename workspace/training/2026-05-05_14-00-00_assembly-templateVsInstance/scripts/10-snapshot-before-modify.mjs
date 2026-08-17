export default async function (api, { snapshot, filewrite }) {
  // Hypothesis: does taking a snapshot or measuring BEFORE modify prevent propagation?
  // Mimics script 03's pattern exactly: measure inst → snapshot → modify → measure inst again

  const asmId = (await api.v1.assembly.create({ name: 'SnapTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result

  // === Measure and snapshot BEFORE modifying (mimicking script 03) ===
  const massBefore = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[10] BEFORE — inst1 volume:', massBefore.result?.volume)
  await snapshot('before-modify')

  // === Modify via template context ===
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, length: 120, width: 80, height: 20 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Measure template WHILE in template context (like script 03)
  const massTpl = await api.v1.assembly.calculateMassProperties({ id: tplId })
  console.log('[10] template volume after modify:', massTpl.result?.volume)

  // Switch back to assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Measure instance
  const massAfter = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[10] AFTER — inst1 volume:', massAfter.result?.volume)
  console.log('[10] AFTER — inst1 COG:', JSON.stringify(massAfter.result?.cog))

  // Try with extra recalc at assembly level
  await api.v1.common.recalc({})
  const massAfterRecalc = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[10] AFTER RECALC — inst1 volume:', massAfterRecalc.result?.volume)

  filewrite({
    before: massBefore.result,
    templateAfter: massTpl.result,
    instanceAfter: massAfter.result,
    instanceAfterRecalc: massAfterRecalc.result
  }, 'snapshot-before-modify')

  await snapshot('after-modify')
  return { asmId, tplId, inst1 }
}
