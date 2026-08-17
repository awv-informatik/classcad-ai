export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 20 })

  const tplB = (await api.v1.assembly.partTemplate({ name: 'CylB' })).result
  await api.v1.part.cylinder({ id: tplB, name: 'Cyl', height: 30, diameter: 20 })

  const tplC = (await api.v1.assembly.partTemplate({ name: 'SphC' })).result
  await api.v1.part.sphere({ id: tplC, name: 'Sph', radius: 12 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Inst2', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Inst3', transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]] })).result

  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'G1', instanceIds: [inst1, inst2] })).result
  console.log('[03] groupId:', groupId)

  // Verify initial state
  const before = await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })
  console.log('[03] before:', JSON.stringify(before.result))

  // Update: change instanceIds (add inst3, remove inst2)
  const r1 = await api.v1.assembly.updateGroup({ id: groupId, instanceIds: [inst1, inst3] })
  console.log('[03] updateGroup instanceIds result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'update-instanceIds')

  const after1 = await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })
  console.log('[03] after instanceIds update:', JSON.stringify(after1.result))
  filewrite(after1.result, 'after-instanceIds-update')

  // Update: rename
  const r2 = await api.v1.assembly.updateGroup({ id: groupId, name: 'RenamedGroup' })
  console.log('[03] updateGroup rename result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Old name should fail
  const oldName = await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })
  console.log('[03] old name after rename result:', oldName.result, 'maxLevel:', oldName.maxLevel)

  // New name should work
  const newName = await api.v1.assembly.getGroup({ id: asmId, name: 'RenamedGroup' })
  console.log('[03] new name after rename result:', JSON.stringify(newName.result))
  filewrite(newName.result, 'after-rename')

  // Partial update: only name, instanceIds should be preserved
  const r3 = await api.v1.assembly.updateGroup({ id: groupId, name: 'FinalName' })
  const final = await api.v1.assembly.getGroup({ id: asmId, name: 'FinalName' })
  console.log('[03] final state:', JSON.stringify(final.result))
  filewrite(final.result, 'final-state')

  // Update with assembly ID instead of group ID — should fail
  const r4 = await api.v1.assembly.updateGroup({ id: asmId, instanceIds: [inst1] })
  console.log('[03] updateGroup with asmId result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'update-wrong-id')

  return { groupId }
}
