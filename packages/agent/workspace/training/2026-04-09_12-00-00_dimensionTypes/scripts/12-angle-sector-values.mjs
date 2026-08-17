// Map all 4 ANGLE sectors and understand sector numbering
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines forming 60° angle: horizontal and 60° from origin
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 86.6, 0] })).result

  // 4 dimPos positions to test all sectors:
  // Sector between lines above X-axis (acute, ~60°)
  // Sector above line2 (obtuse, ~120°)
  // Sector below X-axis to the left (obtuse, ~120°)
  // Sector below X-axis to the right (reflex, ~240° or acute ~300°)
  const positions = [
    { dimPos: [60, 30, 0], label: 'between-above' },   // between lines, above x-axis
    { dimPos: [-30, 50, 0], label: 'above-line2' },     // above line2, left of origin
    { dimPos: [-30, -20, 0], label: 'below-left' },     // below x-axis, left
    { dimPos: [60, -30, 0], label: 'below-right' },     // below x-axis, right
  ]

  const results = []
  for (const { dimPos, label } of positions) {
    const r = await api.v1.sketch.dimension({
      id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos, name: label
    })
    console.log(`[12] ${label}: id=${r.result} maxLevel=${r.maxLevel}`)
    results.push({ label, id: r.result, maxLevel: r.maxLevel })
  }

  // Also add reflex=true variant
  const rReflex = await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [line1, line2], reflex: true, name: 'reflex-true'
  })
  console.log(`[12] reflex-true: id=${rReflex.result} maxLevel=${rReflex.maxLevel}`)
  results.push({ label: 'reflex-true', id: rReflex.result, maxLevel: rReflex.maxLevel })

  // Extract all dim nodes
  const dimIds = results.map(r => r.id).filter(Boolean)
  function findNodes(obj, ids) {
    const res = []
    if (!obj || typeof obj !== 'object') return res
    if (ids.includes(obj.id)) {
      const m = obj.members || {}
      res.push({
        id: obj.id, name: obj.name,
        sector: m.sector?.value,
        ccw: m.ccw?.value,
        cornerPt: m.cornerPt?.value,
        startPt: m.startPt?.value,
        endPt: m.endPt?.value,
        paramName: m.paramName?.value,
      })
      return res
    }
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) res.push(...findNodes(item, ids))
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        res.push(...findNodes(obj[key], ids))
      }
    }
    return res
  }

  const nodes = findNodes(rReflex.structure, dimIds)
  filewrite(nodes, 'sector-map')
  for (const n of nodes) {
    console.log(`[12] ${n.name}: sector=${n.sector} ccw=${n.ccw} paramName=${n.paramName}`)
  }

  await snapshot('angle-sectors-all')
  return { partId }
}
