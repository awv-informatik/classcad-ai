// getPoints on a standalone point — what happens? Docs say lines/arcs/circles only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const pointId = (await api.v1.sketch.point({ id: skId, pos: [40, 30, 0] })).result
  console.log('[04] pointId:', pointId)

  const r = await api.v1.sketch.getPoints({ id: pointId })
  console.log('[04] getPoints result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'point-getPoints')

  return { partId }
}
