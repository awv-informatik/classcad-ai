// Realistic workflow: create complex shape, translate it, verify visually
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Realistic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a reference shape at origin
  const sRef = (await api.v1.curve.shape({ id: eifId, name: 'Original' })).result
  await api.v1.curve.advancedPolyline({
    id: sRef,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0, r: 3 },
      { xa: 30, ya: 20, r: 3 },
      { xa: 0, ya: 20 },
    ],
    close: true,
  })
  await api.v1.curve.circle({ id: sRef, centerPos: [15, 10, 0], radius: 5 })

  // Clone: create same shape, then translate
  const sMoved = (await api.v1.curve.shape({ id: eifId, name: 'Translated' })).result
  await api.v1.curve.advancedPolyline({
    id: sMoved,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0, r: 3 },
      { xa: 30, ya: 20, r: 3 },
      { xa: 0, ya: 20 },
    ],
    close: true,
  })
  await api.v1.curve.circle({ id: sMoved, centerPos: [15, 10, 0], radius: 5 })

  // Translate the copy
  const r = await api.v1.curve.translateShape({ id: sMoved, translation: [50, 30, 0] })
  console.log('[18] translate realistic:', r.maxLevel)
  console.log('[18] result:', r.result)

  // Verify: result is VOID/null, maxLevel is 31
  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    resultType: typeof r.result,
    resultIsNull: r.result === null,
  }, 'realistic-response')

  await snapshot('original-vs-translated')
  return { partId }
}
