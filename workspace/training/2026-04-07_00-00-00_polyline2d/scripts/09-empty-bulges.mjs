// Edge case: empty bulges array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyBulges' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'EmptyB' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 20, 0],
    ],
    bulges: [],
  })

  console.log('[09] empty bulges result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-bulges-response')

  return { partId }
}
