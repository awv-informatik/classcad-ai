export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceIntersect' })).result

  // Box: 80x60x50 at origin
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  console.log('[02] boxId:', boxId)

  // Create sheet that actually passes through the box at x=40
  // Sketch on Top (XY) plane, rectangle extending past box on the right side only
  // Left edge at x=40 will be the cutting wall, other edges are outside the box
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [40, -20, 0], endPos: [200, 80, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Extrude UP along Z, spanning the box height (0 to 60, box is 50 tall)
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'CuttingSheet', references: [regionId],
    type: 'UP', limit2: 60, capEnds: 0,
  })).result
  console.log('[02] sheetId:', sheetId)

  await snapshot('before')

  // Dump graphic data before slice
  const beforeGraphic = (await api.v1.part.box({
    id: partId, name: 'RefDummy', length: 0.001, width: 0.001, height: 0.001,
  }))
  // Actually, just get the structure before
  filewrite(beforeGraphic.structure, 'before-structure')

  // Slice
  const r = await api.v1.part.sliceBySheet({
    id: partId,
    target: boxId,
    tool: sheetId,
  })
  console.log('[02] sliceBySheet result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'slice-response')

  await snapshot('after')

  return { partId, sliceId: r.result }
}
