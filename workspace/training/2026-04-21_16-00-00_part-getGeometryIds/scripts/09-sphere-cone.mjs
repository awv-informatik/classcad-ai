export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphConeTest' })).result

  // Sphere: radius 30
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 30 })).result

  // Cone: bDiameter=40, tDiameter=10, height=50, translated so they don't overlap
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'Cone1',
    bDiameter: 40, tDiameter: 10, height: 50,
    references: [],
    position: [80, 0, 0],
  })).result

  await api.v1.common.recalc({})
  console.log('[09] partId:', partId, 'sphId:', sphId, 'coneId:', coneId)

  // Sphere surface at [30, 0, 0] (rightmost point)
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    spheres: [{ positions: [[30, 0, 0]] }],
  })
  console.log('[09] sphere face (1 pt):', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Sphere surface with 2 points
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    spheres: [{ positions: [[30, 0, 0], [0, 30, 0]] }],
  })
  console.log('[09] sphere face (2 pts):', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Conical face — point on the surface
  // Cone at X=80, base radius=20, top radius=5, height=50
  // Mid-height (Z=25): radius = 20 - (20-5)*25/50 = 20 - 7.5 = 12.5
  // So point at [80+12.5, 0, 25] = [92.5, 0, 25]
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    cones: [{ positions: [[92.5, 0, 25]] }],
  })
  console.log('[09] cone face (1 pt):', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Cone face with 2 points
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    cones: [{ positions: [[92.5, 0, 25], [80, 12.5, 25]] }],
  })
  console.log('[09] cone face (2 pts):', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Cone: top circle edge (radius=5 at Z=50)
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [80, 0, 50] }],  // center of top circle
  })
  console.log('[09] cone top circle:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  // Cone: bottom circle edge (radius=20 at Z=0)
  const r6 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [80, 0, 0] }],  // center of bottom circle
  })
  console.log('[09] cone bottom circle:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)

  filewrite({ sphereFace1: r1.result, sphereFace2: r2.result, coneFace1: r3.result, coneFace2: r4.result, coneTopCircle: r5.result, coneBottomCircle: r6.result }, 'sphere-cone-results')

  await snapshot('sphere-cone')
  return { partId }
}
