export default async function (api, { snapshot, filewrite }) {
  // Basic end-to-end: create box → recalc → find edges → fillet → verify
  const partId = (await api.v1.part.create({ name: 'E2E' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Step 1: Find edges by position (top-front and front-left vertical)
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },  // top-front edge midpoint
      { pos: [0, 0, 20] },   // front-left vertical edge midpoint
    ],
  })
  console.log('[01] getGeometryIds result:', JSON.stringify(geo.result))
  console.log('[01] maxLevel:', geo.maxLevel)

  // Step 2: Apply fillet
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: geo.result.lines,
    radius: 8,
  })).result
  console.log('[01] filletId:', filletId)

  await snapshot('after-fillet')

  // Step 3: Recalc and re-query to see what changed
  await api.v1.common.recalc({})

  // Try to find the SAME positions again — do the IDs change?
  const geo2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },  // same top-front position
      { pos: [0, 0, 20] },   // same front-left vertical position
    ],
  })
  console.log('[01] post-fillet getGeometryIds lines:', JSON.stringify(geo2.result))
  console.log('[01] post-fillet maxLevel:', geo2.maxLevel)

  // Also check: do original edge IDs still resolve?
  const posCheck = await api.v1.part.getGeometryPositions({ elems: geo.result.lines })
  console.log('[01] original IDs still valid?', posCheck.maxLevel <= 31 ? 'yes' : 'no', 'maxLevel:', posCheck.maxLevel)

  filewrite({
    preFillet: { edges: geo.result, maxLevel: geo.maxLevel },
    postFillet: { edges: geo2.result, maxLevel: geo2.maxLevel },
    originalIdsStillValid: posCheck.maxLevel <= 31,
    originalIdsResult: posCheck.result,
  }, 'e2e-comparison')

  return { partId }
}
