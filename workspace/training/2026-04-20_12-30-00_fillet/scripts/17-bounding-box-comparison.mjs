export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletBBox' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Get bounding box before fillet (from graphic containers)
  const beforeVis = await api.v1.common.requestVisualisation({})
  const beforeBBox = beforeVis.graphic?.containers?.[0]?.properties
  console.log('[17] before bbox min:', JSON.stringify(beforeBBox?.min), 'max:', JSON.stringify(beforeBBox?.max))

  // Find top-front edge
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  // Create fillet with radius 15
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: geoIds.lines,
    radius: 15,
  })
  console.log('[17] fillet result:', r.result, 'maxLevel:', r.maxLevel)

  // Get bounding box after fillet
  const afterBBox = r.graphic?.containers?.[0]?.properties
  console.log('[17] after bbox min:', JSON.stringify(afterBBox?.min), 'max:', JSON.stringify(afterBBox?.max))

  // Compare mesh vertex counts
  const beforeMesh = beforeVis.graphic?.containers?.[0]?.meshes?.[0]
  const afterMesh = r.graphic?.containers?.[0]?.meshes?.[0]
  const beforeVerts = beforeMesh?.positions?.length / 3 || 0
  const afterVerts = afterMesh?.positions?.length / 3 || 0
  console.log('[17] vertices: before=%d, after=%d, delta=%d', beforeVerts, afterVerts, afterVerts - beforeVerts)

  filewrite({
    beforeBBox: { min: beforeBBox?.min, max: beforeBBox?.max },
    afterBBox: { min: afterBBox?.min, max: afterBBox?.max },
    vertices: { before: beforeVerts, after: afterVerts, delta: afterVerts - beforeVerts },
  }, 'bbox-comparison')

  await snapshot('result')

  return { partId, filletId: r.result }
}
