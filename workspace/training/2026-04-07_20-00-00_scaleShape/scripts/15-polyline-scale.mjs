// Test scaleShape with advancedPolyline (with fillets) — do fillet radii scale?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PolyScale' })).result
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

  await snapshot('before-poly-scale')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 3.0 })
  console.log('[15] polyline scale result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'poly-scale-graphic')

  await snapshot('after-poly-scale')

  return { partId }
}
