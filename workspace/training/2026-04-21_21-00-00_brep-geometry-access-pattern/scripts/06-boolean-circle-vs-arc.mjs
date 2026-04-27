export default async function (api, { snapshot, filewrite }) {
  // Why are boolean hole edges arcs not circles? Test with rim points, center points, etc.
  const partId = (await api.v1.part.create({ name: 'CircleArc' })).result
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

  // Enumerate arc edges from the boolean
  const arcs = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boolId, arcIndex: i })
    if (r.result === null) break
    arcs.push(r.result)
  }
  console.log('[06] boolean arcs:', arcs.length, 'ids:', arcs)

  // Get positions for each arc
  const arcPositions = await api.v1.part.getGeometryPositions({ elems: arcs })
  console.log('[06] arc positions:', JSON.stringify(arcPositions.result))

  // Try finding the same arcs with different query strategies
  const radius = 15 // diameter/2
  const strategies = {
    'circles-center': { circles: [{ pos: [40, 30, 40] }] },
    'circles-rim+X': { circles: [{ pos: [40 + radius, 30, 40] }] },
    'circles-rim-X': { circles: [{ pos: [40 - radius, 30, 40] }] },
    'circles-rim+Y': { circles: [{ pos: [40, 30 + radius, 40] }] },
    'arcs-center': { arcs: [{ pos: [40, 30, 40] }] },
    'arcs-rim+X': { arcs: [{ pos: [40 + radius, 30, 40] }] },
    'arcs-rim-X': { arcs: [{ pos: [40 - radius, 30, 40] }] },
    'arcs-rim+Y': { arcs: [{ pos: [40, 30 + radius, 40] }] },
  }

  const results = {}
  for (const [name, params] of Object.entries(strategies)) {
    const r = await api.v1.part.getGeometryIds({ id: partId, ...params })
    const found = r.result?.circles?.[0] || r.result?.arcs?.[0] || null
    results[name] = { found: Array.isArray(found) ? '[]' : found, maxLevel: r.maxLevel }
    console.log(`[06] ${name}: found=${Array.isArray(found) ? '[]' : found} maxLevel=${r.maxLevel}`)
  }

  // Compare with standalone cylinder (no boolean) — are its edges circles or arcs?
  const partId2 = (await api.v1.part.create({ name: 'StandaloneCyl' })).result
  const cylId2 = (await api.v1.part.cylinder({
    id: partId2,
    diameter: 30,
    height: 40,
    position: [0, 0, 0],
    direction: [0, 0, 1],
  })).result
  await api.v1.common.recalc({})

  const cylArcs = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId2, arcIndex: i })
    if (r.result === null) break
    cylArcs.push(r.result)
  }
  const cylCircleQuery = await api.v1.part.getGeometryIds({
    id: partId2,
    circles: [{ pos: [0, 0, 40] }], // top center
  })
  const cylArcQuery = await api.v1.part.getGeometryIds({
    id: partId2,
    arcs: [{ pos: [0, 0, 40] }], // top center
  })
  console.log('[06] standalone cylinder: arcs by index:', cylArcs.length)
  console.log('[06] standalone cylinder circles query:', JSON.stringify(cylCircleQuery.result), 'maxLevel:', cylCircleQuery.maxLevel)
  console.log('[06] standalone cylinder arcs query:', JSON.stringify(cylArcQuery.result), 'maxLevel:', cylArcQuery.maxLevel)

  filewrite({
    booleanArcs: arcs,
    arcPositions: arcPositions.result,
    strategies: results,
    standaloneCylinder: {
      arcsByIndex: cylArcs,
      circleQuery: { result: cylCircleQuery.result, maxLevel: cylCircleQuery.maxLevel },
      arcQuery: { result: cylArcQuery.result, maxLevel: cylArcQuery.maxLevel },
    },
  }, 'circle-vs-arc')

  return { partId }
}
