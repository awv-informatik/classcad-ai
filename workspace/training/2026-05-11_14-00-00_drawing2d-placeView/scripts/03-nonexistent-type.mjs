export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonExistentType' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Only create TOP and FRONT views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Try to place RIGHT (which doesn't exist) and TOP (which does)
  const r = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'RIGHT', offset: [100, 0, 0] },
      { type: 'TOP', offset: [0, 50, 0] },
    ],
  })
  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  // Verify TOP was placed despite RIGHT not existing
  const bbox = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[03] TOP bbox after:', JSON.stringify(bbox))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, bbox }, 'nonexistent-data')

  return { partId }
}
