export default async function (api, { snapshot, filewrite }) {
  // Sheet that doesn't intersect the target — Front plane approach
  const partId = (await api.v1.part.create({ name: 'NoIntersect' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  // Sheet at z=100 — well above the box (height 50)
  const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, 100, 0], endPos: [100, 200, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'Sheet', references: [regionId],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  const r = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId,
  })
  console.log('[16] no-intersection: result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[16] msgs:', JSON.stringify(r.messages?.map(m => m.message)))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Check body type
  for (const [nid, node] of Object.entries(r.structure?.tree || {})) {
    if (node.class === 'CC_SliceBySheet') {
      for (const cid of (node.children || [])) {
        const cn = r.structure.tree[String(cid)]
        console.log('[16] body:', cn?.class, cn?.name)
      }
    }
  }

  await snapshot('result')

  return { partId }
}
