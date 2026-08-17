// Test: loadProduct with an assembly OFB (not just a part)
// Can we load a sub-assembly into an existing assembly?
export default async function (api, { snapshot, filewrite }) {
  // Create a simple assembly: box + cylinder
  const asmId = (await api.v1.assembly.create({ name: 'SubAsm' })).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result

  // Save the whole assembly as OFB
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[10] Saved assembly OFB, content length:', saved.result.content.length)
  const asmData = saved.result.content

  // Clear, create a new assembly, try to load the sub-assembly
  await api.v1.common.clear({})
  const rootAsm = (await api.v1.assembly.create({ name: 'RootAsm' })).result

  const loaded = await api.v1.assembly.loadProduct({
    data: asmData, format: 'OFB', encoding: 'base64', compression: 'deflate',
  })
  console.log('[10] loadProduct assembly result:', JSON.stringify(loaded.result), 'maxLevel:', loaded.maxLevel)
  if (loaded.messages.length > 0) {
    console.log('[10] messages:', loaded.messages.map(m => m.message).join('; '))
  }

  if (loaded.result && loaded.result.id) {
    const subId = loaded.result.id
    filewrite(loaded.structure, 'asm-load-structure')

    // Check type — is it an assembly template or part template?
    // Try getAssemblyTemplate
    const getAsm = await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })
    console.log('[10] getAssemblyTemplate "SubAsm":', JSON.stringify(getAsm.result), 'maxLevel:', getAsm.maxLevel)

    const getPart = await api.v1.assembly.getPartTemplate({ name: 'SubAsm' })
    console.log('[10] getPartTemplate "SubAsm":', JSON.stringify(getPart.result), 'maxLevel:', getPart.maxLevel)

    // Try to instantiate it
    await api.v1.assembly.setCurrentProduct({ id: rootAsm })
    const inst = await api.v1.assembly.instance({ productId: subId, ownerId: rootAsm, name: 'SubInst' })
    console.log('[10] Instance of loaded assembly:', inst.result, 'maxLevel:', inst.maxLevel)

    if (inst.result) {
      await snapshot('loaded-assembly')
    }
  }

  return {}
}
