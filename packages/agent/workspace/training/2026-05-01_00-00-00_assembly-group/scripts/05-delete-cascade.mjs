export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DeleteTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 20, width: 20, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I2',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I3',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create a group
  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'DelGroup', instanceIds: [inst1, inst2, inst3],
  })).result
  console.log('[05] groupId:', groupId)

  // Delete the group via deleteConstraint
  const r1 = await api.v1.assembly.deleteConstraint({ ids: [groupId] })
  console.log('[05] deleteConstraint result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Verify it's gone
  const after = await api.v1.assembly.getGroup({ id: asmId, name: 'DelGroup' })
  console.log('[05] after delete, getGroup:', after.result, 'maxLevel:', after.maxLevel)

  // Create another group to test cascade
  const group2Id = (await api.v1.assembly.group({
    id: asmId, name: 'CascadeGroup', instanceIds: [inst1, inst2],
  })).result
  console.log('[05] group2Id (cascade test):', group2Id)

  // Delete one of the grouped instances
  const r2 = await api.v1.assembly.deleteInstance({ id: inst2 })
  console.log('[05] deleteInstance result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Check if the group survived
  const afterCascade = await api.v1.assembly.getGroup({ id: asmId, name: 'CascadeGroup' })
  console.log('[05] after deleting inst2, group exists?', afterCascade.result !== null)
  if (afterCascade.result) {
    console.log('[05] group after cascade:', JSON.stringify(afterCascade.result))
  }

  // Another test: delete ALL instances in a group
  const group3Id = (await api.v1.assembly.group({
    id: asmId, name: 'AllDelGroup', instanceIds: [inst1, inst3],
  })).result
  console.log('[05] group3Id (all-delete test):', group3Id)

  await api.v1.assembly.deleteInstance({ id: inst1 })
  await api.v1.assembly.deleteInstance({ id: inst3 })

  const afterAllDel = await api.v1.assembly.getGroup({ id: asmId, name: 'AllDelGroup' })
  console.log('[05] after deleting all instances, group exists?', afterAllDel.result !== null)
  if (afterAllDel.result) {
    console.log('[05] surviving group:', JSON.stringify(afterAllDel.result))
  }

  filewrite({
    deleteResult: { result: r1.result, maxLevel: r1.maxLevel },
    cascadeResult: afterCascade.result,
    allDeleteResult: afterAllDel.result,
  }, 'delete-cascade')

  return { asmId }
}
