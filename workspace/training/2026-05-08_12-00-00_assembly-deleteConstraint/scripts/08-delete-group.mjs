export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'I2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create group (correct params: instanceIds)
  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'TestGroup', instanceIds: [inst1, inst2],
  })).result
  console.log('[08] groupId:', groupId)

  // Verify group exists
  const getBefore = await api.v1.assembly.getGroup({ id: asmId, name: 'TestGroup' })
  console.log('[08] group before delete:', JSON.stringify(getBefore.result))

  // Delete group
  const delR = await api.v1.assembly.deleteConstraint({ ids: [groupId] })
  console.log('[08] delete group - result:', delR.result, 'maxLevel:', delR.maxLevel)
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-group')

  // Verify group is gone
  const getAfter = await api.v1.assembly.getGroup({ id: asmId, name: 'TestGroup' })
  console.log('[08] group after delete:', getAfter.result, 'maxLevel:', getAfter.maxLevel)

  // Verify instances still exist
  const allInst = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[08] instances after group delete:', JSON.stringify(allInst))

  return { asmId }
}
