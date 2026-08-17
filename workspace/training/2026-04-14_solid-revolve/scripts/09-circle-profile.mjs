// Revolve with a circular profile — creates a torus with round cross-section
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleProfile' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Circular profile offset from Y axis
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CircProf' })).result
  await api.v1.curve.circle({
    id: shapeId,
    center: [45, 0, 0],
    radius: 8,
  })

  const r = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: shapeId,
  })

  console.log('[09] circle profile revolve:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circle-profile-result')

  await snapshot('circle-torus')
  return { partId }
}
