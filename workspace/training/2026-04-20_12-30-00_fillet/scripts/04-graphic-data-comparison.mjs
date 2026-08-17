export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletData' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Get before graphic from the box creation response
  const beforeVis = await api.v1.common.requestVisualisation({})
  filewrite(beforeVis.graphic, 'before-graphic')

  // Find top-front edge
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  // Create fillet
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: geoIds.lines,
    radius: 10,
  })
  console.log('[04] fillet result:', r.result, 'maxLevel:', r.maxLevel)

  // Get after graphic from the fillet response
  filewrite(r.graphic, 'after-graphic')

  // Compare: count mesh triangles/vertices from the fillet response graphic
  if (r.graphic?.meshes) {
    const meshSummary = r.graphic.meshes.map((m, i) => ({
      meshIndex: i,
      posCount: m.positions?.length,
      normalCount: m.normals?.length,
      indexCount: m.indices?.length,
    }))
    filewrite(meshSummary, 'mesh-summary')
    console.log('[04] mesh count:', r.graphic.meshes.length)
    for (const s of meshSummary) {
      console.log(`[04] mesh ${s.meshIndex}: ${s.posCount / 3} verts, ${s.indexCount / 3} tris`)
    }
  } else {
    console.log('[04] no meshes in fillet response graphic')
    // Check graphic keys
    console.log('[04] graphic keys:', r.graphic ? Object.keys(r.graphic) : 'null')
  }

  // Also check edge data
  if (r.graphic?.edges) {
    console.log('[04] edge arrays:', r.graphic.edges.length)
  }

  await snapshot('result')

  return { partId, filletId: r.result }
}
