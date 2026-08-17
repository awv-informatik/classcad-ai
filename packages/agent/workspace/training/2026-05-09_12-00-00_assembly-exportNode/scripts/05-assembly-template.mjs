export default async function (api, { snapshot, filewrite }) {
  // Create top-level assembly
  const rootId = (await api.v1.assembly.create({ name: 'TopAsm' })).result

  // Create sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result

  // Create a part inside the sub-assembly
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.assembly.setCurrentProduct({ id: partTpl })
  await api.v1.part.box({ id: partTpl, name: 'PlateBody', length: 100, width: 50, height: 10 })

  // Add a second part template
  const partTpl2 = (await api.v1.assembly.partTemplate({ name: 'Pin' })).result
  await api.v1.assembly.setCurrentProduct({ id: partTpl2 })
  await api.v1.part.cylinder({ id: partTpl2, name: 'PinBody', radius: 5, height: 30 })

  // Instantiate both parts inside sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: subAsmTpl })
  await api.v1.assembly.instance({ productId: partTpl, ownerId: subAsmTpl, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })
  await api.v1.assembly.instance({ productId: partTpl2, ownerId: subAsmTpl, transformation: [[20, 20, 10], [1, 0, 0], [0, 1, 0]] })

  // Instantiate sub-assembly in root
  await api.v1.assembly.setCurrentProduct({ id: rootId })
  await api.v1.assembly.instance({ productId: subAsmTpl, ownerId: rootId, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })

  await snapshot('full-assembly')

  // Export the sub-assembly template (should include its children)
  const r1 = await api.v1.assembly.exportNode({ id: subAsmTpl, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[05] export subAsm template — success:', r1.result?.success, 'maxLevel:', r1.maxLevel)
  console.log('[05] subAsm content length:', r1.result?.content?.length)

  // Export just a part template from within the assembly
  const r2 = await api.v1.assembly.exportNode({ id: partTpl, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[05] export partTpl — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  console.log('[05] partTpl content length:', r2.result?.content?.length)

  // Export the root assembly
  const r3 = await api.v1.assembly.exportNode({ id: rootId, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[05] export root — success:', r3.result?.success, 'maxLevel:', r3.maxLevel)
  console.log('[05] root content length:', r3.result?.content?.length)

  filewrite({
    subAsmLength: r1.result?.content?.length,
    partTplLength: r2.result?.content?.length,
    rootLength: r3.result?.content?.length,
  }, 'size-comparison')

  return { rootId, subAsmTpl, partTpl }
}
