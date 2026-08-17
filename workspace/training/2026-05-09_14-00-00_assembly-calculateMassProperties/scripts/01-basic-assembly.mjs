export default async function (api, { snapshot, filewrite }) {
  // Create assembly with one part template containing a box
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({})).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create one instance at origin
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result

  // Test assembly.calculateMassProperties on the assembly root
  const rAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[01] asm root result:', JSON.stringify(rAsm.result))
  console.log('[01] asm root maxLevel:', rAsm.maxLevel)

  // Test on the instance
  const rInst = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[01] instance result:', JSON.stringify(rInst.result))
  console.log('[01] instance maxLevel:', rInst.maxLevel)

  // Test on the template (part ID)
  const rTpl = await api.v1.assembly.calculateMassProperties({ id: tplId })
  console.log('[01] template result:', JSON.stringify(rTpl.result))
  console.log('[01] template maxLevel:', rTpl.maxLevel)

  // Compare with part.calculateMassProperties
  const rPartAsm = await api.v1.part.calculateMassProperties({ id: asmId })
  console.log('[01] part.calcMass(asmId) result:', JSON.stringify(rPartAsm.result))

  const rPartInst = await api.v1.part.calculateMassProperties({ id: inst1 })
  console.log('[01] part.calcMass(instId) result:', JSON.stringify(rPartInst.result))

  const rPartTpl = await api.v1.part.calculateMassProperties({ id: tplId })
  console.log('[01] part.calcMass(tplId) result:', JSON.stringify(rPartTpl.result))

  filewrite({
    asmRoot: { result: rAsm.result, maxLevel: rAsm.maxLevel, messages: rAsm.messages },
    instance: { result: rInst.result, maxLevel: rInst.maxLevel, messages: rInst.messages },
    template: { result: rTpl.result, maxLevel: rTpl.maxLevel, messages: rTpl.messages },
    partDomain: {
      asmRoot: rPartAsm.result,
      instance: rPartInst.result,
      template: rPartTpl.result,
    },
  }, 'basic-results')

  await snapshot('basic-assembly')
  return { asmId, tplId, inst1 }
}
