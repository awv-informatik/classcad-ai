export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CleanSlice' })).result

  // Box: 80x60x50 at origin
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  // Reference cylinder (won't be sliced — for visual comparison)
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 50, translation: [-20, 30, 0],
  })).result

  // Sheet: extrude a rectangle on Top (XY) plane with capEnds=0
  // Position so only the left wall at x=30 passes through the box
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [30, -30, 0], endPos: [200, 90, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'CuttingSheet', references: [regionId],
    type: 'UP', limit2: 60, capEnds: 0,
  })).result

  console.log('[03] boxId:', boxId, 'cylId:', cylId, 'sheetId:', sheetId)
  await snapshot('before')

  const r = await api.v1.part.sliceBySheet({
    id: partId,
    target: boxId,
    tool: sheetId,
  })
  console.log('[03] sliceBySheet result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('after')

  // Check consumption: try to use boxId and sheetId
  const checkBox = await api.v1.part.box({ id: partId, name: 'CheckBox', length: 1, width: 1, height: 1 })
  console.log('[03] can still create features:', checkBox.maxLevel)

  // Try referencing boxId in a boolean — is it consumed?
  const testBool = await api.v1.part.boolean({
    id: partId, type: 'UNION', target: r.result, tools: [cylId],
  })
  console.log('[03] boolean with sliceId+cylId result:', testBool.result, 'maxLevel:', testBool.maxLevel)
  if (testBool.messages?.length) console.log('[03] boolean msgs:', JSON.stringify(testBool.messages))

  await snapshot('after-boolean')

  return { partId, sliceId: r.result }
}
