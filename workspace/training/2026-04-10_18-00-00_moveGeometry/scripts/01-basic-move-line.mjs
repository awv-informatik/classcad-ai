// 01 — Basic move of a single line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 10, 0] })).result
  console.log('[01] lineId:', lineId)

  // Get positions before
  const before = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[01] before:', JSON.stringify(before))

  await snapshot('before')

  // Move the line by [20, 30, 0]
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId], translation: [20, 30, 0] })
  console.log('[01] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  // Get positions after
  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[01] after:', JSON.stringify(after))

  filewrite({ before, after, moveResult: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'move-line-result')

  await snapshot('after')

  return { partId, lineId }
}
