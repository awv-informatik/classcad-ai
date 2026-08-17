export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PropTest2' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result

  // Build initial geometry
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result
  console.log('[10] boxId:', boxId)

  // Create instances
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  const i2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure before
  const m1Before = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result
  console.log('[10] i1 vol before:', m1Before.volume)

  // Switch context to template BEFORE updating
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  console.log('[10] switched to template context')

  // Update box height
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, height: 40 })
  console.log('[10] updateBox result:', upR.result, 'maxLevel:', upR.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  // Recalc
  await api.v1.common.recalc({})

  // Check template mass directly
  const tplMass = (await api.v1.assembly.calculateMassProperties({ id: tplId })).result
  console.log('[10] template vol after update:', tplMass.volume, '(expected 96000=60*40*40)')

  // Switch back to assembly and check instances
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const m1After = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result
  const m2After = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result
  console.log('[10] i1 vol after:', m1After.volume)
  console.log('[10] i2 vol after:', m2After.volume)
  console.log('[10] propagated?', m1After.volume !== m1Before.volume)

  filewrite({
    templateVol: tplMass.volume,
    i1Before: m1Before.volume,
    i1After: m1After.volume,
    i2After: m2After.volume,
    propagated: m1After.volume !== m1Before.volume,
  }, 'update-with-context')

  await snapshot('after-update-with-context')

  return { asmId }
}
