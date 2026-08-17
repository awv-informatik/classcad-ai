export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CleanProp' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  // Create instances
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result

  // Measure before — in assembly context
  const volBefore = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  console.log('[13] vol before update:', volBefore)

  // Update template: switch to template context, modify, close, recalc
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 40 })
  await api.v1.part.closeFeature({ id: boxId })

  // Recalc while in template context
  await api.v1.common.recalc({})

  // Switch to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Recalc in assembly context
  await api.v1.common.recalc({})

  // Measure instance — does it update NOW?
  const volAfterRecalc = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  console.log('[13] vol after recalc (both contexts):', volAfterRecalc)

  // Check template directly
  const tplVol = (await api.v1.assembly.calculateMassProperties({ id: tplId })).result.volume
  console.log('[13] template vol:', tplVol)

  // Maybe the issue is that in earlier scripts, the recalc didn't work because
  // we didn't have the assembly as current product. Let me try the reverse order:
  // Create a second scenario — update without switching to template
  // Can we openFeature/updateBox while currentProduct is assembly?
  const tpl2Id = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  const box2Id = (await api.v1.part.box({ id: tpl2Id, name: 'Cube', length: 30, width: 30, height: 30 })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const i2 = (await api.v1.assembly.instance({ productId: tpl2Id, ownerId: asmId, name: 'Inst2' })).result

  const vol2Before = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result.volume
  console.log('[13] i2 vol before:', vol2Before)

  // Try updating WITHOUT switching to template context
  await api.v1.part.openFeature({ id: box2Id })
  const upR = await api.v1.part.updateBox({ id: box2Id, height: 60 })
  console.log('[13] updateBox from asm context - maxLevel:', upR.maxLevel, 'currentProduct:', upR.structure?.currentProduct)
  await api.v1.part.closeFeature({ id: box2Id })
  await api.v1.common.recalc({})

  const vol2After = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result.volume
  console.log('[13] i2 vol after (no context switch):', vol2After)

  filewrite({
    scenario1: { volBefore, volAfterRecalc, tplVol },
    scenario2: { vol2Before, vol2After, updateFromAsmContext: upR.maxLevel === 31 },
  }, 'propagation-clean')

  return { asmId }
}
