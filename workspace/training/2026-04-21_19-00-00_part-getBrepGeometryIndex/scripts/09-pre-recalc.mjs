export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  // NO recalc

  // Get a pre-recalc edge ID
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const preEdge = geoR.result.lines[0]
  console.log('[09] pre-recalc edge:', preEdge)

  // Try indexing pre-recalc
  const rPre = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: preEdge })
  console.log('[09] pre-recalc index:', rPre.result, 'maxLevel:', rPre.maxLevel)

  // Now recalc
  await api.v1.common.recalc({})

  // Get post-recalc edge ID at same position
  const geoPost = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const postEdge = geoPost.result.lines[0]
  console.log('[09] post-recalc edge:', postEdge)

  // Index post-recalc
  const rPost = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: postEdge })
  console.log('[09] post-recalc index:', rPost.result, 'maxLevel:', rPost.maxLevel)

  // Try the pre-recalc ID after recalc (it's stale)
  const rStale = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: preEdge })
  console.log('[09] stale pre-recalc ID after recalc:', rStale.result, 'maxLevel:', rStale.maxLevel)
  if (rStale.messages?.length) console.log('[09] stale messages:', JSON.stringify(rStale.messages.slice(0, 2)))

  console.log('[09] IDs same?', preEdge === postEdge, 'indices same?', rPre.result === rPost.result)

  filewrite({
    preRecalc: { edgeId: preEdge, index: rPre.result, maxLevel: rPre.maxLevel },
    postRecalc: { edgeId: postEdge, index: rPost.result, maxLevel: rPost.maxLevel },
    stale: { result: rStale.result, maxLevel: rStale.maxLevel, messages: rStale.messages },
  }, 'pre-recalc-test')

  return { partId }
}
