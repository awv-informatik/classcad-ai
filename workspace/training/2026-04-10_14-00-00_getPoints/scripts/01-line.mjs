// getPoints on a line — expects { startId, endId }
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[01] lineId:', lineId)

  const r = await api.v1.sketch.getPoints({ id: lineId })
  console.log('[01] getPoints result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'line-getPoints')

  await snapshot('line')
  return { partId }
}
