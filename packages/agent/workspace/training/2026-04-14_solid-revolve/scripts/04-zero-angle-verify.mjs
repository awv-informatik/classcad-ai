// Verify angle=0 creates degenerate geometry — check graphic data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroAngle' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 40, ya: 0 }, { xa: 55, ya: 0 },
      { xa: 55, ya: 15 }, { xa: 40, ya: 15 },
    ],
    close: true,
  })

  const r = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: 0, curves: shapeId,
  })

  console.log('[04] angle=0 result:', r.result, 'maxLevel:', r.maxLevel)

  // Check graphic data for vertex count
  if (r.graphic) {
    const meshes = r.graphic.meshes || []
    const totalVerts = meshes.reduce((sum, m) => sum + (m.vertices ? m.vertices.length / 3 : 0), 0)
    console.log('[04] mesh count:', meshes.length, 'total vertices:', totalVerts)
    filewrite({ meshCount: meshes.length, totalVertices: totalVerts }, 'zero-angle-graphic')
  } else {
    console.log('[04] no graphic data returned')
  }

  // Compare with a normal revolve in the same drawing
  const shapeId2 = (await api.v1.curve.shape({ id: eifId, name: 'Normal' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId2,
    pld: [
      { xa: 40, ya: 30 }, { xa: 55, ya: 30 },
      { xa: 55, ya: 45 }, { xa: 40, ya: 45 },
    ],
    close: true,
  })

  const r2 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 30, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: shapeId2,
  })

  if (r2.graphic) {
    const meshes = r2.graphic.meshes || []
    const totalVerts = meshes.reduce((sum, m) => sum + (m.vertices ? m.vertices.length / 3 : 0), 0)
    console.log('[04] normal 90° mesh count:', meshes.length, 'total vertices:', totalVerts)
  }

  await snapshot('zero-vs-normal')
  return { partId }
}
