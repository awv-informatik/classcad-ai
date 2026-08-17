// Test scaleShape on advancedPolyline with fillets WITHOUT pre-snapshot
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PolyNoSnap' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Poly' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0, r: 5 },
      { xa: 40, ya: 25, r: 5 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  // Scale 3x — NO pre-snapshot
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 3.0 })
  console.log('[25] polyline scale 3x result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('poly-after-3x')

  const rr = await api.v1.common.recalc({})
  filewrite(rr.graphic, 'poly-3x-full-graphic')

  return { partId }
}
