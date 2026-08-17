// Test extrusion with a circle profile (curve.circle)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleExtTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CircleProfile' })).result
  await api.v1.curve.circle({
    id: shapeId,
    centerPos: [0, 0, 0],
    radius: 25,
  })

  const r = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 60], curves: shapeId })
  console.log('[07] circle extrusion result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circle-extrusion')

  await snapshot('circle-extrusion')
  return { partId }
}
