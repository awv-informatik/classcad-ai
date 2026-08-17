// 08 — Do indices consume the source? Try indices [0] twice on the same source.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndicesTwice' })).result

  // Create source EI with multiple solids
  const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'Source' })).result
  const box1 = (await api.v1.solid.box({ id: srcEif, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: srcEif, length: 30, width: 30, height: 50, translation: [80, 0, 0] })).result
  console.log('[08] source solids:', box1, box2)

  // First call: indices [0]
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'Dest1' })).result
  const r1 = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [0] }], in: eif1 })
  console.log('[08] first indices [0]: result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'first-indices-0')

  // Second call: indices [0] again — same source
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'Dest2' })).result
  const r2 = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [0] }], in: eif2 })
  console.log('[08] second indices [0]: result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'second-indices-0')

  // Third call: indices [1] — different index on same source
  const eif3 = (await api.v1.part.entityInjection({ id: partId, name: 'Dest3' })).result
  const r3 = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [1] }], in: eif3 })
  console.log('[08] indices [1]: result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[08] messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'indices-1')

  await snapshot('indices-twice')
  return { r1: r1.result, r2: r2.result, r3: r3.result }
}
