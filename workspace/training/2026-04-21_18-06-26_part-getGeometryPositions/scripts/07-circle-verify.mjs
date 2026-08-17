export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  // Use diameter explicitly to avoid confusion
  const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 50 })).result
  await api.v1.common.recalc({})

  // Circle edges — avoid seam at +X
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [
      { pos: [0, 0, 0] },    // bottom circle center
      { pos: [0, 0, 50] },   // top circle center
    ],
  })
  console.log('[07] circle IDs:', geoIds.result.circles, 'maxLevel:', geoIds.maxLevel)

  const r = await api.v1.part.getGeometryPositions({ elems: geoIds.result.circles })
  console.log('[07] maxLevel:', r.maxLevel)
  for (const item of r.result) {
    console.log('[07] id:', item.id, 'positions:', JSON.stringify(item.positions))
  }

  // Expected: midpoints at (-radius, 0, z) = (-20, 0, z)
  console.log('[07] Expected bottom midpoint at (-20, 0, 0)')
  console.log('[07] Expected top midpoint at (-20, 0, 50)')

  filewrite({ result: r.result }, 'circle-verify')
  return { partId }
}
