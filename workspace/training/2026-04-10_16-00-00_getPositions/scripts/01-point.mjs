// getPositions on a standalone sketch point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const ptId = (await api.v1.sketch.point({ id: skId, pos: [25, 40, 0] })).result
  console.log('[01] pointId:', ptId)

  const r = await api.v1.sketch.getPositions({ id: ptId })
  console.log('[01] getPositions result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'point-response')

  await snapshot('point')
  return { partId }
}
