// Basic extrusion from a closed curve shape profile
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtrusionTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a closed rectangular profile using curve.shape + advancedPolyline
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  console.log('[01] shapeId:', shapeId)

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 80, ya: 0 },
      { xa: 80, ya: 50 },
      { xa: 0, ya: 50 },
    ],
    close: true,
  })

  // Extrude along Z by 40 units
  const r = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 40],
    curves: shapeId,
  })

  console.log('[01] extrusion result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'extrusion-response')

  await snapshot('basic-extrusion')
  return { partId, eifId, shapeId, extId: r.result }
}
