// 08 — Combined rotation: multiple axes in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CombinedTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 10 },
      { xa: 5, ya: 10 },
      { xa: 5, ya: 20 },
      { xa: 0, ya: 20 },
    ],
    close: true,
  })

  // Rotate around X and Z simultaneously
  const r = await api.v1.curve.rotateShape({
    id: shapeId,
    rotation: [Math.PI / 6, 0, Math.PI / 4],  // 30° X, 45° Z
  })
  console.log('[08] combined rotation result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('combined-xz')

  return { partId }
}
