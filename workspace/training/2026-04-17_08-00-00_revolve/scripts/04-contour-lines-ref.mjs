export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ContourRef' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result

  // Pass raw line IDs instead of sketch region
  const r = await api.v1.part.revolve({
    id: partId,
    name: 'FromLines',
    references: rectIds,
    axisIds: [yAxisId]
  })
  console.log('[04] contour lines revolve:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'contour-lines-response')
  await snapshot('contour-lines')

  return { partId }
}
