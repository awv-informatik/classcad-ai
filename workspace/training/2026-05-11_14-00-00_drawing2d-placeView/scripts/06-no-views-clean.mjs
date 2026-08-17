export default async function (api, { snapshot, filewrite }) {
  // Clean test: single part, box, NO views, then placeView
  const partId = (await api.v1.part.create({ name: 'NoViewsClean' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  console.log('[06] partId:', partId)

  const r = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'TOP', offset: [100, 0, 0] }],
  })
  console.log('[06] no views result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ partId, result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'no-views-clean-data')

  return { partId }
}
