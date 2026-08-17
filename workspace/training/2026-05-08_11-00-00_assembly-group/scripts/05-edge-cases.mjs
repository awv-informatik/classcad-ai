// Edge cases: single instance, zero instances, duplicate instances, same instance in multiple groups
export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })

  const tplB = (await api.v1.assembly.partTemplate({ name: 'CylB' })).result
  await api.v1.part.cylinder({ id: tplB, name: 'Cyl', height: 25, diameter: 16 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Inst2', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Single instance group
  const r1 = await api.v1.assembly.group({ id: asmId, name: 'Single', instanceIds: [inst1] })
  console.log('[05] single instance group result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'single-instance')

  // Empty instanceIds array
  const r2 = await api.v1.assembly.group({ id: asmId, name: 'Empty', instanceIds: [] })
  console.log('[05] empty instanceIds result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'empty-instanceIds')

  // Duplicate instance in the same group
  const r3 = await api.v1.assembly.group({ id: asmId, name: 'Dupes', instanceIds: [inst1, inst1, inst2] })
  console.log('[05] duplicate instance result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'duplicate-instance')
  if (r3.result) {
    const g3 = await api.v1.assembly.getGroup({ id: asmId, name: 'Dupes' })
    console.log('[05] dupes group contents:', JSON.stringify(g3.result))
    filewrite(g3.result, 'duplicate-getGroup')
  }

  // Same instance in multiple groups
  const r4 = await api.v1.assembly.group({ id: asmId, name: 'Group2', instanceIds: [inst1, inst2] })
  console.log('[05] second group with same instances result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'overlapping-groups')

  // Invalid instance ID (non-existent)
  const r5 = await api.v1.assembly.group({ id: asmId, name: 'BadId', instanceIds: [99999] })
  console.log('[05] bad instance ID result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'bad-instance-id')

  // Missing instanceIds param
  const r6 = await api.v1.assembly.group({ id: asmId, name: 'NoIds' })
  console.log('[05] missing instanceIds result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'missing-instanceIds')

  return { inst1, inst2 }
}
