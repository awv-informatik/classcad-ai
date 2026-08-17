export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // 1. Invalid ID (999999)
  const r1 = await api.v1.part.deleteFeature({ ids: [999999] })
  console.log('[07] invalid id — result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // 2. Wrong ID type (partId instead of feature)
  const r2 = await api.v1.part.deleteFeature({ ids: [partId] })
  console.log('[07] part id — result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // 3. Empty array
  const r3 = await api.v1.part.deleteFeature({ ids: [] })
  console.log('[07] empty array — result:', r3.result, 'maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // 4. Missing ids param entirely
  try {
    const r4 = await api.v1.part.deleteFeature({})
    console.log('[07] no ids param — result:', r4.result, 'maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))
  } catch (e) {
    console.log('[07] no ids param — exception:', e.message)
  }

  // 5. ID = 0
  const r5 = await api.v1.part.deleteFeature({ ids: [0] })
  console.log('[07] id=0 — result:', r5.result, 'maxLevel:', r5.maxLevel, 'messages:', JSON.stringify(r5.messages))

  // 6. Delete already-deleted feature
  await api.v1.part.deleteFeature({ ids: [boxId] })
  const r6 = await api.v1.part.deleteFeature({ ids: [boxId] })
  console.log('[07] double delete — result:', r6.result, 'maxLevel:', r6.maxLevel, 'messages:', JSON.stringify(r6.messages))

  filewrite({
    invalidId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    emptyArray: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    idZero: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
    doubleDelete: { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages },
  }, 'error-cases')

  return { partId }
}
