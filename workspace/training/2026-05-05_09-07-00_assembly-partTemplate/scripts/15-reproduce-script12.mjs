export default async function (api, { filewrite }) {
  // Exact reproduction of script 12 flow with intermediate measurements
  const asmId = (await api.v1.assembly.create({ name: 'Repro12' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  // Step A: Create instance BEFORE update
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const iBefore = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'BeforeUpdate' })).result

  // Measure at this point
  const m0 = (await api.v1.assembly.calculateMassProperties({ id: iBefore })).result.volume
  console.log('[15] iBefore vol at creation:', m0)

  // Step B: Update template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 40 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Measure from template context
  const m1 = (await api.v1.assembly.calculateMassProperties({ id: iBefore })).result.volume
  console.log('[15] iBefore vol after update (template context):', m1)

  // Step C: Create instance AFTER update
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const iAfter = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'AfterUpdate',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure both — this is where script 12 measured
  const mBefore = (await api.v1.assembly.calculateMassProperties({ id: iBefore })).result
  const mAfter = (await api.v1.assembly.calculateMassProperties({ id: iAfter })).result
  console.log('[15] iBefore vol (final):', mBefore.volume, 'cog:', JSON.stringify(mBefore.cog))
  console.log('[15] iAfter vol (final):', mAfter.volume, 'cog:', JSON.stringify(mAfter.cog))

  filewrite({
    atCreation: m0,
    afterUpdateTemplateCtx: m1,
    finalBefore: mBefore.volume,
    finalAfter: mAfter.volume,
  }, 'reproduce-12')

  return { asmId }
}
