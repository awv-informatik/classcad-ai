export default async function (api, { filewrite }) {
  // Convert an empty assembly (no templates, no instances)
  const asmId = (await api.v1.assembly.create({ name: 'Empty' })).result
  console.log('[05] asmId:', asmId)

  const r = await api.v1.assembly.convertToTemplate({ name: 'EmptySub' })
  console.log('[05] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  const newRoot = r.structure?.root
  console.log('[05] new root:', newRoot)

  // Verify the converted template exists but is empty
  const asmTpl = await api.v1.assembly.getAssemblyTemplate({ name: 'EmptySub' })
  console.log('[05] getAssemblyTemplate("EmptySub"):', asmTpl.result)

  // Check old root (12) in structure
  const oldRootNode = r.structure?.tree?.['12']
  console.log('[05] old root (12) class:', oldRootNode?.class, 'instances:', oldRootNode?.instances)

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    newRoot,
    oldRootClass: oldRootNode?.class,
    oldRootInstances: oldRootNode?.instances,
  }, 'empty-convert')

  return { asmId }
}
