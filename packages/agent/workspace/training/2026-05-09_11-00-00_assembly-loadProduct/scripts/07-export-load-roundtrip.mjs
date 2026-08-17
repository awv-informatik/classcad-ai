// Test: exportNode a template, then loadProduct it into a new assembly
export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a box template
  const asmId = (await api.v1.assembly.create({ name: 'ExportAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 50, width: 30, height: 25 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'Mate',
    origin: [25, 15, 25], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result

  // Export the template via exportNode
  const exported = await api.v1.assembly.exportNode({
    id: tplId, format: 'OFB', encoding: 'base64', compression: 'deflate',
  })
  console.log('[07] exportNode success:', exported.result.success, 'content length:', exported.result.content.length)
  const exportedData = exported.result.content

  // Clear and create a new assembly, load the exported product
  await api.v1.common.clear({})
  const asm2 = (await api.v1.assembly.create({ name: 'ImportAsm' })).result
  const loaded = await api.v1.assembly.loadProduct({
    data: exportedData, format: 'OFB', encoding: 'base64', compression: 'deflate',
  })
  console.log('[07] loadProduct result:', JSON.stringify(loaded.result), 'maxLevel:', loaded.maxLevel)
  const newTplId = loaded.result.id

  // Instantiate and verify
  await api.v1.assembly.setCurrentProduct({ id: asm2 })
  const inst2 = (await api.v1.assembly.instance({ productId: newTplId, ownerId: asm2, name: 'Reimported' })).result

  const mass = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[07] Reimported COG:', JSON.stringify(mass.cog), 'volume:', mass.volume)
  // Expected: 50×30×25 box → COG (25,15,12.5), volume 37500
  filewrite(mass, 'roundtrip-mass')

  // Check if the work geometry survived the roundtrip
  const wg = await api.v1.assembly.getWorkGeometry({ id: newTplId, name: 'Mate' })
  console.log('[07] getWorkGeometry "Mate":', JSON.stringify(wg.result), 'maxLevel:', wg.maxLevel)

  await snapshot('reimported')
  return { newTplId, inst2 }
}
