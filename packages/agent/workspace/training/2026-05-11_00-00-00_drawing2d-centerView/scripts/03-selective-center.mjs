export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SelectiveCenterTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })

  // Place views at offsets to move them
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'TOP', offset: [200, 0, 0] },
      { type: 'FRONT', offset: [0, 200, 0] },
      { type: 'ISO', offset: [300, 300, 0] },
    ],
  })

  const bboxBefore = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'ISO'],
  })
  filewrite(bboxBefore.result, 'bbox-before-selective')

  // Center ONLY TOP — FRONT and ISO should stay offset
  const r = await api.v1.drawing2d.centerView({ id: partId, types: ['TOP'] })
  console.log('[03] centerView (TOP only) result:', r.result, 'maxLevel:', r.maxLevel)

  const bboxAfter = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'ISO'],
  })
  filewrite(bboxAfter.result, 'bbox-after-selective')

  // Check centers
  const labels = ['TOP', 'FRONT', 'ISO']
  for (let i = 0; i < bboxAfter.result.length; i++) {
    const b = bboxAfter.result[i]
    const cx = (b.min.x + b.max.x) / 2
    const cy = (b.min.y + b.max.y) / 2
    const bBefore = bboxBefore.result[i]
    const cxBefore = (bBefore.min.x + bBefore.max.x) / 2
    const cyBefore = (bBefore.min.y + bBefore.max.y) / 2
    console.log(
      `[03] ${labels[i]}: before=(${cxBefore.toFixed(1)}, ${cyBefore.toFixed(1)}) after=(${cx.toFixed(1)}, ${cy.toFixed(1)}) ${Math.abs(cx) < 0.01 && Math.abs(cy) < 0.01 ? 'CENTERED' : 'NOT centered'}`,
    )
  }

  return { partId }
}
