export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OmitTypesTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })

  // Place views at offsets first to move them away from origin
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'TOP', offset: [200, 0, 0] },
      { type: 'FRONT', offset: [0, 200, 0] },
      { type: 'RIGHT', offset: [-100, -100, 0] },
      { type: 'ISO', offset: [300, 300, 0] },
    ],
  })

  const bboxBefore = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT', 'ISO'],
  })
  filewrite(bboxBefore.result, 'bbox-before-omit')

  // Center ALL views by omitting types
  const r = await api.v1.drawing2d.centerView({ id: partId })
  console.log('[02] centerView (no types) result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'centerView-omit-response')

  const bboxAfter = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT', 'ISO'],
  })
  filewrite(bboxAfter.result, 'bbox-after-omit')

  // Verify all are centered (center at ~0,0)
  for (let i = 0; i < bboxAfter.result.length; i++) {
    const b = bboxAfter.result[i]
    const cx = (b.min.x + b.max.x) / 2
    const cy = (b.min.y + b.max.y) / 2
    console.log(`[02] view ${i} center: (${cx.toFixed(2)}, ${cy.toFixed(2)})`)
  }

  return { partId }
}
