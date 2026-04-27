export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get several edge IDs using getGeometryIds
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },   // front-left vertical
      { pos: [80, 0, 20] },  // front-right vertical
      { pos: [40, 0, 0] },   // front bottom horizontal
      { pos: [40, 0, 40] },  // front top horizontal
    ],
  })
  console.log('[01] getGeometryIds lines:', JSON.stringify(geoR.result.lines))

  // Now get the brep index for each edge
  const results = []
  for (const edgeId of geoR.result.lines) {
    const r = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
    console.log('[01] edge', edgeId, '→ index:', r.result, 'maxLevel:', r.maxLevel)
    results.push({ edgeId, index: r.result, maxLevel: r.maxLevel })
  }

  filewrite(results, 'edge-indices')
  await snapshot('box')
  return { partId, boxId }
}
