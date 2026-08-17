export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PlaceTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })
  await api.v1.drawing2d.centerView({ id: partId })

  // Bbox after centering (baseline)
  const centered = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT'] })).result
  console.log('[07] centered TOP:', JSON.stringify(centered[0]))
  console.log('[07] centered FRONT:', JSON.stringify(centered[1]))

  // Place TOP at offset [0, 100, 0]
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'TOP', offset: [0, 100, 0] }],
  })

  // Bbox after placement
  const placed = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT'] })).result
  console.log('[07] placed TOP:', JSON.stringify(placed[0]))
  console.log('[07] placed FRONT:', JSON.stringify(placed[1]))

  // Verify: TOP should be shifted by [0, 100, 0], FRONT unchanged
  const topShiftY = placed[0].min.y - centered[0].min.y
  const frontShiftY = placed[1].min.y - centered[1].min.y
  console.log('[07] TOP Y shift:', topShiftY, '(expected 100)')
  console.log('[07] FRONT Y shift:', frontShiftY, '(expected 0)')

  filewrite({ centered, placed }, 'place-comparison')

  return { partId }
}
