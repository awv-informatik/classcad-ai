export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceBySheetBasic' })).result

  // Create a box as the target solid
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  console.log('[01] boxId:', boxId)

  // Create a sketch on XY plane for the sheet
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result

  // Large rectangle that extends beyond the box in X and Y
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, -20, 0], endPos: [100, 80, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Extrude to create a sheet body (capEnds=0) at z=20 height
  // The sheet is a tube/wall — 4 planar walls without top/bottom
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'Sheet', references: [regionId],
    type: 'CUSTOM', direction: [0, 0, 1], limit1: 20, limit2: 21,
    capEnds: 0,
  })).result
  console.log('[01] sheetId:', sheetId)

  await snapshot('before-slice')

  // Slice the box using the sheet
  const r = await api.v1.part.sliceBySheet({
    id: partId,
    target: boxId,
    tool: sheetId,
  })
  console.log('[01] sliceBySheet result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'basic-response')

  await snapshot('after-slice')

  return { partId, boxId, sheetId, sliceId: r.result }
}
