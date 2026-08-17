export default async function (api, { snapshot, filewrite }) {
  // Find edges at a boolean subtraction junction and fillet them
  const partId = (await api.v1.part.create({ name: 'BoolEdges' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    diameter: 30,
    height: 60,
    position: [40, 30, 0],
    direction: [0, 0, 1],
  })).result
  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: boxId,
    tools: [cylId],
  })).result
  await api.v1.common.recalc({})
  console.log('[05] boolId:', boolId)

  await snapshot('boolean-result')

  // The boolean subtraction creates circular edges at the intersection.
  // Try to find them with getGeometryIds using circles param
  const circleTop = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [40, 30, 40] }],  // center of hole at top surface
  })
  console.log('[05] circle at top of hole:', JSON.stringify(circleTop.result), 'maxLevel:', circleTop.maxLevel)

  const circleBottom = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [40, 30, 0] }],  // center of hole at bottom surface
  })
  console.log('[05] circle at bottom of hole:', JSON.stringify(circleBottom.result), 'maxLevel:', circleBottom.maxLevel)

  // Also try arc-based lookup (the circles on the hole edges might be arcs internally)
  const arcTop = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [{ pos: [40, 30, 40] }],
  })
  console.log('[05] arc at top of hole:', JSON.stringify(arcTop.result), 'maxLevel:', arcTop.maxLevel)

  // Enumerate arcs and circles in the boolean feature
  const boolArcs = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boolId, arcIndex: i })
    if (r.result === null) break
    boolArcs.push({ index: i, id: r.result })
  }
  console.log('[05] boolean feature arcs:', boolArcs.length)

  // Get positions for all found circles/arcs
  const circleIds = [
    ...(circleTop.result?.circles || []),
    ...(circleBottom.result?.circles || []),
  ].filter(id => id && !Array.isArray(id))
  console.log('[05] found circle IDs:', circleIds)

  // Fillet the top circle edge of the hole
  if (circleIds.length > 0) {
    const filletId = (await api.v1.part.fillet({
      id: partId,
      references: [circleIds[0]],
      radius: 3,
    })).result
    console.log('[05] fillet on hole edge:', filletId != null ? '✓' : '❌', 'id:', filletId)
    await snapshot('hole-filleted')
  }

  // Also try with arc IDs from enumeration
  if (circleIds.length === 0 && boolArcs.length > 0) {
    console.log('[05] circles not found by position, trying arc IDs from enumeration...')
    const filletId = (await api.v1.part.fillet({
      id: partId,
      references: [boolArcs[0].id],
      radius: 3,
    })).result
    console.log('[05] fillet on enumerated arc:', filletId != null ? '✓' : '❌', 'id:', filletId)
    await snapshot('hole-filleted-via-arc')
  }

  filewrite({
    circleTop: circleTop.result,
    circleBottom: circleBottom.result,
    arcTop: arcTop.result,
    boolArcs,
  }, 'boolean-edges')

  return { partId }
}
