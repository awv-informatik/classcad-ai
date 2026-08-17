export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UpdateGroupTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 20, width: 20, height: 20 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'P2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 20, diameter: 15 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'I2',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I3',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create group with inst1 and inst2
  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'G1', instanceIds: [inst1, inst2],
  })).result
  console.log('[03] groupId:', groupId)

  // Verify initial state
  const before = (await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })).result
  console.log('[03] before:', JSON.stringify(before))

  // Update: change instanceIds
  const r1 = await api.v1.assembly.updateGroup({
    id: groupId, instanceIds: [inst1, inst2, inst3],
  })
  console.log('[03] updateGroup (add inst3) result:', r1.result, 'maxLevel:', r1.maxLevel)
  const after1 = (await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })).result
  console.log('[03] after add inst3:', JSON.stringify(after1))

  // Update: change name
  const r2 = await api.v1.assembly.updateGroup({
    id: groupId, name: 'RenamedGroup',
  })
  console.log('[03] updateGroup (rename) result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Verify old name is gone
  const oldName = (await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })).result
  const newName = (await api.v1.assembly.getGroup({ id: asmId, name: 'RenamedGroup' })).result
  console.log('[03] old name lookup:', oldName)
  console.log('[03] new name lookup:', JSON.stringify(newName))

  // Update: change both name and instanceIds at once
  const r3 = await api.v1.assembly.updateGroup({
    id: groupId, name: 'FinalGroup', instanceIds: [inst1],
  })
  console.log('[03] updateGroup (both) result:', r3.result, 'maxLevel:', r3.maxLevel)
  const final = (await api.v1.assembly.getGroup({ id: asmId, name: 'FinalGroup' })).result
  console.log('[03] final state:', JSON.stringify(final))

  // Update: partial — only name, instanceIds should be preserved
  const r4 = await api.v1.assembly.updateGroup({
    id: groupId, name: 'StillFinal',
  })
  const preserved = (await api.v1.assembly.getGroup({ id: asmId, name: 'StillFinal' })).result
  console.log('[03] after name-only update, instanceIds preserved?', JSON.stringify(preserved))

  filewrite({
    before,
    afterAdd: after1,
    afterRename: newName,
    afterBoth: final,
    afterNameOnly: preserved,
  }, 'update-progression')

  return { groupId }
}
