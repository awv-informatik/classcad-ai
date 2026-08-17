// 11 — Offset on an extruded profile (L-shape — more complex than a box)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtrusionOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create an L-shaped profile and extrude it
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'LProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 15 },
      { xa: 15, ya: 15 },
      { xa: 15, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })
  const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 20], curves: shapeId })).result
  console.log('[11] extId:', extId)

  // Reference
  const refId = (await api.v1.solid.box({ id: eifId, length: 6, width: 6, height: 6, translation: [60, 0, 0] })).result

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: extId, distance: 3 })
  console.log('[11] extrusion offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'extrusion-offset-response')

  await snapshot('after')

  return { extId, result: r.result }
}
