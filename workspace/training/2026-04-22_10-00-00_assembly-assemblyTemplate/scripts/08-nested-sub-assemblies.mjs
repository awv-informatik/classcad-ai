export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NestTest' })).result

  // Create a part template (simple box)
  const boxTpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: boxTpl, length: 30, width: 20, height: 15 })

  // Create sub-assembly template A
  const subA = (await api.v1.assembly.assemblyTemplate({ name: 'SubA' })).result
  console.log('[08] subA:', subA)

  // Switch into subA, add a box instance
  await api.v1.assembly.setCurrentProduct({ id: subA })
  await api.v1.assembly.instance({ productId: boxTpl, ownerId: subA, name: 'BoxInA' })

  // Create sub-assembly template B (nested inside A? or still in container?)
  // NOTE: assemblyTemplate() always creates in AssemblyContainer, not inside the current product
  const subB = (await api.v1.assembly.assemblyTemplate({ name: 'SubB' })).result
  console.log('[08] subB:', subB)

  // Add box instance to subB
  await api.v1.assembly.setCurrentProduct({ id: subB })
  await api.v1.assembly.instance({ productId: boxTpl, ownerId: subB, name: 'BoxInB' })

  // Now nest subB inside subA
  await api.v1.assembly.setCurrentProduct({ id: subA })
  const subBInst = await api.v1.assembly.instance({
    productId: subB,
    ownerId: subA,
    name: 'SubBInst',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[08] subB instanced in subA:', subBInst.result, 'maxLevel:', subBInst.maxLevel)

  // Instance subA in root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const subAInst = await api.v1.assembly.instance({
    productId: subA,
    ownerId: asmId,
    name: 'SubAInst',
  })
  console.log('[08] subA instanced in root:', subAInst.result, 'maxLevel:', subAInst.maxLevel)

  await snapshot('nested-sub-assemblies')

  // Verify structure: subA contains BoxInA + SubBInst, SubB contains BoxInB
  const r = await api.v1.assembly.getAssemblyTemplate()
  const tree = r.structure?.tree || {}
  const asmNodes = Object.values(tree)
    .filter(n => ['CC_Assembly', 'CC_AssemblyRoot', 'CC_AssemblyInstance', 'CC_PartInstance'].includes(n.class))
    .map(n => ({ id: n.id, name: n.name, class: n.class, parent: n.parent, children: n.children?.slice(0, 6) }))
  filewrite(asmNodes, 'nested-tree')

  return { asmId, subA, subB }
}
