// 07 — Full rotation (2*PI) and multiples — should return to original position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FullRotTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 20, ya: 0 },
      { xa: 20, ya: 10 },
      { xa: 5, ya: 10 },
      { xa: 5, ya: 25 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  // Full 2*PI rotation — should come back to original
  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, 2 * Math.PI] })
  console.log('[07] full rotation result:', r.result, 'maxLevel:', r.maxLevel)

  // Large angle (10*PI)
  const r2 = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, 10 * Math.PI] })
  console.log('[07] large rotation result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('after-full-rotation')

  return { partId }
}
