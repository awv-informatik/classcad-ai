export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 20 })

  const tplB = (await api.v1.assembly.partTemplate({ name: 'CylB' })).result
  await api.v1.part.cylinder({ id: tplB, name: 'Cyl', height: 30, diameter: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Inst2', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'MyGroup', instanceIds: [inst1, inst2] })).result
  console.log('[02] groupId:', groupId)

  // getGroup by name on assembly root
  const r1 = await api.v1.assembly.getGroup({ id: asmId, name: 'MyGroup' })
  console.log('[02] getGroup result:', JSON.stringify(r1.result))
  console.log('[02] getGroup maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'getGroup-success')

  // getGroup with wrong name
  const r2 = await api.v1.assembly.getGroup({ id: asmId, name: 'NonExistent' })
  console.log('[02] getGroup bad name result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'getGroup-bad-name')

  // getGroup with empty name
  const r3 = await api.v1.assembly.getGroup({ id: asmId, name: '' })
  console.log('[02] getGroup empty name result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'getGroup-empty-name')

  // getGroup with instance ID instead of assembly ID
  const r4 = await api.v1.assembly.getGroup({ id: inst1, name: 'MyGroup' })
  console.log('[02] getGroup on instance result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'getGroup-instance-id')

  // getGroup with template ID
  const r5 = await api.v1.assembly.getGroup({ id: tplA, name: 'MyGroup' })
  console.log('[02] getGroup on template result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'getGroup-template-id')

  return { groupId }
}
