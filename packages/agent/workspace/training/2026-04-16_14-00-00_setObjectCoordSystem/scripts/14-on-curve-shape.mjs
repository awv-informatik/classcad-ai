// Test setObjectCoordSystem on a curve shape
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysCurve' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 50, ya: 0 },
      { xa: 50, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: true,
  })
  console.log('[14] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  await snapshot('before')

  // Set coord system on the shape — rotate 90 degrees
  const r = await api.v1.common.setObjectCoordSystem({
    id: shapeId,
    origin: [0, 0, 0],
    xVec: [0, 1, 0],
    yVec: [-1, 0, 0],
  })
  console.log('[14] on curve shape result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[14] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('after')

  return { partId, eifId, shapeId }
}
