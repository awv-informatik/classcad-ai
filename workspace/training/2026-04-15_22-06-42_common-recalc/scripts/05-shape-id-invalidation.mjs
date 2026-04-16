// Verify that recalc invalidates shape IDs (known from curve transform sessions)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ShapeInval' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  console.log('[05] shapeId:', shapeId)

  // Add a line to the shape
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[05] line added')

  // Translate BEFORE recalc — should work
  const t1 = await api.v1.curve.translateShape({ id: shapeId, translation: [10, 0, 0] })
  console.log('[05] translate before recalc: maxLevel=', t1.maxLevel, 'ok=', t1.maxLevel <= 31)

  // Now call recalc
  const r = await api.v1.common.recalc()
  console.log('[05] recalc: maxLevel=', r.maxLevel)

  // Try translate AFTER recalc — should fail with 1006
  const t2 = await api.v1.curve.translateShape({ id: shapeId, translation: [10, 0, 0] })
  console.log('[05] translate after recalc: maxLevel=', t2.maxLevel)
  console.log('[05] translate after recalc messages:', JSON.stringify(t2.messages))

  filewrite({
    translateBefore: { maxLevel: t1.maxLevel, ok: t1.maxLevel <= 31 },
    recalc: { maxLevel: r.maxLevel },
    translateAfter: { maxLevel: t2.maxLevel, messages: t2.messages }
  }, 'shape-invalidation')

  return { translateBefore: t1.maxLevel, translateAfter: t2.maxLevel }
}
