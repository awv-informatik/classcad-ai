// Test VERTICAL constraint on a line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Slightly off-vertical line
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [10, 5, 0],
    endPos: [13, 55, 0],
    genVertAndHoriz: false,
    genFixation: false,
  })).result
  console.log('[02] lineId:', lineId)

  const r = await api.v1.sketch.constraint({
    id: skId,
    type: 'VERTICAL',
    geomIds: [lineId],
  })
  console.log('[02] constraint result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'vertical-response')
  await snapshot('vertical')
  return { partId }
}
