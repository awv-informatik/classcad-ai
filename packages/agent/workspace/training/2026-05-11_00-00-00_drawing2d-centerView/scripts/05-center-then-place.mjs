export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterThenPlaceTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })

  // Center first
  await api.v1.drawing2d.centerView({ id: partId })

  const bboxCentered = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT'],
  })
  filewrite(bboxCentered.result, 'bbox-centered')

  // Then place with offsets to arrange a drawing layout
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'TOP', offset: [0, 100, 0] },
      { type: 'FRONT', offset: [0, 0, 0] },
      { type: 'RIGHT', offset: [120, 0, 0] },
    ],
  })

  const bboxPlaced = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT'],
  })
  filewrite(bboxPlaced.result, 'bbox-placed')

  // Now re-center — does it undo the placeView offsets?
  await api.v1.drawing2d.centerView({ id: partId })

  const bboxRecentered = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT'],
  })
  filewrite(bboxRecentered.result, 'bbox-recentered')

  // Compare
  const labels = ['TOP', 'FRONT', 'RIGHT']
  for (let i = 0; i < 3; i++) {
    const c = bboxCentered.result[i]
    const p = bboxPlaced.result[i]
    const rc = bboxRecentered.result[i]
    console.log(
      `[05] ${labels[i]}: centered=(${((c.min.x + c.max.x) / 2).toFixed(1)},${((c.min.y + c.max.y) / 2).toFixed(1)}) placed=(${((p.min.x + p.max.x) / 2).toFixed(1)},${((p.min.y + p.max.y) / 2).toFixed(1)}) recentered=(${((rc.min.x + rc.max.x) / 2).toFixed(1)},${((rc.min.y + rc.max.y) / 2).toFixed(1)})`,
    )
  }

  return { partId }
}
