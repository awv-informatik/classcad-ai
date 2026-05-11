// What happens to the group when a grouped instance is deleted?
export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I2', transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I3', transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]] })).result

  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'G1', instanceIds: [inst1, inst2, inst3] })).result
  console.log('[09] groupId:', groupId)

  // Before deletion
  const before = await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })
  console.log('[09] before delete:', JSON.stringify(before.result))

  // Delete one grouped instance
  const delR = await api.v1.assembly.deleteInstance({ ids: [inst2] })
  console.log('[09] deleteInstance result:', delR.result, 'maxLevel:', delR.maxLevel)

  // Check group after instance deletion
  const after = await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })
  console.log('[09] after delete inst2:', JSON.stringify(after.result))
  filewrite({ before: before.result, after: after.result }, 'delete-instance-from-group')

  // Delete all remaining grouped instances
  const delR2 = await api.v1.assembly.deleteInstance({ ids: [inst1, inst3] })
  console.log('[09] delete all remaining result:', delR2.result, 'maxLevel:', delR2.maxLevel)

  // Does group still exist with no instances?
  const afterAll = await api.v1.assembly.getGroup({ id: asmId, name: 'G1' })
  console.log('[09] after delete all:', JSON.stringify(afterAll.result), 'maxLevel:', afterAll.maxLevel)
  filewrite({ result: afterAll.result, messages: afterAll.messages, maxLevel: afterAll.maxLevel }, 'group-after-all-deleted')

  return {}
}
