export default async function (api, { snapshot, filewrite }) {
  // Test: invalid parameters for all three APIs
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Block1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Test A: bad assembly ID
  console.log('[12] --- Test A: bad assembly ID ---')
  const r1 = await api.v1.assembly.startMovingUnderConstraints({
    id: 99999,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[12] bad id:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'bad-asm-id')

  // Test B: empty instanceIds
  console.log('[12] --- Test B: empty instanceIds ---')
  const r2 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[12] empty instanceIds:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'empty-instanceIds')

  // Test C: invalid mucType
  console.log('[12] --- Test C: invalid mucType ---')
  const r3 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'INVALID',
  })
  console.log('[12] invalid mucType:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'invalid-mucType')

  // Test D: bad instance ID in instanceIds
  console.log('[12] --- Test D: bad instance ID ---')
  const r4 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [99999],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[12] bad instance id:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'bad-instance-id')

  // Test E: missing required params
  console.log('[12] --- Test E: missing instanceIds ---')
  const r5 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[12] missing instanceIds:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'missing-instanceIds')

  // Test F: missing pivotInfo
  console.log('[12] --- Test F: missing pivotInfo ---')
  const r6 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    mucType: 'ROTATION',
  })
  console.log('[12] missing pivotInfo:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'missing-pivotInfo')

  // Test G: missing mucType
  console.log('[12] --- Test G: missing mucType ---')
  const r7 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
  })
  console.log('[12] missing mucType:', r7.result, 'maxLevel:', r7.maxLevel)
  filewrite({ result: r7.result, messages: r7.messages, maxLevel: r7.maxLevel }, 'missing-mucType')

  return { asmId }
}
