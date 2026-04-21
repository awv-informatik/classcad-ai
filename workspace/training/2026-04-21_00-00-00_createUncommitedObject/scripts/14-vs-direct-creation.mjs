export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompareTest' })).result

  // Direct creation
  const directBox = (await api.v1.part.box({ id: partId, name: 'DirectBox', length: 60, width: 40, height: 30 })).result
  console.log('[14] direct box:', directBox)

  // Uncommitted creation
  const uncommittedBox = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'UncommittedBox' })).result
  console.log('[14] uncommitted box:', uncommittedBox)

  // Check structure - both should be in the tree
  const r1 = await api.v1.common.recalc({})
  const tree1 = r1.structure?.tree

  // Find operation sequence to compare position
  for (const [k, v] of Object.entries(tree1)) {
    if (v.class === 'CC_OperationSequence') {
      console.log('[14] OperationSequence children:', JSON.stringify(v.children))
    }
  }

  // The direct box should be findable, the uncommitted should not (yet)
  const getD = await api.v1.part.getFeature({ id: partId, name: 'DirectBox' })
  const getU = await api.v1.part.getFeature({ id: partId, name: 'UncommittedBox' })
  console.log('[14] getFeature DirectBox:', getD.result, '(maxLevel:', getD.maxLevel + ')')
  console.log('[14] getFeature UncommittedBox:', getU.result, '(maxLevel:', getU.maxLevel + ')')

  // Commit the uncommitted box
  await api.v1.part.openFeature({ id: uncommittedBox })
  await api.v1.part.updateBox({ id: uncommittedBox, length: 80, width: 50, height: 20 })
  await api.v1.part.closeFeature({ id: uncommittedBox })

  // Now both should be findable
  const getU2 = await api.v1.part.getFeature({ id: partId, name: 'UncommittedBox' })
  console.log('[14] getFeature UncommittedBox after commit:', getU2.result, '(maxLevel:', getU2.maxLevel + ')')

  await snapshot('both-boxes')

  // Dump graphic data to verify both have geometry
  const r2 = await api.v1.common.recalc({})
  filewrite(r2.structure, 'final-structure')

  return { partId, directBox, uncommittedBox }
}
