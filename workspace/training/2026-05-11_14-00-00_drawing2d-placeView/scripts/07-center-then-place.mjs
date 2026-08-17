export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterThenPlace' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })

  // Bbox after view creation (before centering)
  const bboxRaw = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
  console.log('[07] bbox raw:', JSON.stringify(bboxRaw))

  // Center all views
  await api.v1.drawing2d.centerView({ id: partId })
  const bboxCentered = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
  console.log('[07] bbox centered:', JSON.stringify(bboxCentered))

  // Place views in a standard drawing layout
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'TOP', offset: [0, 80, 0] },
      { type: 'FRONT', offset: [0, 0, 0] },
      { type: 'RIGHT', offset: [120, 0, 0] },
      { type: 'ISO', offset: [250, 80, 0] },
    ],
  })
  const bboxPlaced = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
  console.log('[07] bbox placed:', JSON.stringify(bboxPlaced))

  // Now recenter — should undo placement
  await api.v1.drawing2d.centerView({ id: partId })
  const bboxRecentered = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
  console.log('[07] bbox recentered:', JSON.stringify(bboxRecentered))

  filewrite({ bboxRaw, bboxCentered, bboxPlaced, bboxRecentered }, 'center-place-workflow')

  return { partId }
}
