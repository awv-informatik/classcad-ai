export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box and separate cylinder
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const wcsId = (await api.v1.part.workCSys({ id: partId, origin: [150, 0, 0] })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, references: [wcsId], radius: 20, height: 30 })).result
  await api.v1.common.recalc({})

  // Get edges from both bodies using confirmed positions
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],                // box edge
    circles: [{ pos: [130, 0, 0] }],              // cyl bottom circle (180° from seam)
  })
  console.log('[13] box edge:', geo.result.lines[0])
  console.log('[13] cyl circle:', geo.result.circles?.[0], 'maxLevel:', geo.maxLevel)

  const boxEdge = geo.result.lines[0]
  const cylCircle = geo.result.circles?.[0]

  // Before union: cross-body test
  if (boxEdge) {
    const r = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: boxEdge })
    console.log('[13] boxEdge → cylFeature:', r.result, '(expect -1)')
  }

  // Union with keepTools to get multi-solid boolean feature
  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: boxId,
    tools: [cylId],
    keepTools: true,
  })).result
  await api.v1.common.recalc({})
  console.log('[13] boolId:', boolId)

  // Get fresh edges after union
  const geoPost = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
    circles: [{ pos: [130, 0, 0] }],
  })
  const newEdge = geoPost.result.lines[0]
  const newCircle = geoPost.result.circles?.[0]
  console.log('[13] post-union edge:', newEdge, 'circle:', newCircle)

  if (newEdge && !Array.isArray(newEdge)) {
    // solidIndex=0 should be the union result (target body)
    const r0 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newEdge, solidIndex: 0 })
    console.log('[13] boxEdge solidIndex=0:', r0.result, 'maxLevel:', r0.maxLevel)
    // solidIndex=1 should be the kept tool (cylinder)
    const r1 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newEdge, solidIndex: 1 })
    console.log('[13] boxEdge solidIndex=1:', r1.result, 'maxLevel:', r1.maxLevel)
  }

  if (newCircle && !Array.isArray(newCircle)) {
    const r0 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newCircle, solidIndex: 0 })
    console.log('[13] cylCircle solidIndex=0:', r0.result, 'maxLevel:', r0.maxLevel)
    const r1 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newCircle, solidIndex: 1 })
    console.log('[13] cylCircle solidIndex=1:', r1.result, 'maxLevel:', r1.maxLevel)
  }

  await snapshot('union')
  return { partId }
}
