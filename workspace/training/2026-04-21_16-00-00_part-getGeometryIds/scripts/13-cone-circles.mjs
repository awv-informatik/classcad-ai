export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeCircles' })).result
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'Cone1',
    bDiameter: 40, tDiameter: 10, height: 50,
  })).result
  await api.v1.common.recalc({})

  // Cone arcs: bottom at [-20, ~0, 0], top at [-5, ~0, 50]
  // Seam points: [20, 0, 0] and [5, 0, 50]

  // Try circles param at the arc midpoint (not seam, not center)
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [-20, 0, 0] }],  // midpoint of bottom arc
  })
  console.log('[13] cone bottom circle [-20,0,0]:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [-5, 0, 50] }],  // midpoint of top arc
  })
  console.log('[13] cone top circle [-5,0,50]:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Try circles at center
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 0, 0] }],  // center of bottom circle
  })
  console.log('[13] cone bottom circle center:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 0, 50] }],  // center of top circle
  })
  console.log('[13] cone top circle center:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Try circles at other points on the rim
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 20, 0] }],  // 90° on bottom circle
  })
  console.log('[13] cone bottom circle [0,20,0]:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  // Try seam point
  const r6 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [20, 0, 0] }],  // seam point bottom
  })
  console.log('[13] cone bottom circle seam [20,0,0]:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)

  filewrite({ midBottom: r1.result, midTop: r2.result, centerBottom: r3.result, centerTop: r4.result, rim90: r5.result, seam: r6.result }, 'cone-circles-results')

  return { partId }
}
