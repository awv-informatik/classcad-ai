export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerticalInverted' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 50, translation: [-20, 30, 0],
  })).result

  // Same vertical sheet from scripts 03/04 — tube on XY plane, wall at x=30
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

  console.log('[06] boxId:', boxId, 'cylId:', cylId, 'sheetId:', sheetId)
  await snapshot('before')

  // Test A: inverted=0 (default — same as scripts 03/04)
  const r0 = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId, inverted: 0,
  })
  console.log('[06] inverted=0: result:', r0.result, 'maxLevel:', r0.maxLevel)

  // Check body type via structure
  for (const [nid, node] of Object.entries(r0.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r0.structure.tree[String(cid)]
        console.log('[06] inv=0 child:', cn?.class, cn?.name)
      }
    }
  }

  filewrite(r0.structure, 'inv0-structure')
  await snapshot('inv0-result')

  // Now try again with inverted=1, need to recreate everything
  const partId2 = (await api.v1.part.create({ name: 'VertInv1' })).result
  const boxId2 = (await api.v1.part.box({
    id: partId2, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId2 = (await api.v1.part.cylinder({
    id: partId2, name: 'Ref', radius: 5, height: 50, translation: [-20, 30, 0],
  })).result

  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [30, -30, 0], endPos: [200, 90, 0],
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result
  const sheetId2 = (await api.v1.part.extrusion({
    id: partId2, name: 'CuttingSheet', references: [regionId2],
    type: 'UP', limit2: 60, capEnds: 0,
  })).result

  const r1 = await api.v1.part.sliceBySheet({
    id: partId2, target: boxId2, tool: sheetId2, inverted: 1,
  })
  console.log('[06] inverted=1: result:', r1.result, 'maxLevel:', r1.maxLevel)

  for (const [nid, node] of Object.entries(r1.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r1.structure.tree[String(cid)]
        console.log('[06] inv=1 child:', cn?.class, cn?.name)
      }
    }
  }

  filewrite(r1.structure, 'inv1-structure')
  await snapshot('inv1-result')

  return { partId, partId2 }
}
