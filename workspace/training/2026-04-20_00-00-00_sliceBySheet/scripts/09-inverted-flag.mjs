export default async function (api, { snapshot, filewrite }) {
  // Test inverted=0 vs inverted=1 with working horizontal sheet approach
  const partId = (await api.v1.part.create({ name: 'InvertedTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 80, translation: [-20, 30, 0],
  })).result

  // Sheet at z=25 (middle of box) from Front plane
  const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, 25, 0], endPos: [100, 200, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'Sheet', references: [regionId],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  await snapshot('before')

  // inverted=0 (default): keep side along sheet normal
  const r0 = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId, inverted: 0,
  })
  console.log('[09] inv=0: result:', r0.result, 'maxLevel:', r0.maxLevel)
  filewrite({ result: r0.result, messages: r0.messages, maxLevel: r0.maxLevel }, 'inv0-response')
  await snapshot('inv0')

  // Now test inverted=1: recreate everything
  const partId2 = (await api.v1.part.create({ name: 'InvertedTest2' })).result
  const boxId2 = (await api.v1.part.box({
    id: partId2, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId2 = (await api.v1.part.cylinder({
    id: partId2, name: 'Ref', radius: 5, height: 80, translation: [-20, 30, 0],
  })).result

  const frontId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Front' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: frontId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [-20, 25, 0], endPos: [100, 200, 0],
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result
  const sheetId2 = (await api.v1.part.extrusion({
    id: partId2, name: 'Sheet', references: [regionId2],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  const r1 = await api.v1.part.sliceBySheet({
    id: partId2, target: boxId2, tool: sheetId2, inverted: 1,
  })
  console.log('[09] inv=1: result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'inv1-response')
  await snapshot('inv1')

  // Check body types
  for (const [nid, node] of Object.entries(r0.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r0.structure.tree[String(cid)]
        console.log('[09] inv=0 body:', cn?.class)
      }
    }
  }
  for (const [nid, node] of Object.entries(r1.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r1.structure.tree[String(cid)]
        console.log('[09] inv=1 body:', cn?.class)
      }
    }
  }

  return { partId, partId2 }
}
