export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GetGroupTest' })).result

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

  // Create named group
  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'MyGroup', instanceIds: [inst1, inst2],
  })).result
  console.log('[02] groupId:', groupId)

  // getGroup by name
  const r = await api.v1.assembly.getGroup({ id: asmId, name: 'MyGroup' })
  console.log('[02] getGroup result:', JSON.stringify(r.result))
  console.log('[02] getGroup maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'getGroup-found')

  // getGroup with wrong name
  const r2 = await api.v1.assembly.getGroup({ id: asmId, name: 'NoSuchGroup' })
  console.log('[02] getGroup not-found result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'getGroup-notfound')

  // getGroup case sensitivity
  const r3 = await api.v1.assembly.getGroup({ id: asmId, name: 'mygroup' })
  console.log('[02] getGroup case-wrong result:', r3.result, 'maxLevel:', r3.maxLevel)

  // getGroup with default name
  const group2Id = (await api.v1.assembly.group({
    id: asmId, instanceIds: [inst1],
  })).result
  console.log('[02] group2 (default name) id:', group2Id)
  const r4 = await api.v1.assembly.getGroup({ id: asmId, name: 'Group' })
  console.log('[02] getGroup default name result:', JSON.stringify(r4.result))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'getGroup-default')

  // getGroup with instance ID instead of assembly ID
  const r5 = await api.v1.assembly.getGroup({ id: inst1, name: 'MyGroup' })
  console.log('[02] getGroup with instance ID result:', r5.result, 'maxLevel:', r5.maxLevel)

  return { groupId, group2Id }
}
