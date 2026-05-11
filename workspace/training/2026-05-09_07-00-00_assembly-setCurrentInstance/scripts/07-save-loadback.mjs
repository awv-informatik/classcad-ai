export default async function (api, { snapshot, filewrite }) {
  // Build assembly
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl1', height: 30, diameter: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })
  await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'CylInst',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })

  // Save with current = root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const saveAsm = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result

  // Save with current instance = inst1 (product = tpl1)
  await api.v1.assembly.setCurrentInstance({ id: (await api.v1.assembly.getInstance({ ownerId: asmId })).result[0] })
  const saveInst = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result

  // Now load each back and see what we get
  // Load save1 (asm context)
  await api.v1.common.clear({})
  const load1 = await api.v1.common.load({ data: saveAsm.content, format: 'OFB', encoding: 'base64' })
  console.log('[07] Load asm-save: result:', JSON.stringify(load1.result), 'maxLevel:', load1.maxLevel)

  // Check: how many instances?
  const rootId1 = load1.result?.id || load1.result
  const insts1 = await api.v1.assembly.getInstance({ ownerId: rootId1 })
  console.log('[07] Instances after loading asm-save:', JSON.stringify(insts1.result))

  // Load save2 (inst1 context)
  await api.v1.common.clear({})
  const load2 = await api.v1.common.load({ data: saveInst.content, format: 'OFB', encoding: 'base64' })
  console.log('[07] Load inst-save: result:', JSON.stringify(load2.result), 'maxLevel:', load2.maxLevel)

  const rootId2 = load2.result?.id || load2.result
  const insts2 = await api.v1.assembly.getInstance({ ownerId: rootId2 })
  console.log('[07] Instances after loading inst-save:', JSON.stringify(insts2.result))

  filewrite({
    asmSave_loadResult: load1.result,
    asmSave_instances: insts1.result,
    instSave_loadResult: load2.result,
    instSave_instances: insts2.result
  }, 'loadback-comparison')

  return {}
}
