export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RightPlaneVert' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 50, translation: [-20, 30, 0],
  })).result

  // Create sheet on Right (YZ) plane — the extrusion goes along X
  // Position so a wall at y=30 passes through the box (box Y: 0-60)
  const rightId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: rightId })).result

  // On YZ plane: sketch x = world Y, sketch y = world Z
  // Rectangle from (30, -20) to (200, 70): Y from 30 to 200, Z from -20 to 70
  // Wall at y=30 passes through box (box Y: 0-60), Z from -20 to 70 covers box Z 0-50
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [30, -20, 0], endPos: [200, 70, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Extrude UP = along +X (Right plane normal), limit2=100 (covers box X: 0-80)
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'CuttingSheet', references: [regionId],
    type: 'UP', limit2: 100, capEnds: 0,
  })).result

  console.log('[07] boxId:', boxId, 'sheetId:', sheetId)
  await snapshot('before')

  const r = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId,
  })
  console.log('[07] result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[07] msgs:', JSON.stringify(r.messages?.map(m => m.message)))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Check body type
  for (const [nid, node] of Object.entries(r.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r.structure.tree[String(cid)]
        console.log('[07] child:', cn?.class, cn?.name)
      }
    }
  }

  await snapshot('after')

  // Boolean test
  if (r.result) {
    const testBox = (await api.v1.part.box({
      id: partId, name: 'T1', length: 5, width: 5, height: 5, translation: [0, 0, 60],
    })).result
    const boolR = await api.v1.part.boolean({
      id: partId, type: 'UNION', target: r.result, tools: [testBox],
    })
    console.log('[07] boolean test:', boolR.result, 'maxLevel:', boolR.maxLevel)
    if (boolR.messages?.length) console.log('[07] bool msgs:', JSON.stringify(boolR.messages?.map(m => m.message)))
  }

  return { partId }
}
