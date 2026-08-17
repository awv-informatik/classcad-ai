// Edge case: non-planar points (docs say "must lie in same plane")
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonPlanar' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'NonPlan' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 20, 10], // off-plane (z=10)
      [0, 20, 20], // further off-plane (z=20)
    ],
    close: true,
  })

  console.log('[12] non-planar result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'non-planar-response')

  await snapshot('non-planar')
  return { partId }
}
