// Test the shape ID form of the `curves` parameter
// This is the common case: create a curve.shape, add curves to it, pass shape ID to extrusion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CurvesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a shape with a closed rectangle
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 60, ya: 0 },
      { xa: 60, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  // Pass shape ID directly as curves (single value, not array)
  const extResult = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: shapeId,
  })

  console.log('[01] shapeId:', shapeId)
  console.log('[01] extrusion result:', extResult.result, 'maxLevel:', extResult.maxLevel)
  console.log('[01] typeof curves value:', typeof shapeId)

  filewrite({
    shapeId,
    extResult: { result: extResult.result, maxLevel: extResult.maxLevel, messages: extResult.messages },
  }, 'shape-id-form')

  await snapshot('shape-id-extrusion')
  return { partId, eifId, shapeId, extId: extResult.result }
}
