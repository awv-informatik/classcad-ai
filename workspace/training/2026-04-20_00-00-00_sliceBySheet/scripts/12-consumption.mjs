export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConsumptionTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl', radius: 20, height: 40, translation: [40, 30, 0],
  })).result

  // Sheet from Front plane at z=20
  const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, 20, 0], endPos: [100, 200, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'Sheet', references: [regionId],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  console.log('[12] boxId:', boxId, 'sheetId:', sheetId)

  const r = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId,
  })
  console.log('[12] sliceBySheet result:', r.result, 'maxLevel:', r.maxLevel)

  // Test consumption: try to use boxId in a boolean
  const boolBox = await api.v1.part.boolean({
    id: partId, type: 'UNION', target: boxId, tools: [cylId],
  })
  console.log('[12] boolean with consumed boxId: result:', boolBox.result, 'maxLevel:', boolBox.maxLevel)
  if (boolBox.messages?.length) console.log('[12] box bool msg:', boolBox.messages[0]?.message)

  // Test consumption: try to use sheetId in a sliceBySheet
  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2', length: 30, width: 30, height: 30, translation: [0, 0, 60],
  })).result
  const boolSheet = await api.v1.part.sliceBySheet({
    id: partId, target: box2, tool: sheetId,
  })
  console.log('[12] sliceBySheet with consumed sheetId: result:', boolSheet.result, 'maxLevel:', boolSheet.maxLevel)
  if (boolSheet.messages?.length) console.log('[12] sheet reuse msg:', boolSheet.messages[0]?.message)

  // Test: can we use the returned sliceId as target for a boolean?
  const box3 = (await api.v1.part.box({
    id: partId, name: 'Box3', length: 10, width: 10, height: 10, translation: [35, 25, 60],
  })).result
  const boolSlice = await api.v1.part.boolean({
    id: partId, type: 'UNION', target: r.result, tools: [box3],
  })
  console.log('[12] boolean with sliceId: result:', boolSlice.result, 'maxLevel:', boolSlice.maxLevel)
  if (boolSlice.messages?.length) console.log('[12] slice bool msg:', boolSlice.messages[0]?.message)

  await snapshot('final')

  return { partId }
}
