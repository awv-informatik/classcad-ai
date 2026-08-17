// 12 — Invalid edge ID: pass a solid ID, part ID, or made-up ID to geomIds
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidEdge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Test 1: pass the solid ID (not an edge ID)
  const r1 = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [boxId] })
  console.log('[12] solid ID as edge: result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log(`[12] msg1: level=${m.level} "${m.message}"`)
  }
  filewrite({ test: 'solidId', result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'invalid-solid-id')

  // Recreate for test 2
  const partId2 = (await api.v1.part.create({ name: 'InvalidEdge2' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 80, width: 60, height: 40 })).result

  // Test 2: pass a made-up ID (999999)
  const r2 = await api.v1.solid.fillet({ id: eifId2, radius: 5, geomIds: [999999] })
  console.log('[12] fake ID: result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log(`[12] msg2: level=${m.level} "${m.message}"`)
  }
  filewrite({ test: 'fakeId', result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'invalid-fake-id')

  // Test 3: pass the part ID
  const partId3 = (await api.v1.part.create({ name: 'InvalidEdge3' })).result
  const eifId3 = (await api.v1.part.entityInjection({ id: partId3, name: 'EIF3' })).result
  const boxId3 = (await api.v1.solid.box({ id: eifId3, length: 80, width: 60, height: 40 })).result

  const r3 = await api.v1.solid.fillet({ id: eifId3, radius: 5, geomIds: [partId3] })
  console.log('[12] part ID as edge: result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) {
    for (const m of r3.messages) console.log(`[12] msg3: level=${m.level} "${m.message}"`)
  }
  filewrite({ test: 'partId', result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'invalid-part-id')

  return { partId }
}
