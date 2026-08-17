export default async function (api, { snapshot, filewrite }) {
  // Create assembly + template + instances, dump structure to see how the link works
  const asmId = (await api.v1.assembly.create({ name: 'LinkTest' })).result
  console.log('[01] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  console.log('[01] tplId:', tplId)

  // Build geometry inside template
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result
  console.log('[01] boxId:', boxId)

  // Return to assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances with different transforms
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  console.log('[01] inst1:', inst1)

  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[01] inst2:', inst2)

  // Get the structure tree to see how templates and instances are linked
  const r = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[01] getInstance result:', JSON.stringify(r.result))

  // Dump full structure to see the node types and links
  filewrite(r.structure, 'structure-after-instances')

  await snapshot('two-instances')
  return { asmId, tplId, inst1, inst2 }
}
