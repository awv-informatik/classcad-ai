export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Edge' })).result
  await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })

  // Duplicate types in the array
  const r1 = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'TOP', 'FRONT'] })
  console.log('[10] dup types result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Check structure
  const names1 = []
  for (const [nid, node] of Object.entries(r1.structure.tree)) {
    if (node.class === 'CC_View2D') names1.push({ id: parseInt(nid), name: node.name })
  }
  console.log('[10] view nodes:', JSON.stringify(names1))

  // Invalid type string
  const r2 = await api.v1.drawing2d.view({ id: partId, types: ['INVALID'] })
  console.log('[10] invalid type result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) {
    console.log('[10] invalid type messages:', JSON.stringify(r2.messages))
  }

  // Test on assembly
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'AsmBox', length: 60, width: 40, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'I1' })).result

  const r3 = await api.v1.drawing2d.view({ id: asmId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[10] assembly view result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  if (r3.messages.length > 0) {
    console.log('[10] assembly messages:', JSON.stringify(r3.messages))
  }

  filewrite({
    dupResult: r1.result,
    dupViewNodes: names1,
    invalidResult: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    assemblyResult: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }
  }, 'edge-cases')

  return { partId, asmId }
}
