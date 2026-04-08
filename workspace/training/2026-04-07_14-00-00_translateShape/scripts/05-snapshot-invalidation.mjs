// Test: does snapshot invalidate shape IDs for all curve operations, or just translateShape?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })

  console.log('[05] shapeId before snapshot:', shapeId)

  // Take snapshot
  await snapshot('before')

  // Try adding another line after snapshot
  const r1 = await api.v1.curve.line({ id: shapeId, startPos: [0, 5, 0], endPos: [20, 5, 0] })
  console.log('[05] line after snapshot:', r1.maxLevel, JSON.stringify(r1.messages))

  // Try translate after snapshot
  const r2 = await api.v1.curve.translateShape({ id: shapeId, translation: [10, 0, 0] })
  console.log('[05] translate after snapshot:', r2.maxLevel, JSON.stringify(r2.messages))

  // Create a NEW shape after snapshot
  const shapeId2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result
  console.log('[05] new shapeId2:', shapeId2)
  await api.v1.curve.line({ id: shapeId2, startPos: [0, 0, 0], endPos: [10, 10, 0] })

  // Translate the new shape (created after snapshot)
  const r3 = await api.v1.curve.translateShape({ id: shapeId2, translation: [10, 0, 0] })
  console.log('[05] translate new shape:', r3.maxLevel, JSON.stringify(r3.messages))

  filewrite({
    lineAfterSnapshot: { maxLevel: r1.maxLevel, messages: r1.messages },
    translateAfterSnapshot: { maxLevel: r2.maxLevel, messages: r2.messages },
    translateNewShape: { maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'snapshot-invalidation')

  return { partId }
}
