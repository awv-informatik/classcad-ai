export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 80, translation: [-20, 30, 0],
  })).result

  // Sheet at z=15 from Front plane
  const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, 15, 0], endPos: [100, 200, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'Sheet1', references: [regionId],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  // Second sheet at z=35 for updating later
  const skId2 = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [-20, 35, 0], endPos: [100, 200, 0],
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result
  const sheet2Id = (await api.v1.part.extrusion({
    id: partId, name: 'Sheet2', references: [regionId2],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  console.log('[15] boxId:', boxId, 'sheetId:', sheetId, 'sheet2Id:', sheet2Id)

  const r = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId,
  })
  console.log('[15] initial slice result:', r.result, 'maxLevel:', r.maxLevel)
  await snapshot('initial')

  // Test A: update WITHOUT openFeature — should fail
  const rNoOpen = await api.v1.part.updateSliceBySheet({
    id: r.result, inverted: 1,
  })
  console.log('[15] update without open: result:', rNoOpen.result, 'maxLevel:', rNoOpen.maxLevel)
  if (rNoOpen.messages?.length) console.log('[15] no-open msgs:', JSON.stringify(rNoOpen.messages?.map(m => m.message)))

  // Test B: update WITH openFeature — change inverted
  await api.v1.part.openFeature({ id: r.result })
  const rInv = await api.v1.part.updateSliceBySheet({
    id: r.result, inverted: 1,
  })
  console.log('[15] update inverted: result:', rInv.result, 'maxLevel:', rInv.maxLevel)
  if (rInv.messages?.length) console.log('[15] inv msgs:', JSON.stringify(rInv.messages?.map(m => m.message)))
  await api.v1.part.closeFeature({ id: r.result })
  await snapshot('inverted')

  // Test C: update tool to sheet2
  await api.v1.part.openFeature({ id: r.result })
  const rTool = await api.v1.part.updateSliceBySheet({
    id: r.result, tool: { id: sheet2Id },
  })
  console.log('[15] update tool: result:', rTool.result, 'maxLevel:', rTool.maxLevel)
  if (rTool.messages?.length) console.log('[15] tool msgs:', JSON.stringify(rTool.messages?.map(m => m.message)))
  await api.v1.part.closeFeature({ id: r.result })
  await snapshot('new-tool')

  // Test D: update name
  await api.v1.part.openFeature({ id: r.result })
  const rName = await api.v1.part.updateSliceBySheet({
    id: r.result, name: 'RenamedSlice',
  })
  console.log('[15] update name: result:', rName.result, 'maxLevel:', rName.maxLevel)
  await api.v1.part.closeFeature({ id: r.result })

  // Verify name
  for (const [nid, node] of Object.entries(rName.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      console.log('[15] name after update:', node.name)
    }
  }

  return { partId }
}
