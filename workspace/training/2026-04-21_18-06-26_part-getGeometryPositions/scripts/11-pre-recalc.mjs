export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Do NOT recalc — test pre-recalc behavior
  // First get IDs (which also works pre-recalc but gives "preliminary" IDs)
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })
  console.log('[11] pre-recalc line IDs:', geoIds.result.lines, 'maxLevel:', geoIds.maxLevel)

  if (geoIds.result.lines?.[0]) {
    const preRecalc = await api.v1.part.getGeometryPositions({ elems: geoIds.result.lines })
    console.log('[11] pre-recalc positions maxLevel:', preRecalc.maxLevel)
    console.log('[11] pre-recalc result:', JSON.stringify(preRecalc.result))

    // Now recalc and get positions again
    await api.v1.common.recalc({})
    const postGeoIds = await api.v1.part.getGeometryIds({
      id: partId,
      lines: [{ pos: [40, 0, 0] }],
    })
    console.log('[11] post-recalc line IDs:', postGeoIds.result.lines)

    const postRecalc = await api.v1.part.getGeometryPositions({ elems: postGeoIds.result.lines })
    console.log('[11] post-recalc positions maxLevel:', postRecalc.maxLevel)
    console.log('[11] post-recalc result:', JSON.stringify(postRecalc.result))

    // Compare IDs — are they the same?
    console.log('[11] same IDs?', geoIds.result.lines[0] === postGeoIds.result.lines[0])

    filewrite({
      preRecalcIds: geoIds.result.lines,
      preRecalcPositions: preRecalc.result,
      postRecalcIds: postGeoIds.result.lines,
      postRecalcPositions: postRecalc.result,
      sameIds: geoIds.result.lines[0] === postGeoIds.result.lines[0],
    }, 'pre-recalc')
  } else {
    console.log('[11] pre-recalc getGeometryIds failed — no edge IDs')
    filewrite({ geoIds }, 'pre-recalc-failed')
  }

  return { partId }
}
