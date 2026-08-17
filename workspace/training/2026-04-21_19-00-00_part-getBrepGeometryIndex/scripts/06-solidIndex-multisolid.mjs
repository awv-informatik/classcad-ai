export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create two separate boxes — second boolean with keepTools creates multi-solid
  const box1Id = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const box2Id = (await api.v1.part.box({ id: partId, xOrigin: 100, length: 40, width: 30, height: 20 })).result
  await api.v1.common.recalc({})

  // Get edges from both boxes
  const geo1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }], // edge on box1
  })
  const geo2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [100, 0, 10] }], // edge on box2
  })

  console.log('[06] box1 edge:', geo1.result.lines[0], 'maxLevel:', geo1.maxLevel)
  console.log('[06] box2 edge:', geo2.result.lines[0], 'maxLevel:', geo2.maxLevel)

  const edge1 = geo1.result.lines[0]
  const edge2 = geo2.result.lines[0]

  // Try indexing edge1 with solidIndex=0 on box1
  const r1a = await api.v1.part.getBrepGeometryIndex({ id: box1Id, geomId: edge1, solidIndex: 0 })
  console.log('[06] box1 edge1 solidIndex=0:', r1a.result, 'maxLevel:', r1a.maxLevel)

  // Try indexing edge2 with solidIndex=0 on box2
  const r2a = await api.v1.part.getBrepGeometryIndex({ id: box2Id, geomId: edge2, solidIndex: 0 })
  console.log('[06] box2 edge2 solidIndex=0:', r2a.result, 'maxLevel:', r2a.maxLevel)

  // Try cross-indexing: edge1 against box2 (should fail — different body)
  const r_cross = await api.v1.part.getBrepGeometryIndex({ id: box2Id, geomId: edge1 })
  console.log('[06] cross-body edge1→box2:', r_cross.result, 'maxLevel:', r_cross.maxLevel)
  if (r_cross.messages) console.log('[06] cross messages:', JSON.stringify(r_cross.messages.slice(0, 2)))

  // Now union them to get a multi-body boolean
  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1Id,
    tools: [box2Id],
    keepTools: true,
  })).result
  await api.v1.common.recalc({})
  console.log('[06] boolId:', boolId)

  // Get fresh edges after boolean
  const geoPost = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },   // edge on result body
      { pos: [100, 0, 10] }, // edge on kept tool
    ],
  })
  console.log('[06] post-union edges:', JSON.stringify(geoPost.result.lines))

  // Try indexing against the boolean feature with different solidIndex values
  if (geoPost.result.lines[0]) {
    const rbi0 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: geoPost.result.lines[0], solidIndex: 0 })
    console.log('[06] union edge solidIndex=0:', rbi0.result, 'maxLevel:', rbi0.maxLevel)
    const rbi1 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: geoPost.result.lines[0], solidIndex: 1 })
    console.log('[06] union edge solidIndex=1:', rbi1.result, 'maxLevel:', rbi1.maxLevel)
  }

  filewrite({
    box1Edge: { id: edge1, r1a },
    box2Edge: { id: edge2, r2a },
    crossBody: { r_cross },
    postUnion: geoPost.result,
  }, 'solidindex-tests')

  await snapshot('multisolid')
  return { partId }
}
