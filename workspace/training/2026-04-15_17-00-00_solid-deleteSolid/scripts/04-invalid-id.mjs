// Test error handling: invalid solid ID, nonexistent ID, wrong type ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidId' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[04] eifId:', eifId, 'boxId:', boxId)

  // Test 1: nonexistent ID (99999)
  const r1 = await api.v1.solid.deleteSolid({ id: eifId, ids: [99999] })
  console.log('[04] nonexistent id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'nonexistent-id')

  // Test 2: pass the EIF id instead of a solid id
  const r2 = await api.v1.solid.deleteSolid({ id: eifId, ids: [eifId] })
  console.log('[04] eif as solid id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'eif-as-solid-id')

  // Test 3: pass the part id instead of a solid id
  const r3 = await api.v1.solid.deleteSolid({ id: eifId, ids: [partId] })
  console.log('[04] part as solid id — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'part-as-solid-id')

  // Verify the original box is still there after all the invalid calls
  await snapshot('after-invalid-calls')

  return { partId, eifId, boxId }
}
