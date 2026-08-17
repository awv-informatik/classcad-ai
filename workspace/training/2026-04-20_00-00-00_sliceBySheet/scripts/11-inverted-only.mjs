export default async function (api, { snapshot, filewrite }) {
  // Clean test: ONLY inverted=1, no prior operations
  const partId = (await api.v1.part.create({ name: 'InvertedOnly' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 80, translation: [-20, 30, 0],
  })).result

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

  console.log('[11] boxId:', boxId, 'sheetId:', sheetId)
  await snapshot('before')

  const r = await api.v1.part.sliceBySheet({
    id: partId, target: boxId, tool: sheetId, inverted: 1,
  })
  console.log('[11] inverted=1: result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[11] msgs:', JSON.stringify(r.messages?.map(m => m.message)))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  if (r.result) {
    await snapshot('after')

    for (const [nid, node] of Object.entries(r.structure?.tree || {})) {
      if (node.class === 'CC_SliceBySheet') {
        console.log('[11] inverted member:', node.members?.inverted?.value)
        for (const cid of (node.children || [])) {
          const cn = r.structure.tree[String(cid)]
          console.log('[11] body:', cn?.class)
        }
      }
    }
  }

  return { partId }
}
