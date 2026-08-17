export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjectForm' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
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

  // Test A: target as object form { id, indices }
  const rObj = await api.v1.part.sliceBySheet({
    id: partId,
    target: { id: boxId, indices: [0] },
    tool: { id: sheetId, indices: [0] },
    name: 'MySlice',
  })
  console.log('[13] obj form: result:', rObj.result, 'maxLevel:', rObj.maxLevel)
  if (rObj.messages?.length) console.log('[13] msgs:', JSON.stringify(rObj.messages?.map(m => m.message)))
  filewrite({ result: rObj.result, messages: rObj.messages, maxLevel: rObj.maxLevel }, 'obj-response')

  // Check feature name in structure
  for (const [nid, node] of Object.entries(rObj.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      console.log('[13] feature name:', node.name)
      for (const cid of (node.children || [])) {
        const cn = rObj.structure.tree[String(cid)]
        console.log('[13] body:', cn?.class, cn?.name)
      }
    }
  }

  // Test B: target as plain ID (already tested, but verify in same script style)
  // Skipping — confirmed in scripts 05, 07, 11

  // Test C: tool as a SOLID (not a sheet) — should it error?
  // Done in next script

  await snapshot('result')

  return { partId }
}
