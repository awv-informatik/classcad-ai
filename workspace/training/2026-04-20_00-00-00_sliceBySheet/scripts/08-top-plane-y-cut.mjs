export default async function (api, { snapshot, filewrite }) {
  // Test: Top (XY) plane but cutting at y=30 instead of x=30
  const partId = (await api.v1.part.create({ name: 'TopPlaneYCut' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result

  // Rectangle: cutting wall at y=30, others outside box
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, 30, 0], endPos: [100, 200, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'CuttingSheet', references: [regionId],
    type: 'UP', limit2: 60, capEnds: 0,
  })).result

  console.log('[08] boxId:', boxId, 'sheetId:', sheetId)

  const r = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId,
  })
  console.log('[08] result:', r.result, 'maxLevel:', r.maxLevel)

  for (const [nid, node] of Object.entries(r.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r.structure.tree[String(cid)]
        console.log('[08] body type:', cn?.class, cn?.name)
      }
    }
  }

  // Also test: Top plane with cutting wall at x=50 on the other side
  const partId2 = (await api.v1.part.create({ name: 'TopPlaneXCut2' })).result

  const boxId2 = (await api.v1.part.box({
    id: partId2, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result

  // Rectangle from (-200, -30) to (50, 90) — cutting wall at x=50 (right edge)
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [-200, -30, 0], endPos: [50, 90, 0],
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result
  const sheetId2 = (await api.v1.part.extrusion({
    id: partId2, name: 'CuttingSheet', references: [regionId2],
    type: 'UP', limit2: 60, capEnds: 0,
  })).result

  const r2 = await api.v1.part.sliceBySheet({
    id: partId2, target: boxId2, tool: sheetId2,
  })
  console.log('[08] x=50 cut result:', r2.result, 'maxLevel:', r2.maxLevel)

  for (const [nid, node] of Object.entries(r2.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r2.structure.tree[String(cid)]
        console.log('[08] x=50 body type:', cn?.class, cn?.name)
      }
    }
  }

  return { partId, partId2 }
}
