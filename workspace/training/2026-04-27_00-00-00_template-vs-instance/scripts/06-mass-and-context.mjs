export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'MassTest' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box1', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Block1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Block2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Mass properties at different levels
  const massAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[06] mass(assembly):', JSON.stringify(massAsm.result))

  const massInst1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[06] mass(inst1):', JSON.stringify(massInst1.result))

  const massInst2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[06] mass(inst2):', JSON.stringify(massInst2.result))

  const massTpl = await api.v1.assembly.calculateMassProperties({ id: tpl })
  console.log('[06] mass(template):', JSON.stringify(massTpl.result))

  // Test setCurrentProduct behavior
  // What is currentProduct after assembly operations?
  const r1 = await api.v1.common.getAppVersion({})
  console.log('[06] currentProduct after asm ops:', r1.structure.currentProduct)
  console.log('[06] currentInstance:', r1.structure.currentInstance)

  // Switch to template
  const prev = await api.v1.assembly.setCurrentProduct({ id: tpl })
  console.log('[06] setCurrentProduct(tpl) -> prev:', prev.result)

  const r2 = await api.v1.common.getAppVersion({})
  console.log('[06] currentProduct after switch to tpl:', r2.structure.currentProduct)

  // Switch back to assembly
  const prev2 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[06] setCurrentProduct(asm) -> prev:', prev2.result)

  // Can we setCurrentProduct to an instance?
  const tryInst = await api.v1.assembly.setCurrentProduct({ id: inst1 })
  console.log('[06] setCurrentProduct(inst1):', tryInst.result, 'maxLevel:', tryInst.maxLevel)

  const r3 = await api.v1.common.getAppVersion({})
  console.log('[06] currentProduct after switch to inst:', r3.structure.currentProduct, 'currentInstance:', r3.structure.currentInstance)

  return { asmId, tpl, inst1, inst2 }
}
