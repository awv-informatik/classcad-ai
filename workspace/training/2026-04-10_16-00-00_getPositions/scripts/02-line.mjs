// getPositions on a line — expects { startPos, endPos }
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result
  console.log('[02] lineId:', lineId)

  const r = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[02] getPositions result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'line-response')

  await snapshot('line')
  return { partId }
}
