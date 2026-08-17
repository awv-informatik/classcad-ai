// Test: Can you update only startPos of a line (omitting endPos)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 50, 0] }],
    genFixation: false,
    genVertAndHoriz: false,
  })
  const lineId = geo.result.lines[0]
  console.log('[11] created line:', lineId)

  const posBefore = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[11] pos before:', JSON.stringify(posBefore.result))

  // Update only startPos
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: lineId, startPos: [20, 10, 0] }],
  })
  console.log('[11] startPos-only result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[11] startPos-only messages:', JSON.stringify(r1.messages))

  const posAfterStart = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[11] pos after startPos-only:', JSON.stringify(posAfterStart.result))

  // Update only endPos
  const r2 = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: lineId, endPos: [80, 30, 0] }],
  })
  console.log('[11] endPos-only result:', r2.result, 'maxLevel:', r2.maxLevel)

  const posAfterEnd = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[11] pos after endPos-only:', JSON.stringify(posAfterEnd.result))

  filewrite({
    before: posBefore.result,
    afterStartOnly: posAfterStart.result,
    afterEndOnly: posAfterEnd.result,
  }, 'partial-line')

  await snapshot('final')

  return { partId }
}
