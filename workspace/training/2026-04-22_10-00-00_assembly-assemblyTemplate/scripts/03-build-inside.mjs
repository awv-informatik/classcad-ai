export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BuildTest' })).result

  // Create a part template with geometry
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partTplId, name: 'Box1', length: 40, width: 30, height: 20 })

  // Create a second part template
  const partTpl2 = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: partTpl2, name: 'Cyl1', radius: 15, height: 50 })

  // Create an assembly template (sub-assembly)
  const subAsmId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[03] subAsmId:', subAsmId)

  // Check currentProduct right after creating the assembly template
  const r1 = await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })
  console.log('[03] currentProduct after assemblyTemplate:', r1.structure?.currentProduct)

  // Try to add instances inside the assembly template
  // First, switch context to the assembly template
  const prevProduct = (await api.v1.assembly.setCurrentProduct({ id: subAsmId })).result
  console.log('[03] prevProduct after setCurrentProduct to subAsm:', prevProduct)

  // Now add instances of part templates to the sub-assembly template
  const inst1 = await api.v1.assembly.instance({
    productId: partTplId,
    ownerId: subAsmId,
    name: 'BoxInst',
  })
  console.log('[03] instance in subAsm result:', inst1.result, 'maxLevel:', inst1.maxLevel)

  const inst2 = await api.v1.assembly.instance({
    productId: partTpl2,
    ownerId: subAsmId,
    name: 'CylInst',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[03] instance2 in subAsm result:', inst2.result, 'maxLevel:', inst2.maxLevel)

  // Switch back to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly itself
  const subInst = await api.v1.assembly.instance({
    productId: subAsmId,
    ownerId: asmId,
    name: 'SubAsmInst1',
  })
  console.log('[03] sub-assembly instance:', subInst.result, 'maxLevel:', subInst.maxLevel)

  await snapshot('sub-assembly-with-parts')

  // Dump relevant structure
  const tree = subInst.structure?.tree || {}
  const asmNodes = Object.values(tree)
    .filter(n => n.class === 'CC_Assembly' || n.class === 'CC_AssemblyInstance' || n.class === 'CC_PartInstance')
    .map(n => ({ id: n.id, name: n.name, class: n.class, parent: n.parent, children: n.children }))
  filewrite(asmNodes, 'assembly-tree-nodes')

  return { asmId, subAsmId, partTplId, partTpl2 }
}
