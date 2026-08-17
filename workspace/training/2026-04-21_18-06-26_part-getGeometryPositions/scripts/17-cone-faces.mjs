export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const coneId = (await api.v1.part.cone({
    id: partId,
    diameter1: 60,
    diameter2: 20,
    height: 50,
  })).result
  await api.v1.common.recalc({})

  // Enumerate faces
  const faces = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: coneId, faceIndex: i })
    if (r.result && r.result !== 'VOID') {
      faces.push({ index: i, id: r.result })
      console.log('[17] face index', i, '→ id:', r.result)
    } else {
      break
    }
  }

  // Enumerate circles
  const circles = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: coneId, arcIndex: i })
    if (r.result && r.result !== 'VOID') {
      circles.push({ index: i, id: r.result })
      console.log('[17] arc/circle index', i, '→ id:', r.result)
    } else {
      break
    }
  }

  const allIds = [...faces.map(f => f.id), ...circles.map(c => c.id)]
  console.log('[17] all IDs:', allIds)

  if (allIds.length > 0) {
    const r = await api.v1.part.getGeometryPositions({ elems: allIds })
    console.log('[17] maxLevel:', r.maxLevel)
    for (const item of r.result) {
      console.log('[17] id:', item.id, 'positions count:', item.positions.length)
      console.log('[17] positions:', JSON.stringify(item.positions))
    }
    filewrite({ faces, circles, result: r.result, maxLevel: r.maxLevel }, 'cone-faces')
  }

  await snapshot('cone')
  return { partId }
}
