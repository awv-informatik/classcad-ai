// Test extrusion with a filleted profile (polyline with radii at corners)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletProfileTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rounded' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0, r: 5 },
      { xa: 60, ya: 0, r: 5 },
      { xa: 60, ya: 40, r: 5 },
      { xa: 0, ya: 40, r: 5 },
    ],
    close: true,
  })

  const r = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 25], curves: shapeId })
  console.log('[11] filleted profile result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'filleted-profile')

  await snapshot('filleted-profile')
  return { partId }
}
