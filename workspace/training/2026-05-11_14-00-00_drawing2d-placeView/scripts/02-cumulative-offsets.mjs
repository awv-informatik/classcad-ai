export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CumulativeTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Get initial bbox
  const bbox0 = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[02] bbox initial TOP:', JSON.stringify(bbox0))

  // First placement: move TOP by [50, 0, 0]
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'TOP', offset: [50, 0, 0] }],
  })
  const bbox1 = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[02] bbox after 1st place [50,0,0]:', JSON.stringify(bbox1))

  // Second placement: move TOP by [50, 0, 0] again — should cumulate to +100
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'TOP', offset: [50, 0, 0] }],
  })
  const bbox2 = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[02] bbox after 2nd place [50,0,0]:', JSON.stringify(bbox2))

  // Third placement: move TOP by [0, 30, 0]
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'TOP', offset: [0, 30, 0] }],
  })
  const bbox3 = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[02] bbox after 3rd place [0,30,0]:', JSON.stringify(bbox3))

  filewrite({ bbox0, bbox1, bbox2, bbox3 }, 'cumulative-data')

  return { partId }
}
