// Test slicing an extrusion-based solid (not just primitives)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceExtr' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create L-shaped profile
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'LProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 60, ya: 0 },
      { xa: 60, ya: 20 },
      { xa: 20, ya: 20 },
      { xa: 20, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  // Extrude
  const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 50], curves: shapeId })).result
  console.log('[20] extId:', extId)

  const extR = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 1], curves: shapeId })
  // Hmm, shape was consumed by first extrusion. Let me use the existing solid.

  await snapshot('before')

  // Slice the L-extrusion diagonally
  const r = await api.v1.solid.slice({
    id: eifId,
    target: extId,
    originPos: [30, 20, 25],
    normal: [1, 0, 1],
    keepBoth: false,
  })
  console.log('[20] slice result:', r.result, 'maxLevel:', r.maxLevel)

  const c = r.graphic?.containers?.find(c => c.owner === extId)
  if (c) console.log('[20] AFTER bbox:', JSON.stringify(c.properties.min), JSON.stringify(c.properties.max))

  await snapshot('after-diagonal-slice')

  return { partId }
}
