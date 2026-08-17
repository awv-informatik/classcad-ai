export default async function (api, { snapshot, filewrite }) {
  // Create assembly
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[17] asmId:', asmId)

  // Create part template with a box
  const tplId = (await api.v1.assembly.partTemplate({})).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 40, width: 30, height: 20 })).result
  console.log('[17] tplId:', tplId, 'boxId:', boxId)

  // Return to assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[17] inst1:', inst1, 'inst2:', inst2)

  // Assembly-level mass properties
  const rAsm = await api.v1.part.calculateMassProperties({ id: asmId })
  console.log('[17] assembly result:', JSON.stringify(rAsm.result))
  console.log('[17] assembly maxLevel:', rAsm.maxLevel)

  // Instance-level mass properties
  const rInst1 = await api.v1.part.calculateMassProperties({ id: inst1 })
  console.log('[17] inst1 result:', JSON.stringify(rInst1.result))
  console.log('[17] inst1 maxLevel:', rInst1.maxLevel)

  const rInst2 = await api.v1.part.calculateMassProperties({ id: inst2 })
  console.log('[17] inst2 result:', JSON.stringify(rInst2.result))
  console.log('[17] inst2 maxLevel:', rInst2.maxLevel)

  // Template-level mass properties
  const rTpl = await api.v1.part.calculateMassProperties({ id: tplId })
  console.log('[17] template result:', JSON.stringify(rTpl.result))
  console.log('[17] template maxLevel:', rTpl.maxLevel)

  filewrite({
    assembly: { result: rAsm.result, maxLevel: rAsm.maxLevel, messages: rAsm.messages },
    inst1: { result: rInst1.result, maxLevel: rInst1.maxLevel, messages: rInst1.messages },
    inst2: { result: rInst2.result, maxLevel: rInst2.maxLevel, messages: rInst2.messages },
    template: { result: rTpl.result, maxLevel: rTpl.maxLevel, messages: rTpl.messages },
  }, 'assembly')

  // Box: 40*30*20 = 24000 per instance
  // Two instances => total 48000
  // inst1 at origin, inst2 at [100,0,0]
  // Assembly COG should be at [50 + boxCogX, boxCogY, boxCogZ] if weighted
  console.log('[17] expected per-instance vol: 24000, total: 48000')

  await snapshot('assembly')
  return { asmId }
}
