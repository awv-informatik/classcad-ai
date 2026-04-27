export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylTest' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 40, height: 60 })).result
  await api.v1.common.recalc({})
  console.log('[04] partId:', partId, 'cylId:', cylId)

  // Cylinder: diameter=40 (radius=20), height=60
  // Centered at origin, extends along Z
  // Top circle edge at Z=60, bottom circle edge at Z=0
  // Cylindrical face at radius=20

  // Top circle edge — point on the circle: [20, 0, 60]
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [20, 0, 60] }],
  })
  console.log('[04] top circle edge:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Bottom circle edge — point on the circle: [20, 0, 0]
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [20, 0, 0] }],
  })
  console.log('[04] bottom circle edge:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Top circle — try using a point ON the plane of the circle (center)
  const r2b = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 0, 60] }],  // center of top circle
  })
  console.log('[04] top circle via center:', JSON.stringify(r2b.result), 'maxLevel:', r2b.maxLevel)

  // Cylindrical face — point on the surface: [20, 0, 30]
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    cylinders: [{ positions: [[20, 0, 30]] }],
  })
  console.log('[04] cylindrical face:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Top flat face (plane): Z=60
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[0, 0, 60]] }],
  })
  console.log('[04] top flat face:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Bottom flat face (plane): Z=0
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[0, 0, 0]] }],
  })
  console.log('[04] bottom flat face:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  filewrite({ topCircle: r1.result, bottomCircle: r2.result, topCircleViaCenter: r2b.result, cylFace: r3.result, topPlane: r4.result, bottomPlane: r5.result }, 'cylinder-all-results')

  await snapshot('cylinder')
  return { partId }
}
