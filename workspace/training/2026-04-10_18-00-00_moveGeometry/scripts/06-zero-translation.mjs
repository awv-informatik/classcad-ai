// 06 — Zero translation vector
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 30, 0] })).result

  const before = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[06] before:', JSON.stringify(before))

  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId], translation: [0, 0, 0] })
  console.log('[06] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[06] after:', JSON.stringify(after))

  filewrite({ before, after, moveResult: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'zero-translation-result')

  return { partId }
}
