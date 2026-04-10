// Test getGeometry after creating geometry with individual APIs (not batch)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry one by one
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [5, 5, 0] })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [25, 25, 0], radius: 12 })).result
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId, startPos: [0, 50, 0], endPos: [50, 50, 0], centerPos: [25, 50, 0],
  })).result

  console.log('[03] individual IDs — pt:', ptId, 'line:', lineId, 'circ:', circId, 'arc:', arcId)

  const r = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[03] getGeometry result:', JSON.stringify(r.result))

  // Check if individually created IDs match
  filewrite({
    individualIds: { ptId, lineId, circId, arcId },
    queried: r.result,
    pointInList: r.result.points?.includes(ptId),
    lineInList: r.result.lines?.includes(lineId),
    circleInList: r.result.circles?.includes(circId),
    arcInList: r.result.arcs?.includes(arcId),
  }, 'individual-vs-query')

  await snapshot('individual')
  return { partId, skId }
}
