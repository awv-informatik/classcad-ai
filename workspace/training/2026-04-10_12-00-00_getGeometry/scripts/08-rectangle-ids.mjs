// Test getGeometry with rectangle — does it return the 4 line IDs from rectangle()?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result
  console.log('[08] rectangle returned IDs:', JSON.stringify(rectIds))

  const r = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[08] getGeometry result:', JSON.stringify(r.result))

  // Rectangle creates 4 lines. Are they returned as lines in getGeometry?
  // Also check if rectangle auto-creates any points
  filewrite({
    rectIds,
    queried: r.result,
    rectIdsAreLines: rectIds.every(id => r.result.lines?.includes(id)),
    pointCount: r.result.points?.length,
    lineCount: r.result.lines?.length,
  }, 'rectangle-ids')

  await snapshot('rectangle')
  return { partId, skId }
}
