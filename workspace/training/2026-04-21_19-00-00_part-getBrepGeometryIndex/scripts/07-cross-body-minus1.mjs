export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const box1Id = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const box2Id = (await api.v1.part.box({ id: partId, xOrigin: 120, length: 40, width: 30, height: 20 })).result
  await api.v1.common.recalc({})

  // Get edges from box1
  const geo1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },  // box1 front-left vertical
      { pos: [40, 0, 0] },  // box1 front bottom
    ],
  })
  console.log('[07] box1 edges:', JSON.stringify(geo1.result.lines), 'maxLevel:', geo1.maxLevel)

  // Get edges from box2
  const geo2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [120, 0, 10] }, // box2 front-left vertical
      { pos: [140, 15, 0] }, // box2 right bottom
    ],
  })
  console.log('[07] box2 edges:', JSON.stringify(geo2.result.lines), 'maxLevel:', geo2.maxLevel)

  const results = []

  // Index box1 edge against box1 feature (should work)
  if (geo1.result.lines[0]) {
    const r = await api.v1.part.getBrepGeometryIndex({ id: box1Id, geomId: geo1.result.lines[0] })
    console.log('[07] box1_edge → box1: index', r.result, 'maxLevel:', r.maxLevel)
    results.push({ test: 'box1_edge→box1', index: r.result, maxLevel: r.maxLevel })
  }

  // Index box1 edge against box2 feature (cross-body → expect -1)
  if (geo1.result.lines[0]) {
    const r = await api.v1.part.getBrepGeometryIndex({ id: box2Id, geomId: geo1.result.lines[0] })
    console.log('[07] box1_edge → box2: index', r.result, 'maxLevel:', r.maxLevel)
    results.push({ test: 'box1_edge→box2', index: r.result, maxLevel: r.maxLevel })
  }

  // Index box2 edge against box2 feature (should work)
  if (geo2.result.lines[0]) {
    const r = await api.v1.part.getBrepGeometryIndex({ id: box2Id, geomId: geo2.result.lines[0] })
    console.log('[07] box2_edge → box2: index', r.result, 'maxLevel:', r.maxLevel)
    results.push({ test: 'box2_edge→box2', index: r.result, maxLevel: r.maxLevel })
  }

  // Index box2 edge against box1 feature (cross-body → expect -1)
  if (geo2.result.lines[0]) {
    const r = await api.v1.part.getBrepGeometryIndex({ id: box1Id, geomId: geo2.result.lines[0] })
    console.log('[07] box2_edge → box1: index', r.result, 'maxLevel:', r.maxLevel)
    results.push({ test: 'box2_edge→box1', index: r.result, maxLevel: r.maxLevel })
  }

  filewrite(results, 'cross-body-tests')
  await snapshot('two-boxes')
  return { partId }
}
