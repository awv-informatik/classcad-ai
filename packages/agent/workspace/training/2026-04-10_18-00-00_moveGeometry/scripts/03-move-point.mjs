// 03 — Move a standalone point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const ptId = (await api.v1.sketch.point({ id: skId, pos: [20, 20, 0] })).result
  console.log('[03] ptId:', ptId)

  const before = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[03] before:', JSON.stringify(before))

  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [ptId], translation: [15, 25, 0] })
  console.log('[03] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  const after = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[03] after:', JSON.stringify(after))

  filewrite({ before, after, moveResult: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'move-point-result')

  return { partId }
}
