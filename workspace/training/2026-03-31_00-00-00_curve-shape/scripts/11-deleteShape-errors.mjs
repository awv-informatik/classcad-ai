// 11 — deleteShape error cases: wrong ID, empty array, already deleted
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'ToDelete' })).result

  // Delete it
  const r1 = await api.v1.curve.deleteShape({ ids: [shapeId] })
  console.log('[11] first delete — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Delete again (already deleted)
  const r2 = await api.v1.curve.deleteShape({ ids: [shapeId] })
  console.log('[11] double delete — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[11] double delete msgs:', JSON.stringify(r2.messages))

  // Delete with empty array
  const r3 = await api.v1.curve.deleteShape({ ids: [] })
  console.log('[11] empty array — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[11] empty array msgs:', JSON.stringify(r3.messages))

  // Delete with part ID
  const r4 = await api.v1.curve.deleteShape({ ids: [partId] })
  console.log('[11] partId — result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[11] partId msgs:', JSON.stringify(r4.messages))

  // Delete with EI ID
  const r5 = await api.v1.curve.deleteShape({ ids: [eifId] })
  console.log('[11] eifId — result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[11] eifId msgs:', JSON.stringify(r5.messages))

  filewrite({
    firstDelete: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    doubleDelete: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    emptyArray: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    partIdDelete: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    eifIdDelete: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }
  }, 'deleteShape-errors')

  return {}
}
