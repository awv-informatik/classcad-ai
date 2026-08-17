// Correct updateGeometry usage: pass sketch ID with geometry arrays, then verify with getPositions
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [5, 5, 0] })).result

  // Before
  const lineBefore = (await api.v1.sketch.getPositions({ id: lineId })).result
  const ptBefore = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[16] line before:', JSON.stringify(lineBefore))
  console.log('[16] point before:', JSON.stringify(ptBefore))

  // Update both in one call
  const ur = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: lineId, startPos: [0, 0, 0], endPos: [100, 80, 0] }],
    points: [{ id: ptId, pos: [50, 50, 0] }],
  })
  console.log('[16] updateGeometry maxLevel:', ur.maxLevel)

  // After
  const lineAfter = (await api.v1.sketch.getPositions({ id: lineId })).result
  const ptAfter = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[16] line after:', JSON.stringify(lineAfter))
  console.log('[16] point after:', JSON.stringify(ptAfter))

  const lineChanged = JSON.stringify(lineBefore) !== JSON.stringify(lineAfter)
  const ptChanged = JSON.stringify(ptBefore) !== JSON.stringify(ptAfter)
  console.log('[16] line changed:', lineChanged, '| point changed:', ptChanged)

  filewrite({
    line: { before: lineBefore, after: lineAfter, changed: lineChanged },
    point: { before: ptBefore, after: ptAfter, changed: ptChanged },
  }, 'correct-update')

  return { partId }
}
