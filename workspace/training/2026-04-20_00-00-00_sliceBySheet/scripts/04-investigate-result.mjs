export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvestigateResult' })).result

  // Box: 80x60x50 at origin
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  // Sheet: single wall at x=30 passing through box
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

  console.log('[04] boxId:', boxId, 'sheetId:', sheetId)

  // Dump structure before slice
  const beforeR = await api.v1.common.getAppVersion({})
  filewrite(beforeR.structure, 'before-structure')

  // Slice
  const r = await api.v1.part.sliceBySheet({
    id: partId,
    target: boxId,
    tool: sheetId,
  })
  console.log('[04] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Dump structure after slice
  filewrite(r.structure, 'after-structure')

  // Check what's in the graphic data
  if (r.graphic) {
    const meshCount = r.graphic.meshes?.length ?? 0
    const edgeCount = r.graphic.edges?.length ?? 0
    console.log('[04] graphic: meshes:', meshCount, 'edges:', edgeCount)
    r.graphic.meshes?.forEach((m, i) => {
      console.log('[04] mesh', i, '- verts:', m.positions?.length / 3, 'color:', JSON.stringify(m.color))
    })
  }

  // Try to use the result with target object form + indices
  // Maybe the result has both sheet and solid bodies at different indices
  const testBool0 = await api.v1.part.boolean({
    id: partId, type: 'UNION',
    target: { id: r.result, indices: [0] },
    tools: [{ id: (await api.v1.part.box({ id: partId, name: 'T1', length: 5, width: 5, height: 5, translation: [0, 0, 60] })).result }],
  })
  console.log('[04] boolean index 0:', testBool0.result, 'maxLevel:', testBool0.maxLevel)
  if (testBool0.messages?.length) console.log('[04] bool0 msgs:', JSON.stringify(testBool0.messages?.map(m => m.message)))

  await snapshot('final')

  return { partId, sliceId: r.result }
}
