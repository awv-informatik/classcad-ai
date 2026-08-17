// Test: updateGeometry with multiple geometry types in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create mixed geometry
  const geo = await api.v1.sketch.geometry({
    id: skId,
    points: [{ pos: [0, 0, 0] }],
    lines: [{ startPos: [10, 10, 0], endPos: [50, 10, 0] }],
    circles: [{ centerPos: [30, 30, 0], radius: 10 }],
    genFixation: false,
    genIncidence: false,
  })
  const ptId = geo.result.points[0]
  const lineId = geo.result.lines[0]
  const circId = geo.result.circles[0]
  console.log('[06] created — point:', ptId, 'line:', lineId, 'circle:', circId)

  await snapshot('before')

  // Update all three in one call
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    points: [{ id: ptId, pos: [5, 5, 0] }],
    lines: [{ id: lineId, startPos: [20, 20, 0], endPos: [60, 20, 0] }],
    circles: [{ id: circId, centerPos: [40, 40, 0], radius: 20 }],
  })
  console.log('[06] batch update result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-mixed-response')

  await snapshot('after')

  return { partId }
}
