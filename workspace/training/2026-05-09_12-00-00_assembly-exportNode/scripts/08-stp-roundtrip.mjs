export default async function (api, { snapshot, filewrite }) {
  // Create a part with distinctive geometry
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'Base', length: 100, width: 60, height: 20 })

  // Export as STP with base64+deflate
  const exported = await api.v1.assembly.exportNode({ id: tplId, format: 'STP', encoding: 'base64', compression: 'deflate' })
  console.log('[08] STP export — success:', exported.result?.success, 'content length:', exported.result?.content?.length)

  // Roundtrip: load back
  await api.v1.common.clear({})
  const asm2 = (await api.v1.assembly.create({ name: 'Asm2' })).result
  const loaded = await api.v1.assembly.loadProduct({
    data: exported.result.content,
    format: 'STP',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[08] STP loadProduct — id:', loaded.result?.id, 'maxLevel:', loaded.maxLevel)
  console.log('[08] messages:', JSON.stringify(loaded.messages))

  if (loaded.result?.id) {
    await api.v1.assembly.setCurrentProduct({ id: asm2 })
    const inst = (await api.v1.assembly.instance({ productId: loaded.result.id, ownerId: asm2, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
    console.log('[08] instance:', inst)
    await snapshot('stp-roundtrip')
  }

  // Also test: common.save → exportNode comparison
  // Export the assembly root itself
  const rootExport = await api.v1.assembly.exportNode({ id: asm2, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[08] root export — success:', rootExport.result?.success, 'content length:', rootExport.result?.content?.length)

  // common.save for comparison
  const saveResult = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[08] common.save — content length:', saveResult.result?.content?.length)

  filewrite({
    exportNodeLength: rootExport.result?.content?.length,
    commonSaveLength: saveResult.result?.content?.length,
    sameContent: rootExport.result?.content === saveResult.result?.content,
  }, 'export-vs-save')

  return {}
}
