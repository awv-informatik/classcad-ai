export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const box1Id = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const box2Id = (await api.v1.part.box({ id: partId, xOrigin: 120, length: 40, width: 30, height: 20 })).result
  await api.v1.common.recalc({})

  // Use getGeometryPositions on box2 to find its actual edge positions
  // First, get all geometry info via structure
  const structR = await api.v1.part.getFeature({ id: box2Id })
  console.log('[11] box2 feature:', structR.result ? 'found' : 'null', 'maxLevel:', structR.maxLevel)

  // Try probing many positions around box2
  const probes = [
    [120, 0, 10],    // front-left vertical midpoint
    [160, 0, 10],    // front-right vertical midpoint
    [120, 30, 10],   // back-left vertical midpoint
    [160, 30, 10],   // back-right vertical midpoint
    [140, 0, 0],     // front bottom midpoint
    [140, 0, 20],    // front top midpoint
    [120, 15, 0],    // left bottom midpoint
    [160, 15, 0],    // right bottom midpoint
  ]

  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: probes.map(p => ({ pos: p })),
  })
  console.log('[11] results per probe:')
  for (let i = 0; i < probes.length; i++) {
    const r = geoR.result.lines[i]
    const found = Array.isArray(r) ? (r.length > 0 ? r[0] : 'empty') : r
    console.log('[11]  ', JSON.stringify(probes[i]), '→', found)
  }
  console.log('[11] maxLevel:', geoR.maxLevel)

  // Also try using box2Id directly as the id param (instead of partId)
  const geo2 = await api.v1.part.getGeometryIds({
    id: box2Id,
    lines: [{ pos: [120, 0, 10] }],
  })
  console.log('[11] using box2Id as id:', JSON.stringify(geo2.result?.lines), 'maxLevel:', geo2.maxLevel)

  await snapshot('two-boxes')
  filewrite({
    probeResults: probes.map((p, i) => ({ pos: p, found: geoR.result.lines[i] })),
    maxLevel: geoR.maxLevel,
    box2IdQuery: { result: geo2.result, maxLevel: geo2.maxLevel },
  }, 'box2-debug')
  return { partId }
}
