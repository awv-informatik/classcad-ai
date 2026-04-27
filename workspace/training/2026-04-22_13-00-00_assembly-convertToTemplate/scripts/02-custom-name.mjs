export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: tplId, radius: 15, height: 40 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })

  // Convert with custom name
  const r = await api.v1.assembly.convertToTemplate({ name: 'MySubAsm' })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)

  // Check the converted template via getAssemblyTemplate
  const found = await api.v1.assembly.getAssemblyTemplate({ name: 'MySubAsm' })
  console.log('[02] getAssemblyTemplate("MySubAsm"):', found.result, 'maxLevel:', found.maxLevel)

  // Also check if default name "Subassembly" exists (should not)
  const notFound = await api.v1.assembly.getAssemblyTemplate({ name: 'Subassembly' })
  console.log('[02] getAssemblyTemplate("Subassembly"):', notFound.result, 'maxLevel:', notFound.maxLevel)

  // Verify the name in structure
  const newRoot = r.structure?.root
  const tree = r.structure?.tree
  const oldRootNode = tree?.['12']
  console.log('[02] new root id:', newRoot)
  console.log('[02] old root (12) name:', oldRootNode?.name, 'class:', oldRootNode?.class)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, newRoot }, 'convert-response')
  filewrite({ foundResult: found.result, notFoundResult: notFound.result, notFoundMaxLevel: notFound.maxLevel }, 'get-template-check')

  return { asmId }
}
