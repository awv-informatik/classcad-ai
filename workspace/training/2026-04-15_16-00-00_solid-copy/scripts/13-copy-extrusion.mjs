// Copy a solid created by extrusion from a curve profile
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyExtrusion' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create an L-shaped profile via advancedPolyline
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

  // Extrude it
  const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 25], curves: shapeId })).result
  console.log('[13] extrusion id:', extId)

  // Copy the extrusion result
  const copyR = await api.v1.solid.copy({ id: eifId, target: extId, translation: [60, 0, 0] })
  console.log('[13] copy id:', copyR.result, 'maxLevel:', copyR.maxLevel)

  // Compare vertex counts
  const extGraphic = (await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 }))  // dummy to get graphic
  // Actually, let me just use the graphic from the copy response
  filewrite(copyR.graphic, 'extrusion-copy-graphic')

  await snapshot('extrusion-and-copy')

  return { partId, eifId, extId, copyId: copyR.result }
}
