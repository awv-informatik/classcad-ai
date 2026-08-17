// 10 - Error: 2D points (only [x, y] instead of [x, y, z])
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: '2DPoint' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // 2D startPos
  const r = await api.v1.curve.arcBy3Points({
    id: shapeId, startPos: [0, 0], midPos: [25, 25, 0], endPos: [50, 0, 0],
  })
  console.log('[10] 2D startPos maxLevel:', r.maxLevel)
  console.log('[10] 2D startPos msgs:', JSON.stringify(r.messages))

  filewrite({ maxLevel: r.maxLevel, messages: r.messages }, '2d-point-response')

  return { partId }
}
