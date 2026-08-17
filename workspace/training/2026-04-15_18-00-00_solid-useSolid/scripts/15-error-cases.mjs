// 15 — Error cases: invalid IDs, non-feature IDs, part ID in from, etc.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorCases' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI' })).result
  const box = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Test 1: from = [partId] — what happens with a part ID in from?
  const r1 = await api.v1.solid.useSolid({ from: [partId], in: eifId })
  console.log('[15] from=[partId]:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[15] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'from-partId')

  // Test 2: from = [solidId] — solid ID instead of feature ID
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI2' })).result
  const r2 = await api.v1.solid.useSolid({ from: [box], in: eif2 })
  console.log('[15] from=[solidId]:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[15] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'from-solidId')

  // Test 3: nonexistent ID in from
  const eif3 = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI3' })).result
  const r3 = await api.v1.solid.useSolid({ from: [99999], in: eif3 })
  console.log('[15] from=[99999]:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[15] messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'from-nonexistent')

  // Test 4: invalid `in` — part ID instead of EI
  const r4 = await api.v1.solid.useSolid({ from: [eifId], in: partId })
  console.log('[15] in=partId:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[15] messages:', JSON.stringify(r4.messages))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'in-partId')

  // Test 5: empty from array
  const eif5 = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI5' })).result
  const r5 = await api.v1.solid.useSolid({ from: [], in: eif5 })
  console.log('[15] from=[]:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[15] messages:', JSON.stringify(r5.messages))
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'from-empty')

  return {}
}
