// 14 - Error: arc on deleted shape ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeletedShape' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Delete the shape
  await api.v1.curve.deleteShape({ ids: [shapeId] })

  // Try to create arc on deleted shape
  const r = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [25, 25, 0],
    endPos: [50, 0, 0],
  })
  console.log('[14] deleted shape maxLevel:', r.maxLevel)
  console.log('[14] deleted shape msgs:', JSON.stringify(r.messages))

  filewrite({ maxLevel: r.maxLevel, messages: r.messages }, 'deleted-shape-response')

  return { partId }
}
