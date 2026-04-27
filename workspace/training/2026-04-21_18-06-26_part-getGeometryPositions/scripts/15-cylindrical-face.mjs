export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 50 })).result
  await api.v1.common.recalc({})

  // Try to find cylindrical face using getBrepGeometryByIndex (enumerate faces)
  const faces = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, faceIndex: i })
    if (r.result && r.result !== 'VOID') {
      faces.push({ index: i, id: r.result })
      console.log('[15] face index', i, '→ id:', r.result)
    } else {
      break
    }
  }
  console.log('[15] total faces:', faces.length)

  if (faces.length > 0) {
    const faceIds = faces.map(f => f.id)
    const r = await api.v1.part.getGeometryPositions({ elems: faceIds })
    console.log('[15] maxLevel:', r.maxLevel)
    for (const item of r.result) {
      console.log('[15] id:', item.id, 'positions count:', item.positions.length)
      console.log('[15] positions:', JSON.stringify(item.positions))
    }
    filewrite({ faces, positions: r.result, maxLevel: r.maxLevel }, 'cylindrical-face')
  }

  await snapshot('cylinder')
  return { partId }
}
