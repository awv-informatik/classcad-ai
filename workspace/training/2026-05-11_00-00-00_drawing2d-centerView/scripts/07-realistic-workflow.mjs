export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WorkflowTest' })).result

  // Asymmetric L-shaped part
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 100, width: 60, height: 20 })).result
  const box2 = (
    await api.v1.part.box({ id: partId, name: 'Upright', length: 20, width: 60, height: 80, references: { origin: [0, 0, 20] } })
  ).result

  // Typical drawing workflow: dimensions → views → center → place → export

  // 1. Create dimensions
  const dimId = (
    await api.v1.drawing2d.dimension({
      id: partId,
      viewType: 'FRONT',
      common: { type: 'LINEAR', textPos: [50, -15, 0] },
      linear: { startPos: [0, 0, 0], endPos: [100, 0, 0], orientation: 'HORIZONTAL' },
    })
  ).result
  console.log('[07] dimId:', dimId)

  // 2. Create views
  const viewIds = (await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
  console.log('[07] viewIds:', viewIds)

  // 3. Center all views
  await api.v1.drawing2d.centerView({ id: partId })

  const bboxCentered = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT', 'ISO'],
  })
  filewrite(bboxCentered.result, 'bbox-centered')

  // Verify all centered
  const labels = ['TOP', 'FRONT', 'RIGHT', 'ISO']
  for (let i = 0; i < bboxCentered.result.length; i++) {
    const b = bboxCentered.result[i]
    const cx = (b.min.x + b.max.x) / 2
    const cy = (b.min.y + b.max.y) / 2
    const w = b.max.x - b.min.x
    const h = b.max.y - b.min.y
    console.log(`[07] ${labels[i]}: center=(${cx.toFixed(1)},${cy.toFixed(1)}) size=${w.toFixed(1)}x${h.toFixed(1)}`)
  }

  // 4. Place views in a standard engineering drawing layout
  // TOP above FRONT, RIGHT to the right of FRONT
  await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'TOP', offset: [0, 120, 0] },
      { type: 'FRONT', offset: [0, 0, 0] },
      { type: 'RIGHT', offset: [150, 0, 0] },
      { type: 'ISO', offset: [300, 120, 0] },
    ],
  })

  const bboxFinal = await api.v1.drawing2d.getBoundaryBoxFromView({
    id: partId,
    types: ['TOP', 'FRONT', 'RIGHT', 'ISO'],
  })
  filewrite(bboxFinal.result, 'bbox-final-layout')

  // 5. Export SVG to verify
  const svgCheck = await api.v1.drawing2d.isSVGAvailable({})
  console.log('[07] SVG available:', svgCheck.result)

  if (svgCheck.result) {
    const svgResult = await api.v1.drawing2d.exportSVG({
      id: partId,
      modus: 'SVG_FIT_WHOLE_DRAWING',
      renderSize: { x: 800, y: 600 },
    })
    console.log('[07] SVG export success:', svgResult.result?.success)
    if (svgResult.result?.content) {
      filewrite(svgResult.result.content, 'drawing-svg')
    }
  }

  await snapshot('workflow-result')
  return { partId, viewIds }
}
