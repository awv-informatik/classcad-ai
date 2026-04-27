// Observe both editFeatureIndex (GhostRollbackBar) and children order (RollbackBar)
// when both mechanisms are active simultaneously.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CombinedTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result

  const getState = async (label) => {
    const r = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
    const tree = r.structure.tree
    const opSeq = Object.values(tree).find(n => n.class === 'CC_OperationSequence')
    const rbIndex = opSeq.children.indexOf(20) // RollbackBar id=20
    console.log(`[12] ${label}:`)
    console.log(`  editFeatureIndex=${opSeq.members?.editFeatureIndex?.value}`)
    console.log(`  isDirty=${opSeq.members?.isDirty?.value}`)
    console.log(`  RollbackBar at index ${rbIndex} of ${opSeq.children.length}`)
    console.log(`  children: ${JSON.stringify(opSeq.children)}`)
    return { editFeatureIndex: opSeq.members?.editFeatureIndex?.value, rbIndex, children: opSeq.children }
  }

  // State 1: Both at end
  await getState('1-baseline')

  // State 2: Move RollbackBar before Sph1, open Box1
  await api.v1.part.operationMoveBefore({ id: partId, featureId: sphId })
  await api.v1.part.openFeature({ id: boxId })
  await getState('2-moveBefore+openBox')

  // State 3: Update box while both bars are positioned
  await api.v1.part.updateBox({ id: boxId, height: 120 })
  await getState('3-after-update')

  // State 4: Close feature (ghost bar returns) but RollbackBar stays mid-tree
  await api.v1.part.closeFeature({ id: boxId })
  await getState('4-after-close')

  // State 5: Move RollbackBar to end — full restore
  await api.v1.part.operationMoveToEnd({ id: partId })
  await getState('5-full-restore')

  return { partId }
}
