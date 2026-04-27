export default async function (api, { filewrite }) {
  // Build an assembly with some parts
  const asmId = (await api.v1.assembly.create({ name: 'ConvertTest' })).result
  const p1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: p1, length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: p1, ownerId: asmId, name: 'I1' })).result
  console.log('[07] initial assembly:', asmId, 'inst:', inst1)

  // Record state before convert
  const before = await api.v1.assembly.getAssemblyTemplate()
  console.log('[07] assembly templates before convert:', JSON.stringify(before.result))

  const beforeParts = await api.v1.assembly.getPartTemplate()
  console.log('[07] part templates before convert:', JSON.stringify(beforeParts.result))

  // Convert root assembly to template
  const rConvert = await api.v1.assembly.convertToTemplate({ name: 'ConvertedSub' })
  console.log('[07] convertToTemplate result:', rConvert.result, 'maxLevel:', rConvert.maxLevel)
  filewrite({ result: rConvert.result, messages: rConvert.messages, maxLevel: rConvert.maxLevel }, 'convert-response')

  // What's the state now?
  console.log('[07] after convert: currentProduct =', rConvert.structure?.currentProduct)
  console.log('[07] after convert: root =', rConvert.structure?.root)

  // Check assembly templates — should include the converted one
  const after = await api.v1.assembly.getAssemblyTemplate()
  console.log('[07] assembly templates after convert:', JSON.stringify(after.result))

  // Check part templates still intact
  const afterParts = await api.v1.assembly.getPartTemplate()
  console.log('[07] part templates after convert:', JSON.stringify(afterParts.result))

  // Dump structure for analysis
  const tree = after.structure?.tree || {}
  const relevant = Object.values(tree)
    .filter(n => ['CC_AssemblyRoot', 'CC_Assembly', 'CC_AssemblyContainer', 'CC_PartContainer'].includes(n.class))
    .map(n => ({ id: n.id, name: n.name, class: n.class, parent: n.parent, children: n.children }))
  filewrite(relevant, 'structure-after-convert')

  return { asmId, p1, inst1 }
}
