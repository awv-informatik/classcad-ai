// Deep-inspect the OperationSequence node to find how it represents child ordering
// and whether the RollbackBar position is encoded.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result

  // Dump the OperationSequence node with ALL properties in default state
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const tree1 = r1.structure.tree
  const opSeq1 = Object.values(tree1).find(n => n.class === 'CC_OperationSequence')
  console.log('[09] OperationSequence node keys:', Object.keys(opSeq1).join(', '))
  console.log('[09] Full node:', JSON.stringify(opSeq1, null, 2))
  filewrite(opSeq1, 'opseq-node-default')

  // Also dump the RollbackBar node
  const rb1 = Object.values(tree1).find(n => n.class === 'CC_RollbackBar')
  console.log('[09] RollbackBar node:', JSON.stringify(rb1, null, 2))
  filewrite(rb1, 'rollbackbar-node-default')

  // Now move bar before Cyl1 and compare
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const tree2 = r2.structure.tree
  const opSeq2 = Object.values(tree2).find(n => n.class === 'CC_OperationSequence')
  const rb2 = Object.values(tree2).find(n => n.class === 'CC_RollbackBar')
  console.log('[09] After moveBefore — OpSeq children:', opSeq2.children)
  console.log('[09] After moveBefore — RB node:', JSON.stringify(rb2, null, 2))
  filewrite(opSeq2, 'opseq-node-movebefore')
  filewrite(rb2, 'rollbackbar-node-movebefore')

  // Check if any children are missing or have different properties
  const children1 = Object.values(tree1).filter(n => n.parent === opSeq1.id)
  const children2 = Object.values(tree2).filter(n => n.parent === opSeq2.id)
  console.log('[09] Children count default:', children1.length, 'moveBefore:', children2.length)

  // Check if child IDs are the same
  const ids1 = children1.map(n => n.id).sort((a, b) => a - b)
  const ids2 = children2.map(n => n.id).sort((a, b) => a - b)
  console.log('[09] Same children?', JSON.stringify(ids1) === JSON.stringify(ids2))

  await api.v1.part.operationMoveToEnd({ id: partId })

  return { partId }
}
