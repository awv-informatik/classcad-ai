export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExportTest' })).result
  // Create a more interesting shape — box with a hole
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const skId = (await api.v1.part.sketch({ id: partId, name: 'HoleSk' })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 15 })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circId] })).result
  const extId = (await api.v1.part.extrusion({
    id: partId,
    name: 'HoleExt',
    references: [regionId],
    type: 'UP',
    limit2: 45,
    operation: 'SUBTRACTION'
  })).result
  console.log('[06] extId:', extId)

  await snapshot('3d-model')

  // Create views
  const viewR = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })
  console.log('[06] view result:', JSON.stringify(viewR.result), 'maxLevel:', viewR.maxLevel)

  // Check if SVG export is available
  const svgOk = (await api.v1.drawing2d.isSVGAvailable({})).result
  console.log('[06] SVG available:', svgOk)

  // Export SVG
  if (svgOk) {
    const svgR = await api.v1.drawing2d.exportSVG({ id: partId })
    console.log('[06] SVG export success:', svgR.result?.success, 'content length:', svgR.result?.content?.length)
    if (svgR.result?.content) {
      filewrite(svgR.result.content, 'views-svg')
    }
  }

  // Check DXF availability
  const dxfOk = (await api.v1.drawing2d.isDXFAvailable({})).result
  console.log('[06] DXF available:', dxfOk)

  if (dxfOk) {
    const dxfR = await api.v1.drawing2d.exportDXF({ id: partId })
    console.log('[06] DXF export success:', dxfR.result?.success, 'content length:', dxfR.result?.content?.length)
  }

  return { partId }
}
