export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PlaceViewDemo' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  const viewIds = (await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })).result
  console.log('[01] viewIds:', viewIds)

  // Get bbox before placement
  const bboxBefore = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })).result
  console.log('[01] bbox before:', JSON.stringify(bboxBefore))

  // Place views with offsets
  const r = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'TOP', offset: [0, 100, 0] },
      { type: 'FRONT', offset: [0, 0, 0] },
      { type: 'RIGHT', offset: [150, 0, 0] },
    ],
  })
  console.log('[01] placeView result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  // Get bbox after placement
  const bboxAfter = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })).result
  console.log('[01] bbox after:', JSON.stringify(bboxAfter))

  filewrite({ bboxBefore, bboxAfter, result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'placement-data')

  return { partId }
}
