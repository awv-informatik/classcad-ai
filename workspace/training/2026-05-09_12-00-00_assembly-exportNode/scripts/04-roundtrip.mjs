export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a part
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'Body', length: 80, width: 60, height: 40 })
  await api.v1.part.cylinder({ id: tplId, name: 'Hole', radius: 10, height: 50 })
  await api.v1.part.boolean({ id: tplId, type: 'SUBTRACTION', target: 'Body', tools: ['Hole'] })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await snapshot('before-export')

  // Export as OFB with base64+deflate (standard roundtrip format)
  const exported = await api.v1.assembly.exportNode({ id: tplId, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[04] export — success:', exported.result?.success, 'content length:', exported.result?.content?.length)

  // Clear and create fresh assembly, then load
  await api.v1.common.clear({})
  const asm2 = (await api.v1.assembly.create({ name: 'Asm2' })).result
  const loaded = await api.v1.assembly.loadProduct({
    data: exported.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[04] loadProduct — id:', loaded.result?.id, 'maxLevel:', loaded.maxLevel)

  // Instantiate the loaded template
  await api.v1.assembly.setCurrentProduct({ id: asm2 })
  const inst2 = (await api.v1.assembly.instance({ productId: loaded.result.id, ownerId: asm2, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  console.log('[04] instance created:', inst2)

  await snapshot('after-roundtrip')

  // Verify geometry integrity via mass properties
  await api.v1.assembly.setCurrentProduct({ id: loaded.result.id })
  const mass = await api.v1.assembly.calculateMassProperties({ products: [loaded.result.id] })
  console.log('[04] mass volume:', mass.result?.volume)
  filewrite({ exportedContentLength: exported.result?.content?.length, loadedId: loaded.result?.id, mass: mass.result }, 'roundtrip-data')

  return { asm2, loadedId: loaded.result?.id }
}
