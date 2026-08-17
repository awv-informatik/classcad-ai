export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RecalcTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result

  // Measure before
  const volBefore = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  console.log('[11] vol before:', volBefore)

  // Update template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 40 })
  await api.v1.part.closeFeature({ id: boxId })

  // Recalc in template context
  await api.v1.common.recalc({})
  const tplVol = (await api.v1.assembly.calculateMassProperties({ id: tplId })).result.volume
  console.log('[11] template vol after update:', tplVol)

  // Switch to assembly and recalc THERE
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.common.recalc({})

  // Check instance now
  const volAfterAsmRecalc = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result.volume
  console.log('[11] instance vol after asm recalc:', volAfterAsmRecalc)

  // Try calculating mass of the WHOLE assembly
  const asmMass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[11] assembly total vol:', asmMass.volume)

  filewrite({
    volBefore,
    templateVolAfterUpdate: tplVol,
    instanceVolAfterAsmRecalc: volAfterAsmRecalc,
    asmTotalVol: asmMass.volume,
    propagated: volBefore !== volAfterAsmRecalc,
  }, 'recalc-assembly')

  return { asmId }
}
