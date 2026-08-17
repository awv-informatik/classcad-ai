// 11 — Move with negative translation values
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [50, 50, 0], endPos: [80, 70, 0] })).result

  const before = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[11] before:', JSON.stringify(before))

  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId], translation: [-30, -20, 0] })
  console.log('[11] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)

  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[11] after:', JSON.stringify(after))

  // Verify: expected start = [20,30,0], end = [50,50,0]
  console.log('[11] expected start: [20,30,0] actual:', after.startPos.x, after.startPos.y)
  console.log('[11] expected end: [50,50,0] actual:', after.endPos.x, after.endPos.y)

  filewrite({ before, after, moveResult: r.result, maxLevel: r.maxLevel }, 'negative-translation')

  return { partId }
}
