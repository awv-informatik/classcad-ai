export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimView' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[07] partId:', partId, 'boxId:', boxId)

  // Create dimensions BEFORE views (as per docs: "Previously created dimensions will appear in the defined views")
  const dimR1 = await api.v1.drawing2d.dimension({
    id: partId,
    viewType: 'FRONT',
    common: { type: 'LINEAR', textPos: [40, -15, 0], name: 'Width' },
    linear: { startPos: [0, 0, 0], endPos: [80, 0, 0], orientation: 'HORIZONTAL' }
  })
  console.log('[07] dim1 result:', dimR1.result, 'maxLevel:', dimR1.maxLevel)

  const dimR2 = await api.v1.drawing2d.dimension({
    id: partId,
    viewType: 'FRONT',
    common: { type: 'LINEAR', textPos: [-15, 20, 0], name: 'Height' },
    linear: { startPos: [0, 0, 0], endPos: [0, 40, 0], orientation: 'VERTICAL' }
  })
  console.log('[07] dim2 result:', dimR2.result, 'maxLevel:', dimR2.maxLevel)

  const dimR3 = await api.v1.drawing2d.dimension({
    id: partId,
    viewType: 'TOP',
    common: { type: 'LINEAR', textPos: [40, -15, 0], name: 'TopWidth' },
    linear: { startPos: [0, 0, 0], endPos: [80, 0, 0], orientation: 'HORIZONTAL' }
  })
  console.log('[07] dim3 (TOP) result:', dimR3.result, 'maxLevel:', dimR3.maxLevel)

  filewrite({
    dim1: { result: dimR1.result, messages: dimR1.messages, maxLevel: dimR1.maxLevel },
    dim2: { result: dimR2.result, messages: dimR2.messages, maxLevel: dimR2.maxLevel },
    dim3: { result: dimR3.result, messages: dimR3.messages, maxLevel: dimR3.maxLevel },
  }, 'dimension-responses')

  // Now create views — dimensions should appear in matching views
  const viewR = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[07] view result:', JSON.stringify(viewR.result), 'maxLevel:', viewR.maxLevel)

  // Export SVG to see if dimensions are included
  const svgOk = (await api.v1.drawing2d.isSVGAvailable({})).result
  if (svgOk) {
    const svgR = await api.v1.drawing2d.exportSVG({ id: partId })
    console.log('[07] SVG success:', svgR.result?.success, 'content length:', svgR.result?.content?.length)
    if (svgR.result?.content) {
      filewrite(svgR.result.content, 'dims-svg')
    }
  }

  return { partId }
}
